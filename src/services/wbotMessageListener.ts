import sendMessageWTyping from '../utils/sendMessageWtyping';
import handleAddCommand from './handleAddCommand';
import handleGroup from './handleGroups';
import { Session } from './wbotService';
import {
	MessageUpsertType,
	proto,
	WAMessageStubType,
	WAMessage,
	getContentType,
} from '@adiwajshing/baileys';
import { PrismaClient } from '@prisma/client';
import handleDeleteCommand from './handleDeleteCommand';

interface ImessageUpsert {
	messages: proto.IWebMessageInfo[];
	type: MessageUpsertType;
}

interface IMe {
	name: string;
	id: string;
}

const prisma = new PrismaClient();
const commands = ['!add', '!del', '!list', '!help', '!mention', '!dice', '!letter'];

const getTypeMessage = (msg: proto.IWebMessageInfo): string => {
	if (!msg.message) return 'unknown';
	return getContentType(msg.message) as string;
};

const isValidMsg = (msg: proto.IWebMessageInfo): boolean => {
	if (msg.key.remoteJid === 'status@broadcast') return false;
	const msgType = getTypeMessage(msg);
	const ifType =
		msgType === 'conversation' ||
		msgType === 'locationMessage' ||
		msgType === 'extendedTextMessage' ||
		msgType === 'audioMessage' ||
		msgType === 'videoMessage' ||
		msgType === 'imageMessage' ||
		msgType === 'documentMessage' ||
		msgType === 'stickerMessage' ||
		msgType === 'buttonsResponseMessage' ||
		msgType === 'listResponseMessage' ||
		msgType === 'listMessage' ||
		msgType === 'contactMessage';

	return !!ifType;
};

const filterMessages = (msg: WAMessage): boolean => {
	if (msg.message?.protocolMessage) return false;

	if (
		[
			WAMessageStubType.REVOKE,
			WAMessageStubType.E2E_DEVICE_CHANGED,
			WAMessageStubType.E2E_IDENTITY_CHANGED,
			WAMessageStubType.CIPHERTEXT,
		].includes(msg.messageStubType as WAMessageStubType)
	)
		return false;

	return true;
};

export const wbotBotMessageListener = async (sock: Session) => {
	try {
		console.log(`wbotBotMessageListener iniciado: ${sock.id}`);
		sock.ev.on('messages.upsert', async (message: ImessageUpsert) => {
			console.log('recv messages ', JSON.stringify(message, undefined, 2));

			const messages = message.messages.filter(filterMessages).map((msg) => msg);

			if (!messages) {
				return;
			}

			messages.forEach(async (msg) => {
				if (!msg.message) return;

				if (!msg?.message?.conversation) return;

				const msgText = msg?.message?.conversation;
				const isValid = isValidMsg(msg);
				if (!isValid) {
					return;
				}

				const remoteJid = msg.key.remoteJid;
				if (!remoteJid) return;

				const isGroup = remoteJid.endsWith('@g.us');

				if (!isGroup) {
					console.log(`Não é grupo: ${remoteJid}`);
					return;
				}

				const groupMeta = await sock.groupMetadata(remoteJid);
				const participants = groupMeta?.participants;
				console.log(JSON.stringify(groupMeta, undefined, 2));

				const group = await handleGroup({
					sock,
					groupData: groupMeta,
					serializedId: sock.user?.id || '',
				});
				console.log({ group });
				if (!msg.key.fromMe) {
					const isMasterCommand = commands.some((cmd) => msgText?.startsWith(cmd));
					const isNormalCommand = msgText?.startsWith('$');
					console.log({ isMasterCommand, isNormalCommand });
					if (isNormalCommand && group) {
						const command = msgText?.split(' ')[0];

						const dbCommand = await prisma.commands.findFirst({
							where: {
								command_name: command,
							},
						});

						if (dbCommand) {
							console.log({ dbCommand });
							await sendMessageWTyping(
								{
									text: dbCommand.command_content,
								},
								remoteJid,
								sock
							);
						}

						return;
					}

					if (isMasterCommand && group) {
						console.log('é comando');
						const command = msgText?.split(' ')[0];
						const commandType = msgText?.split(' ')[1];
						const commandContent = msgText?.split(' ')[2];
						console.log({ command, commandContent, commandType });
						// get all string between quotes and remove quotes

						if (!commandType?.startsWith('$') && command === '!add') {
							await sendMessageWTyping(
								{
									text: `Comandos devem começar com $`,
								},
								remoteJid,
								sock
							);
							return;
						}

						switch (command) {
							case '!add':
								const regex = /"([^"]*)"/;
								const matchesCommand = msgText?.match(regex);

								console.log({ matchesCommand });
								if (!matchesCommand) return;
								const commandWithoutQuotes = matchesCommand.map((cmd) => cmd.replace(/"/g, ''));
								const newCommand = await handleAddCommand({
									command: commandType,
									command_content: commandWithoutQuotes[0],
									groupId: group.id,
								});

								if (newCommand) {
									await sendMessageWTyping(
										{
											text: `Comando adicionado com sucesso`,
										},
										remoteJid,
										sock
									);
								}
								console.log({ newCommand });
							case '!del':
								console.log('aqui');
								const teste = await handleDeleteCommand({
									command: commandType,
									groupId: group.id,
									sock,
									remoteJid,
								});

								console.log({ teste });
							case '!mention':
								let mentionString = '';
								participants?.forEach((p) => {
									mentionString += `@${p.id.split('@')[0]} `;
								});

								await sock.sendMessage(remoteJid, {
									text: 'domlimas \n' + mentionString,
									mentions: participants?.map((p) => p.id),
								});

								return;
							case '!list':
								return;
							case '!help':
								return;
							case '!dice':
								const dice = Math.floor(Math.random() * 6) + 1;
								await sendMessageWTyping(
									{
										text: `O número sorteado foi ${dice}`,
									},
									remoteJid,
									sock
								);
								return;
							case '!letter':
								const letter = Math.floor(Math.random() * 26) + 1;
								const letterString = String.fromCharCode(64 + letter);
								await sendMessageWTyping(
									{
										text: `A letra sorteada foi ${letterString}`,
									},
									remoteJid,
									sock
								);
								return;
							default:
								break;
						}

						return;
					}

					await sendMessageWTyping(
						{
							text: msgText || 'Não entendi',
						},
						remoteJid,
						sock
					);
				}
			});
		});
	} catch (error: any) {
		console.error(error);
		console.log(`Error in wbotBotMessageListener: ${error?.message}`);
	}
};

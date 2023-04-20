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

interface ImessageUpsert {
	messages: proto.IWebMessageInfo[];
	type: MessageUpsertType;
}

interface IMe {
	name: string;
	id: string;
}

const prisma = new PrismaClient();
const commands = ['!add', '!remove', '!list', '!help'];

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
			console.log('teste');
			console.log('recv messages ', JSON.stringify(message, undefined, 2));
			console.log('estou aquiiiiiiiiiii 1');

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

				console.log({ isGroup });

				if (!isGroup) {
					console.log(`Não é grupo: ${remoteJid}`);
					return;
				}

				const groupMeta = await sock.groupMetadata(remoteJid);
				console.log({ groupMeta });

				const group = await handleGroup({
					sock,
					groupData: groupMeta,
					serializedId: sock.user?.id || '',
				});
				console.log({ group });
				if (!msg.key.fromMe) {
					const isMasterCommand = commands.some((cmd) => msgText?.startsWith(cmd));
					const isNormalCommand = msgText?.startsWith('$');

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

						const regex = /"(.*?)"/g;
						const matchesCommand = msgText?.match(regex);

						console.log({ matchesCommand });
						if (!matchesCommand) return;
						const formatedCommand = matchesCommand.map((cmd) => cmd.replace(/"/g, ''));
						switch (command) {
							case '!add':
								const newCommand = await handleAddCommand({
									command: commandType,
									command_content: formatedCommand[0],
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

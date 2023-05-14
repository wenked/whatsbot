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
import handleChangeGroupSettings from './handleCloseGroup';
import handleAddHouseMember from './handleAddHouseMember';
import handleDeleteHouseMember from './handleDeleteHouseMember';
import handleEditHouseMember from './handleEditHouseMember';

interface ImessageUpsert {
	messages: proto.IWebMessageInfo[];
	type: MessageUpsertType;
}

interface IMe {
	name: string;
	id: string;
}

const prisma = new PrismaClient();
const houseNamesArray = ['sly', 'gryff', 'huff', 'raven'];
type houseName = 'sly' | 'gryff' | 'huff' | 'raven';
const commands = [
	'!add',
	'!del',
	'!edit',
	'!list',
	'!help',
	'!mention',
	'!dice',
	'!letter',
	'!close',
	'!open',
	'!add_house',
	'!del_house',
	'!edit_house',
	'!list_house',
	'!sly',
	'!gryff',
	'!huff',
	'!raven',
];

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
				console.log({ teste: msg?.message?.extendedTextMessage?.text });
				if (!msg?.message?.conversation && !msg?.message?.extendedTextMessage?.text) return;
				console.log('oi	');
				const msgText = msg?.message?.conversation || msg?.message?.extendedTextMessage?.text;
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

				const isAdminOrSuperAdmin = participants?.some(
					(p) => p.id === msg.key.participant && (p.admin === 'admin' || p.admin === 'superadmin')
				);
				console.log({ isAdminOrSuperAdmin });
				console.log(JSON.stringify(groupMeta, undefined, 2));

				const group = await handleGroup({
					sock,
					groupData: groupMeta,
					serializedId: sock.user?.id || '',
					prisma,
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

					if (isMasterCommand && group && isAdminOrSuperAdmin) {
						console.log('é comando');
						const command = msgText?.split(' ')[0];
						const commandType = msgText?.split(' ')[1];
						const commandContent = msgText?.split(' ')[2];
						console.log({ command, commandContent, commandType });
						// get all string between quotes and remove quotes

						if (!commandType) {
							await sendMessageWTyping(
								{
									text: `Comando inválido`,
								},
								remoteJid,
								sock
							);
							return;
						}

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
									prisma,
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

								return;
							case '!del':
								console.log('aqui');
								const teste = await handleDeleteCommand({
									command: commandType,
									groupId: group.id,
									sock,
									remoteJid,
									prisma,
								});
								console.log({ teste });
								return;

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
								const normalCommands = await prisma.commands.findMany({
									where: { group_id: group.id },
								});

								let adminComands = '*Comandos de ADMINS*\n';
								commands.forEach((cmd) => (adminComands += `\n${cmd}`));

								const commandsString = normalCommands.map((cmd) => cmd.command_name).join('\n');

								await sendMessageWTyping(
									{
										text: adminComands + '\n' + commandsString,
									},
									remoteJid,
									sock
								);
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
							case '!close':
								await handleChangeGroupSettings({
									sock,
									groupData: groupMeta,
									type: 'announcement',
								});
								console.log('grupo fechado com sucesso');
								return;
							case '!open':
								await handleChangeGroupSettings({
									sock,
									groupData: groupMeta,
									type: 'not_announcement',
								});

								console.log('grupo aberto com sucesso');
								return;
							case '!add_house':
								const number = msgText?.split(' ')[1];
								const houseName = msgText?.split(' ')[2];
								console.log({ houseName });
								if (!number || !houseName) {
									await sendMessageWTyping(
										{
											text: `Adicione o número e o nome da casa`,
										},
										remoteJid,
										sock
									);
									return;
								}

								if (!houseNamesArray.includes(houseName)) {
									await sendMessageWTyping(
										{
											text: `Nome incorreto da comunal`,
										},
										remoteJid,
										sock
									);
									return;
								}

								const newUser = await handleAddHouseMember({
									number,
									house: houseName as houseName,
									groupData: groupMeta,
									sock,
									prisma,
								});

								console.log({ newUser });
								return;
							case '!del_house':
								const numberDel = msgText?.split(' ')[1];

								if (!numberDel) {
									await sendMessageWTyping(
										{
											text: `Número necessário para remover membro`,
										},
										remoteJid,
										sock
									);
									return;
								}

								await handleDeleteHouseMember({
									number: numberDel,
									groupData: groupMeta,
									sock,
									prisma,
								});

								return;
							case '!edit_house':
								const numberEdit = msgText?.split(' ')[1];
								const houseNameEdit = msgText?.split(' ')[2];

								if (!numberEdit || !houseNameEdit) {
									await sendMessageWTyping(
										{
											text: `Número e nome da comunal necessários para editar`,
										},
										remoteJid,
										sock
									);
									return;
								}

								if (!houseNamesArray.includes(houseNameEdit)) {
									await sendMessageWTyping(
										{
											text: `Nome incorreto da comunal`,
										},
										remoteJid,
										sock
									);
									return;
								}

								await handleEditHouseMember({
									number: numberEdit,
									house: houseNameEdit as houseName,
									groupData: groupMeta,
									sock,
									prisma,
								});

								return;
							case '!list_house':
								return;
							case '!sly':
								return;
							case '!gryff':
								return;
							case '!raven':
								return;
							case '!huff':
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

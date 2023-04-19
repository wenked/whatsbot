import { Session } from './wbotService';
import {
	MessageUpsertType,
	proto,
	WAMessageStubType,
	WAMessage,
	getContentType,
} from '@adiwajshing/baileys';

interface ImessageUpsert {
	messages: proto.IWebMessageInfo[];
	type: MessageUpsertType;
}

interface IMe {
	name: string;
	id: string;
}

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

				const isValid = isValidMsg(msg);
				if (!isValid) {
					return;
				}

				const remoteId = msg.key.remoteJid;

				const isGroup = remoteId.endsWith('@g.us');
			});
		});
	} catch (error: any) {
		console.error(error);
		console.log(`Error in wbotBotMessageListener: ${error?.message}`);
	}
};

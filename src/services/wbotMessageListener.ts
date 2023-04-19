import { Session } from './wbotService';
import { MessageUpsertType, proto } from '@adiwajshing/baileys';

interface ImessageUpsert {
	messages: proto.IWebMessageInfo[];
	type: MessageUpsertType;
}

interface IMe {
	name: string;
	id: string;
}

export const wbotBotMessageListener = async (sock: Session) => {
	try {
		console.log(`wbotBotMessageListener iniciado: ${sock.id}`);
		sock.ev.on('messages.upsert', async (message: ImessageUpsert) => {
			console.log('teste');
			console.log('recv messages ', JSON.stringify(message, undefined, 2));
			console.log('estou aquiiiiiiiiiii 1');
		});
	} catch (error: any) {
		console.error(error);
		console.log(`Error in wbotBotMessageListener: ${error?.message}`);
	}
};

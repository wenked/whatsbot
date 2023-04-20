import { WASocket, delay, AnyMessageContent } from '@adiwajshing/baileys';

const sendMessageWTyping = async (msg: AnyMessageContent, jid: string, sock: WASocket) => {
	await sock.presenceSubscribe(jid);
	await delay(500);

	await sock.sendPresenceUpdate('composing', jid);
	await delay(2000);

	await sock.sendPresenceUpdate('paused', jid);

	const teste = await sock.sendMessage(jid, msg);
};

export default sendMessageWTyping;

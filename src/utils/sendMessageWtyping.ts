import { WASocket, delay, AnyMessageContent } from '@adiwajshing/baileys';

const sendMessageWTyping = async (msg: AnyMessageContent, jid: string, sock: WASocket) => {
	await sock.presenceSubscribe(jid);
	await delay(500);

	await sock.sendPresenceUpdate('composing', jid);
	await delay(500);

	await sock.sendPresenceUpdate('paused', jid);

	const sendedMsg = await sock.sendMessage(jid, msg);

	return sendedMsg;
};

export default sendMessageWTyping;

import { Session } from './wbotService';

interface participant {
	id: string;
	admin: string | null;
}

interface handleMentionAllInterface {
	participants: participant[];
	remoteJid: string;
	sock: Session;
	text?: string;
}

const handleMentionAll = async (params: handleMentionAllInterface) => {
	try {
		const { participants, remoteJid, sock, text } = params;

		let mentionString = '';
		participants?.forEach((p) => {
			mentionString += `@${p.id.split('@')[0]} `;
		});

		await sock.sendMessage(remoteJid, {
			text: text ? `${text}\n${mentionString}` : mentionString,
			mentions: participants?.map((p) => p.id),
		});

		return;
	} catch (error: any) {
		console.log(`handleMentionAll error: ${error?.message}`);
		throw new Error(error);
	}
};

export default handleMentionAll;

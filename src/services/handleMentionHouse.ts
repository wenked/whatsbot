import { PrismaClient } from '@prisma/client';

import sendMessageWTyping from '../utils/sendMessageWtyping';
import { Session } from './wbotService';
import { GroupMetadata } from '@adiwajshing/baileys';
import { getFullHouseEmoji, getHouseEmoji } from '../utils/getHouseEmoji';

interface handleMentionHouseInterface {
	groupData: GroupMetadata;
	sock: Session;
	prisma: PrismaClient;
	house: 'Slytherin' | 'Gryffindor' | 'Hufflepuff' | 'Ravenclaw';
}

const handleMentionHouse = async (params: handleMentionHouseInterface) => {
	try {
		const { groupData, sock, prisma, house } = params;
		const houseMembers = await prisma.member.findMany({
			where: {
				house,
			},
		});

		if (houseMembers.length === 0) {
			await sendMessageWTyping(
				{
					text: `Não há membros nessa comunal ainda 😢`,
				},
				groupData.id,
				sock
			);
			return;
		}

		let message = `*Membros da  ${house} ${getFullHouseEmoji(house)}:*\n\n`;

		houseMembers.forEach((member) => {
			const number = member.serialized_id.replace('@s.whatsapp.net', '');
			message += `@${number}\n`;
		});

		await sendMessageWTyping(
			{
				text: message,
				mentions: houseMembers.map((member) => member.serialized_id),
			},
			groupData.id,
			sock
		);
	} catch (error: any) {
		console.log(`handleMentionHouse error: ${error?.message}`);
		throw new Error(error);
	}
};

export default handleMentionHouse;

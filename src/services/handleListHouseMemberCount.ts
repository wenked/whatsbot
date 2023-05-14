import { PrismaClient } from '@prisma/client';

import sendMessageWTyping from '../utils/sendMessageWtyping';
import { Session } from './wbotService';
import { GroupMetadata } from '@adiwajshing/baileys';
import { getFullHouseEmoji, getHouseEmoji } from '../utils/getHouseEmoji';

interface handleListHouseMembersInterface {
	groupData: GroupMetadata;
	sock: Session;
	prisma: PrismaClient;
}

const handleListHouseMembers = async (params: handleListHouseMembersInterface) => {
	try {
		const { groupData, sock, prisma } = params;
		const houseCounts = await prisma.member.groupBy({
			by: ['house'],
			_count: {
				house: true,
			},
		});

		let message = `*Contagem de membros das comunais ❤️💛💚💙:*\n\n`;

		houseCounts.forEach((house) => {
			message += `_*${house.house}*_ ${getFullHouseEmoji(house.house)}: ${house._count.house}\n`;
		});

		await sendMessageWTyping(
			{
				text: message,
			},
			groupData.id,
			sock
		);
	} catch (error: any) {
		console.log(`handleListHouseMembers error: ${error?.message}`);
		throw new Error(error);
	}
};

export default handleListHouseMembers;

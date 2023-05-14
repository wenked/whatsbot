import { PrismaClient } from '@prisma/client';
import getHouse from '../utils/getHouse';
import { Session } from './wbotService';
import { GroupMetadata } from '@adiwajshing/baileys';
import sendMessageWTyping from '../utils/sendMessageWtyping';
import getHouseEmoji from '../utils/getHouseEmoji';

interface handleAddHouseMemberInterface {
	groupData: GroupMetadata;
	sock: Session;
	prisma: PrismaClient;
	house: 'sly' | 'gryff' | 'raven' | 'huff';
	number: string;
}

const handleAddHouseMember = async (params: handleAddHouseMemberInterface) => {
	try {
		const { groupData, sock, prisma, house, number } = params;
		const groupParticipants = groupData.participants.map((participant) => participant.id);
		let serializedId = `55${number}@s.whatsapp.net`;

		if (number.includes('@')) {
			//remove first character of string
			serializedId = `${number.substring(1)}@s.whatsapp.net`;
		}

		const userIsInGroup = groupParticipants.includes(serializedId);

		if (!userIsInGroup) {
			await sendMessageWTyping(
				{
					text: `O número precisa estar no grupo para ser adicionado a uma comunal`,
				},
				groupData.id,
				sock
			);

			return;
		}

		const user = await prisma.member.findFirst({
			where: {
				serialized_id: serializedId,
			},
		});

		if (user?.house) {
			await sendMessageWTyping(
				{
					text: `O número já está em uma comunal`,
				},
				groupData.id,
				sock
			);

			return;
		}

		const newUser = await prisma.member.create({
			data: {
				serialized_id: serializedId,
				house: getHouse(house),
			},
		});

		const mentionString = `@${serializedId.split('@')[0]}`;
		await sendMessageWTyping(
			{
				text: `${mentionString} adicionadx a ${getHouse(house)} ${getHouseEmoji(house)} com sucesso!`,
				mentions: [serializedId],
			},
			groupData.id,
			sock
		);

		return newUser;
	} catch (error: any) {
		console.log(`handleAddHouseMember error: ${error?.message}`);
		throw new Error(error);
	}
};

export default handleAddHouseMember;

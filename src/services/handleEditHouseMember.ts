import { PrismaClient } from '@prisma/client';
import getHouse from '../utils/getHouse';
import { Session } from './wbotService';
import { GroupMetadata } from '@adiwajshing/baileys';
import sendMessageWTyping from '../utils/sendMessageWtyping';
import { getHouseEmoji, getFullHouseEmoji } from '../utils/getHouseEmoji';

interface handleEditHouseMemberInterface {
	groupData: GroupMetadata;
	sock: Session;
	prisma: PrismaClient;
	house: 'sly' | 'gryff' | 'raven' | 'huff';
	number: string;
}

const handleEditHouseMember = async (params: handleEditHouseMemberInterface) => {
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
					text: `O número precisa estar no grupo para ser editado`,
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

		if (!user) {
			await sendMessageWTyping(
				{
					text: `Membro não encontrado`,
				},
				groupData.id,
				sock
			);

			return;
		}

		if (user?.house === getHouse(house)) {
			await sendMessageWTyping(
				{
					text: `O número já está na comunal ${getHouse(house)} ${getHouseEmoji(house)}`,
				},
				groupData.id,
				sock
			);

			return;
		}

		await prisma.member.update({
			where: {
				serialized_id: serializedId,
			},
			data: {
				house: getHouse(house),
			},
		});

		const mentionString = `@${serializedId.split('@')[0]}`;
		await sendMessageWTyping(
			{
				text: `${mentionString} movido da comunal _*${user?.house}*_ ${getFullHouseEmoji(
					user?.house
				)} para a _*${getHouse(house)}*_ ${getHouseEmoji(house)} com sucesso!`,
				mentions: [serializedId],
			},
			groupData.id,
			sock
		);

		return user;
	} catch (error: any) {
		console.log(`handleEditHouseMember error: ${error?.message}`);
		throw new Error(error);
	}
};

export default handleEditHouseMember;

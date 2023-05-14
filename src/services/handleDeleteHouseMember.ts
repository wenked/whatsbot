import { PrismaClient } from '@prisma/client';
import getHouse from '../utils/getHouse';
import { Session } from './wbotService';
import { GroupMetadata } from '@adiwajshing/baileys';
import sendMessageWTyping from '../utils/sendMessageWtyping';

interface handleDeleteHouseMemberInterface {
	groupData: GroupMetadata;
	sock: Session;
	prisma: PrismaClient;
	number: string;
}

const handleDeleteHouseMember = async (params: handleDeleteHouseMemberInterface) => {
	try {
		const { groupData, sock, prisma, number } = params;
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
					text: `O número precisa estar no grupo para ser excluido de uma comunal`,
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

		await prisma.member.delete({
			where: {
				serialized_id: serializedId,
			},
		});

		await sendMessageWTyping(
			{
				text: `Membro excluido com sucesso`,
			},
			groupData.id,
			sock
		);
	} catch (error: any) {
		console.log(`handleDeleteHouseMember error: ${error?.message}`);
		throw new Error(error);
	}
};

export default handleDeleteHouseMember;

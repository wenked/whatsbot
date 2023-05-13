import { GroupMetadata } from '@adiwajshing/baileys';
import { Session } from './wbotService';
import { PrismaClient } from '@prisma/client';

interface handleGroupInterface {
	sock: Session;
	groupData: GroupMetadata;
	serializedId: string;
	prisma: PrismaClient;
}

const handleGroup = async (params: handleGroupInterface) => {
	try {
		const prisma = params.prisma;
		let group = await prisma.group.findFirst({
			where: {
				owner_serialized_id: params.serializedId,
				group_id: params.groupData.id,
			},
		});

		if (!group) {
			group = await prisma.group.create({
				data: {
					group_id: params.groupData.id,
					name: params.groupData.subject,
					owner_serialized_id: params.serializedId,
				},
			});
		}

		console.log({ group });

		return group;
	} catch (error: any) {
		console.log('handleGroup error: ', error);
		throw new Error(error);
	}
};

export default handleGroup;

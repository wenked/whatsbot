import { PrismaClient } from '@prisma/client';

import sendMessageWTyping from '../utils/sendMessageWtyping';
import { Session } from './wbotService';

const prisma = new PrismaClient();

interface handleDeleteCommandInterface {
	command: string;
	groupId: number;
	remoteJid: string;
	sock: Session;
	prisma: PrismaClient;
}

const handleDeleteCommand = async (params: handleDeleteCommandInterface) => {
	try {
		const prisma = params.prisma;
		let commandExists = await prisma.commands.findFirst({
			where: {
				command_name: params.command,
				group_id: params.groupId,
			},
		});

		if (!commandExists) {
			await sendMessageWTyping(
				{
					text: `Comando não existe`,
				},
				params.remoteJid,
				params.sock
			);
			return;
		}

		const command = await prisma.commands.delete({
			where: {
				id: commandExists.id,
			},
		});

		await sendMessageWTyping(
			{
				text: `Comando excluído com sucesso`,
			},
			params.remoteJid,
			params.sock
		);

		console.log({ command });

		return command;
	} catch (error: any) {
		console.log(`handleDeleteCommand error: ${error?.message}`);
		throw new Error(error);
	}
};

export default handleDeleteCommand;

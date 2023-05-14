import { PrismaClient } from '@prisma/client';

interface handleAddCommandInterface {
	command: string;
	groupId: number;
	command_content: string;
	prisma: PrismaClient;
}

const handleAddCommand = async (params: handleAddCommandInterface) => {
	try {
		const prisma = params.prisma;
		let commandExists = await prisma.commands.findFirst({
			where: {
				command_name: params.command,
			},
		});

		if (commandExists) {
			return;
		}

		const command = await prisma.commands.create({
			data: {
				command_name: params.command,
				command_content: params.command_content,
				group_id: params.groupId,
			},
		});

		return command;
	} catch (error: any) {
		console.log(`handleAddCommand error: ${error?.message}`);
		throw new Error(error);
	}
};

export default handleAddCommand;

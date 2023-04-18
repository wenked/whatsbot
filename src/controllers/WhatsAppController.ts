import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { initWbot } from '../services/wbotService';

export const storeWhatsApp = async (req: Request, res: Response) => {
	try {
		const prisma = new PrismaClient();

		const whatsapp = await prisma.whatsapp.create({
			data: req.body,
		});

		await initWbot(whatsapp);

		return res.status(200).json({
			message: 'WhatsApp session created',
		});
	} catch (error: any) {
		console.error(error);
		console.error(`Error in storeWhatsApp: ${error?.message}`);

		return res.status(500).json({
			message: 'Error in storeWhatsApp',
		});
	}
};

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { initWbot, removeWbot } from '../services/wbotService';
import fs from 'fs';
import path from 'path';
import removeSessionService from '../services/removeSessionService';
const prisma = new PrismaClient();

export const storeWhatsApp = async (req: Request, res: Response) => {
	try {
		const whatsapp = await prisma.whatsapp.create({
			data: { ...req.body, status: 'PENDING' },
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

export const deleteWhatsApp = async (req: Request, res: Response) => {
	try {
		await prisma.whatsapp.delete({
			where: { id: Number(req.params.id) },
		});

		await removeWbot(Number(req.params.id));

		await removeSessionService(Number(req.params.id));

		return res.status(200).json({
			message: 'WhatsApp session deleted',
		});
	} catch (error: any) {
		console.error(error);
		console.error(`Error in deleteWhatsApp: ${error?.message}`);
		return res.status(500).json({
			message: 'Error in deleteWhatsApp',
		});
	}
};

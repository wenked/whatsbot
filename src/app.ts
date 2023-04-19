import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotev from 'dotenv';

import socket from './services/socket';
import { PrismaClient } from '@prisma/client';
import { initWbot } from './services/wbotService';
import { validateStoreWhatsapp, validateDeleteWhatsapp } from './middlewares/validateWhatsapp';
import { storeWhatsApp, deleteWhatsApp } from './controllers/WhatsAppController';
import { wbotBotMessageListener } from './services/wbotMessageListener';

dotev.config();

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.send('Heylo');
});

app.post('/whatsapp/store', validateStoreWhatsapp, storeWhatsApp);
app.delete('/whatsapp/delete/:id', validateDeleteWhatsapp, deleteWhatsApp);

process.on('uncaughtException', (err) => {
	console.log('uncaughtException');
	console.error(err);
});

const server = app.listen(5000, () => {
	console.log('Listening to 5000');
});

socket.init(server);

const startWhatsappSessions = async () => {
	try {
		const whatsappSessions = await prisma.whatsapp.findMany();

		for (const whatsapp of whatsappSessions) {
			try {
				const sock = await initWbot(whatsapp);
				wbotBotMessageListener(sock);
				console.log('koe xd');
			} catch (error: any) {
				console.log(error);
				console.log(`Error in startWhatsappSessions: ${error?.message}`);
			}
		}
	} catch (error) {
		console.log(error);
	}
};
startWhatsappSessions();

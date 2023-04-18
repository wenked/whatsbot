import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotev from 'dotenv';
import { startSock } from './services/wbotService';
import socket from './services/socket';
import { PrismaClient } from '@prisma/client';
import { initWbot } from './services/wbotService';
import { validateWhatsapp } from './middlewares/validateWhatsapp';
import { storeWhatsApp } from './controllers/WhatsAppController';

dotev.config();

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.send('Heylo');
});

app.post('/whatsapp/store', validateWhatsapp, storeWhatsApp);

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
			await initWbot(whatsapp);
		}
	} catch (error) {
		console.log(error);
	}
};

startWhatsappSessions();

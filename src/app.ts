import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotev from 'dotenv';
import { startSock } from './services/wbotService';
dotev.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.send('Heylo');
});

app.post('/api/post', (req, res) => {
	console.log(req.body);
	res.send(req.body);
});

process.on('uncaughtException', (err) => {
	console.log('uncaughtException');
	console.error(err);
});

app.listen(5000, () => {
	console.log('Listening to 5000');
});

const startWhatsappSessions = async () => {
	try {
		await startSock();
	} catch (error) {
		console.log(error);
	}
};

startWhatsappSessions();

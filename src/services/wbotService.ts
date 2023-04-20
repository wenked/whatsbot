import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import makeWASocket, {
	AnyMessageContent,
	delay,
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
	makeInMemoryStore,
	proto,
	useMultiFileAuthState,
	WAMessageContent,
	WAMessageKey,
	BaileysEventMap,
	WASocket,
} from '@adiwajshing/baileys';
import pino from 'pino';
import { PrismaClient, Whatsapp } from '@prisma/client';
import socket from './socket';

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new NodeCache();

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it

// start a connection

export type Session = WASocket & {
	id?: number;
};

const sessions: Session[] = [];
const prisma = new PrismaClient();

export const getWbot = (whatsappId: number): Session => {
	const sessionIndex = sessions.findIndex((s) => s.id === whatsappId);

	if (sessionIndex === -1) {
		throw new Error('Session not found');
	}
	return sessions[sessionIndex];
};

export const removeWbot = async (whatsappId: number, isLogout = true): Promise<void> => {
	try {
		const sessionIndex = sessions.findIndex((s) => s.id === whatsappId);
		if (sessionIndex !== -1) {
			if (isLogout) {
				sessions[sessionIndex].logout();
				sessions[sessionIndex].ws.close();
			}

			sessions.splice(sessionIndex, 1);
		}
	} catch (err: any) {
		console.error(err);
		console.error(`Error in removeWbot: ${err?.message}`);
	}
};

export const initWbot = async (whatsapp: Whatsapp): Promise<Session> => {
	return new Promise((resolve, reject) => {
		try {
			(async () => {
				const { state, saveCreds } = await useMultiFileAuthState(
					`./sessions/baileys_auth_info-${whatsapp.id}`
				);
				const io = socket.getIO();

				const { version, isLatest } = await fetchLatestBaileysVersion();
				console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

				const sock: Session = makeWASocket({
					version,
					printQRInTerminal: true,
					auth: {
						creds: state.creds,
						/** caching makes the store faster to send/recv messages */
						keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'error' })),
					},
					msgRetryCounterMap: {},
					generateHighQualityLinkPreview: true,
					logger: pino({ level: 'error' }),
					markOnlineOnConnect: true,
					// ignore all broadcast messages -- to receive the same
					// comment the line below out
					// shouldIgnoreJid: jid => isJidBroadcast(jid),
					// implement to handle retries & poll updates
				});

				sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
					const disconect = (lastDisconnect?.error as Boom)?.output?.statusCode;
					console.log({ lastDisconnect });
					console.log({ connection });
					if (connection === 'close') {
						// reconnect if not logged out

						if (disconect === 403) {
							removeWbot(whatsapp.id, false);
						}

						if (
							(lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
						) {
							initWbot(whatsapp);
						} else {
							console.log('Connection closed. You are logged out.');
							removeWbot(whatsapp.id, false);
							initWbot(whatsapp);
						}
					}

					if (connection === 'open') {
						await prisma.whatsapp.update({
							where: {
								id: whatsapp.id,
							},
							data: {
								status: 'CONNECTED',
								qr_code: '',
							},
						});
						const sessionIndex = sessions.findIndex((s) => s.id === whatsapp.id);
						if (sessionIndex === -1) {
							sock.id = whatsapp.id;
							sessions.push(sock);
						}

						io.emit('whatsappSession', {
							action: 'update',
							session: whatsapp,
						});

						resolve(sock);
					}

					if (qr !== undefined) {
						await prisma.whatsapp.update({
							where: {
								id: whatsapp.id,
							},
							data: {
								status: 'QRCODE',
								qr_code: qr,
							},
						});

						const sessionIndex = sessions.findIndex((s) => s.id === whatsapp.id);

						if (sessionIndex === -1) {
							sock.id = whatsapp.id;
							sessions.push(sock);
						}

						io.emit('whatsappSession', {
							action: 'update',
							session: whatsapp,
						});
					}
				});

				sock.ev.on('creds.update', saveCreds);

				console.log('estou aquiiiiiiiiiii 2');
			})();
		} catch (error: any) {
			console.log(error);
			console.log('Error in initWbot: ', error?.message);
			initWbot(whatsapp);
		}
	});
};

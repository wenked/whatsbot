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

const useStore = !process.argv.includes('--no-store');
const doReplies = !process.argv.includes('--no-reply');

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new NodeCache();

// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it

// start a connection

type Session = WASocket & {
	id?: number;
};

const sessions: Session[] = [];

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
	try {
		const { state, saveCreds } = await useMultiFileAuthState(`baileys_auth_info_${whatsapp.id}`);
		const { version, isLatest } = await fetchLatestBaileysVersion();
		console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

		const sock = makeWASocket({
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

		return sock;
	} catch (error: unknown) {
		console.error(error);
		throw new Boom('Error in initWbot');
	}
};

export const startSock = async () => {
	try {
		const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
		// fetch latest version of WA Web
		const { version, isLatest } = await fetchLatestBaileysVersion();
		console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

		const sock = makeWASocket({
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

		// the process function lets you process all events that just occurred
		// efficiently in a batch
		sock.ev.process(
			// events is a map for event name => event data
			async (events: Partial<BaileysEventMap>) => {
				// something about the connection changed
				// maybe it closed, or we received all offline message or connection opened
				if (events['connection.update']) {
					const update = events['connection.update'];
					const { connection, lastDisconnect } = update;
					if (connection === 'close') {
						// reconnect if not logged out
						if (
							(lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
						) {
							startSock();
						} else {
							console.log('Connection closed. You are logged out.');
						}
					}

					console.log('connection update', update);
				}

				// credentials updated -- save them
				if (events['creds.update']) {
					console.log('credentials updated');
					await saveCreds();
				}

				// received a new message
				if (events['messages.upsert']) {
					const upsert = events['messages.upsert'];
					console.log('teste');
					console.log('recv messages ', JSON.stringify(upsert, undefined, 2));
					/* 
					if (upsert.type === 'notify') {
						for (const msg of upsert.messages) {
							if (!msg.key.fromMe && doReplies) {
								console.log('replying to', msg.key.remoteJid);
								await sock!.readMessages([msg.key]);
								await sendMessageWTyping({ text: 'Hello there!' }, msg.key.remoteJid!);
							}
						}
					} */
				}
			}
		);

		return sock;
	} catch (error) {
		console.error(error);
	}
};

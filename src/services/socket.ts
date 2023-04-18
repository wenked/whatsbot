import { Server as SocketIO } from 'socket.io';
import { Server } from 'http';

let io: SocketIO;

export default {
	init: (httpServer: Server) => {
		io = new SocketIO(httpServer, {
			cors: {
				origin: '*',
			},
			transports: ['websocket', 'polling'],
		});
		return io;
	},
	getIO: () => {
		if (!io) {
			throw new Error('Socket IO not initialized');
		}
		return io;
	},
};

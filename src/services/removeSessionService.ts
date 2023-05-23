import path from 'path';
import fs from 'fs';

export default async function removeSessionService(whatsappId: Number) {
	try {
		console.log(`Removing session ${whatsappId}`);
		const sessionDirectory = path.join(__dirname, `../../sessions/baileys_auth_info-${whatsappId}`);

		if (fs.existsSync(sessionDirectory)) {
			fs.rmdirSync(sessionDirectory, { recursive: true });
		}
	} catch (error) {
		console.error(error);
	}
}

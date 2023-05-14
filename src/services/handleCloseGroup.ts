import { GroupMetadata } from '@adiwajshing/baileys';
import { Session } from './wbotService';
import { PrismaClient } from '@prisma/client';
import sendMessageWTyping from '../utils/sendMessageWtyping';
import { join } from 'path';

interface handleGroupInterface {
	sock: Session;
	groupData: GroupMetadata;
	type: 'announcement' | 'not_announcement' | 'unlocked' | 'locked';
}

const files = [
	'estv_01',
	'estv_02',
	'estv_03',
	'estv_04',
	'estv_05',
	'estv_06_close_group',
	'estv_07',
];

const handleChangeGroupSettings = async (params: handleGroupInterface) => {
	try {
		const { sock, groupData, type } = params;

		await sock.groupSettingUpdate(groupData.id, type);
		const audioPath = join(
			__dirname,
			'..',
			'static',
			`${files[Math.floor(Math.random() * files.length)]}.mpeg`
		);
		console.log({ audioPath });
		await sendMessageWTyping(
			{
				audio: {
					url: audioPath,
				},
				mimetype: 'audio/mpeg',
			},
			groupData.id,
			sock
		);
	} catch (error: any) {
		console.log('handleChangeGroupSettings error: ', error);
		throw new Error(error);
	}
};

export default handleChangeGroupSettings;

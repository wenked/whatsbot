import { PrismaClient } from '@prisma/client';

import sendMessageWTyping from '../utils/sendMessageWtyping';
import { Session } from './wbotService';
import { GroupMetadata } from '@adiwajshing/baileys';

interface handleRandomizeBoardInterface {
	groupData: GroupMetadata;
	sock: Session;
}

const matrixArray = [
	['📓', '💛', '🐍', '💍', '🦡', '☠️', '📘'],
	['💙', '⛺', '❤️', '📘', '☠️', '👑', '☠️'],
	['⛺', '💚', '⛺', '💛', '🐉', '☠️', '⚡'],
	['📘', '⚱️', '💙', '⛺', '❤️', '🗡️', '☠️'],
	['🦡', '⛺', '🐍', '💚', '🦁', '📘', '🦅'],
	['⛺', '📘', '⛺', '🛡️', '📘', '☠️', '📘'],
	['☠️', '⛺', '🦁', '☠️', '🦅', '📘', '⚡'],
];

const emojiLetters = ['🄰', '🄱', '🄲', '🄳', '🄴', '🄵', '🄶'];
const handleRandomizeBoard = async (params: handleRandomizeBoardInterface) => {
	try {
		const { groupData, sock } = params;
		const flattenedArray = matrixArray.flat();
		const length = flattenedArray.length;

		for (let i = length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[flattenedArray[i], flattenedArray[j]] = [flattenedArray[j], flattenedArray[i]];
		}

		let currentIndex = 0;
		for (let i = 0; i < matrixArray.length; i++) {
			for (let j = 0; j < matrixArray[i].length; j++) {
				matrixArray[i][j] = flattenedArray[currentIndex++];
			}
		}

		let boardString = ' 1⃣2⃣3⃣4⃣5⃣6⃣7⃣\n';
		console.log({ matrixArray });
		matrixArray.forEach((row, index) => {
			boardString += `${emojiLetters[index]}${row.join('')}\n`;
		});

		await sendMessageWTyping(
			{
				text: `🎲 *Tabuleiro randomizado* 🎲\n\n${boardString}`,
			},
			groupData.id,
			sock
		);
	} catch (error: any) {
		console.log(`handleRandomizeBoard error: ${error?.message}`);
		throw new Error(error);
	}
};

export default handleRandomizeBoard;

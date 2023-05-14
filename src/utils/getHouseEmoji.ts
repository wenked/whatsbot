// hearts emojis array

export const getHouseEmoji = (house: string) => {
	console.log({ house });
	switch (house) {
		case 'sly':
			return '💚🐍';
		case 'gryff':
			return '❤️🦁';
		case 'huff':
			return '💛🦡';
		case 'raven':
			return '💙🦅';
		default:
			return '💚🐍';
	}
};

export const getFullHouseEmoji = (house: string) => {
	switch (house) {
		case 'Slytherin':
			return '💚🐍';
		case 'Gryffindor':
			return '❤️🦁';
		case 'Hufflepuff':
			return '💛🦡';
		case 'Ravenclaw':
			return '💙🦅';
		default:
			return '💚🐍';
	}
};

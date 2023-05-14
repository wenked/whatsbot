const getHouseEmoji = (house: string) => {
	switch (house) {
		case 'sly' || 'Slytherin':
			return '🐍';
		case 'gryff' || 'Gryffindor':
			return '🦁';
		case 'huff' || 'Hufflepuff':
			return '🦡';
		case 'raven' || 'Ravenclaw':
			return '🦅';
		default:
			return '🐍';
	}
};

export default getHouseEmoji;

const getHouse = (house: string) => {
	switch (house) {
		case 'sly':
			return 'Slytherin';
		case 'gryff':
			return 'Gryffindor';
		case 'huff':
			return 'Hufflepuff';
		case 'raven':
			return 'Ravenclaw';
		default:
			return 'Slytherin';
	}
};

export default getHouse;

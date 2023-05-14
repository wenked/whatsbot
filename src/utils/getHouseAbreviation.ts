const getHouseAbreviation = (house: string) => {
	switch (house) {
		case 'Slytherin':
			return 'sly';
		case 'Gryffindor':
			return 'gryff';
		case 'Hufflepuff':
			return 'huff';
		case 'Ravenclaw':
			return 'raven';
		default:
			return ~'unknown';
	}
};

export default getHouseAbreviation;

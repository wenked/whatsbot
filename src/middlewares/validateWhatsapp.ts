import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateStoreWhatsapp = (req: Request, res: Response, next: NextFunction) => {
	try {
		const schema = z.object({
			name: z
				.string()
				.min(1, {
					message: 'Name should be at least 1 character long',
				})
				.max(255, {
					message: 'Name should be at most 255 characters long',
				}),
		});

		schema.parse(req.body);

		next();
	} catch (error: any) {
		console.log(error);
		res.status(400).json({ message: error.message });
	}
};

export const validateDeleteWhatsapp = (req: Request, res: Response, next: NextFunction) => {
	try {
		const schema = z.object({
			id: z.string(),
		});

		schema.parse(req.params);

		next();
	} catch (error: any) {
		console.log(error);
		res.status(400).json({ message: error.message });
	}
};

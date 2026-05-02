export type ErrorId = string;

export type ErrorContact = {
	email: string;
	subject: string;
	prompt: string;
};

export type AppError = {
	id: string;
	message: string;
	contact?: ErrorContact;
};

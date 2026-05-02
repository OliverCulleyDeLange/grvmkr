export type AppErrorContactUi = {
	email: string;
	mailto: string;
	prompt: string;
};

export type AppErrorUi = {
	id: string;
	message: string;
	contact?: AppErrorContactUi;
};

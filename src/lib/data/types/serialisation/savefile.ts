// We deserialise the json file as this object first which tells us the version
export type SaveFile = {
	type: 'savefile';
	version: number;
};

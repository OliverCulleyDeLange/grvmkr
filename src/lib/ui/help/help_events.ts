// Help Events
export type HelpEvents =
	Reset
	| LoadExampleFile;

export enum HelpEvent {
	Reset = 'Reset',
	LoadExampleFile = 'LoadExampleFile',
}

export type Reset = {
	event: HelpEvent.Reset;
};

export type LoadExampleFile = {
	event: HelpEvent.LoadExampleFile;
};

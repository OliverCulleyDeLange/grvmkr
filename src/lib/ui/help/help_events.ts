// Help Events
export type HelpEvents = Reset | Debug | LoadExampleFile;

export enum HelpEvent {
	Reset = 'Reset',
	LoadExampleFile = 'LoadExampleFile',
	Debug = 'Debug'
}

export type Reset = {
	event: HelpEvent.Reset;
};

export type Debug = {
	event: HelpEvent.Debug;
};

export type LoadExampleFile = {
	event: HelpEvent.LoadExampleFile;
};

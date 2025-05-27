// Toolbar UI Events
export type ToolbarEvents =
	| New
	| Save
	| LoadFile
	| LoadLocalGroove
	| DeleteLocalGroove
	| Reset
	| FileNameChanged
	| DismissError
	| GrooveSelectorShown;

export enum ToolbarEvent {
	New = 'New',
	Save = 'Save',
	LoadFile = 'Load',
	LoadLocalGroove = 'LoadLocalGroove',
	DeleteLocalGroove = 'DeleteLocalGroove',
	Reset = 'Reset',
	FileNameChanged = 'FileNameChanged',
	DismissError = 'DismissError',
	GrooveSelectorShown = 'GrooveSelectorShown'
}

export type New = {
	event: ToolbarEvent.New;
};
export type Reset = {
	event: ToolbarEvent.Reset;
};
export type Save = {
	event: ToolbarEvent.Save;
};
export type LoadFile = {
	event: ToolbarEvent.LoadFile;
	file: File;
};
export type LoadLocalGroove = {
	event: ToolbarEvent.LoadLocalGroove;
	id: string;
};
export type DeleteLocalGroove = {
	event: ToolbarEvent.DeleteLocalGroove;
	id: string;
};
export type FileNameChanged = {
	event: ToolbarEvent.FileNameChanged;
	fileName: string;
};
export type DismissError = {
	event: ToolbarEvent.DismissError;
	id: string;
};
export type GrooveSelectorShown = {
	event: ToolbarEvent.GrooveSelectorShown;
};

// Toolbar UI components
export type ToolbarUi = {
	dark: boolean;
	errors: AppErrorUi[];
	fileName: string;
};

export type AppErrorUi = {
	id: string;
	message: string;
};

// Toolbar UI Events
export type ToolbarEvents =
	| New
	| Save
	| LoadFile
	| LoadLocalGroove
	| DeleteLocalGroove
	| FileNameChanged
	| DismissError
	| GrooveSelectorShown
	| TogglePlayingFile;

export enum ToolbarEvent {
	New = 'New',
	Save = 'Save',
	LoadFile = 'Load',
	LoadLocalGroove = 'LoadLocalGroove',
	DeleteLocalGroove = 'DeleteLocalGroove',
	Reset = 'Reset',
	FileNameChanged = 'FileNameChanged',
	DismissError = 'DismissError',
	GrooveSelectorShown = 'GrooveSelectorShown',
	TogglePlayingFile = 'TogglePlayingFile'
}

export type New = {
	event: ToolbarEvent.New;
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

export type TogglePlayingFile = {
	event: ToolbarEvent.TogglePlayingFile;
};

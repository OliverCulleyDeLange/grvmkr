import type { CellToolsEvents, GridEvents, InstrumentEvents, ProblemEvent, ProblemEvents, ToolbarEvents } from '$lib';

export type OnUiEvent = (event: UiEvents) => void;

export type UiEvents =
	// Domain specific events
	| CellToolsEvents
	| GridEvents
	| InstrumentEvents
	| ToolbarEvents
	| ProblemEvents
	// Generic UI events (below)
	| Mounted
	| Copy
	| Paste
	| PlayPause;

export enum UiEvent {
	Mounted = 'Mounted',
	Copy = 'Copy',
	Paste = 'Paste',
	PlayPause = 'PlayPause'
}

export type Mounted = {
	event: UiEvent.Mounted;
};
export type Copy = {
	event: UiEvent.Copy;
};
export type Paste = {
	event: UiEvent.Paste;
};
export type PlayPause = {
	event: UiEvent.PlayPause;
};

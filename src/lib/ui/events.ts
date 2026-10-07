import type {
	CellToolsEvents,
	GridEvents,
	HelpEvents,
	InstrumentEvents,
	ProblemEvents,
	ToolbarEvents
} from '$lib';

export type OnUiEvent = (event: UiEvents) => void;

export type UiEvents =
	// Domain specific events
	| CellToolsEvents
	| GridEvents
	| InstrumentEvents
	| ToolbarEvents
	| HelpEvents
	| ProblemEvents
	// Generic UI events (below)
	| Mounted
	| Copy
	| Paste
	| PlayPause
	| TypeHitKey
	| ClearHits
	| MoveCellSelection;

export enum UiEvent {
	Mounted = 'Mounted',
	Copy = 'Copy',
	Paste = 'Paste',
	PlayPause = 'PlayPause',
	TypeHitKey = 'TypeHitKey',
	ClearHits = 'ClearHits',
	MoveCellSelection = 'MoveCellSelection'
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
export type TypeHitKey = {
	event: UiEvent.TypeHitKey;
	key: string;
};
export type ClearHits = {
	event: UiEvent.ClearHits;
};
export type MoveCellSelection = {
	event: UiEvent.MoveCellSelection;
	direction: 'up' | 'down' | 'left' | 'right';
};

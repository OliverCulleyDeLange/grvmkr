import type { CellLocator, GridId, GridSectionId } from '$lib';

// Grid UI Events
export type GridEvents =
	| TogglePlayingGrid
	| TappedGridCell
	| StartCellSelection
	| ChangeCellSelection
	| RemoveGrid
	| AddGrid
	| DuplicateGrid
	| BpmChanged
	| RepetitionsChanged
	| BarsChanged
	| GridSizeChanged
	| NameChanged
	| VolumeChanged
	| MuteInstrument
	| SoloInstrument
	| ToggleToolsExpansion
	| ScrolledToGrid
	| MoveGridDown
	| MoveGridUp;

export enum GridEvent {
	TogglePlayingGrid = 'TogglePlayingGrid',
	TappedGridCell = 'TappedGridCell',
	StartCellSelection = 'StartCellSelection',
	ChangeCellSelection = 'ChangeCellSelection',
	AddGrid = 'AddGrid',
	DuplicateGrid = 'DuplicateGrid',
	RemoveGrid = 'RemoveGrid',
	RepetitionsChanged = 'RepetitionsChanged',
	BpmChanged = 'BpmChanged',
	BarsChanged = 'BarsChanged',
	GridSizeChanged = 'GridSizeChanged',
	NameChanged = 'NameChanged',
	VolumeChanged = 'VolumeChanged',
	MuteInstrument = 'MuteInstrument',
	SoloInstrument = 'SoloInstrument',
	MoveGridUp = 'MoveGridUp',
	MoveGridDown = 'MoveGridDown',
	ToggleToolsExpansion = 'ToggleToolsExpansion',
	ScrolledToGrid = 'ScrolledToGrid'
}

export type TogglePlayingGrid = {
	event: GridEvent.TogglePlayingGrid;
	gridId: GridId;
};
export type TappedGridCell = {
	event: GridEvent.TappedGridCell;
	locator: CellLocator;
	shiftHeld: boolean;
};
export type StartCellSelection = {
	event: GridEvent.StartCellSelection;
	locator: CellLocator;
	shiftHeld: boolean;
};
export type ChangeCellSelection = {
	event: GridEvent.ChangeCellSelection;
	locator: CellLocator;
};
export type RemoveGrid = {
	event: GridEvent.RemoveGrid;
	gridId: GridId;
};
export type AddGrid = {
	event: GridEvent.AddGrid;
};
export type DuplicateGrid = {
	event: GridEvent.DuplicateGrid;
	gridId: GridId;
};
export type RepetitionsChanged = {
	event: GridEvent.RepetitionsChanged;
	gridId: GridId;
	repetitions: number;
};
export type BpmChanged = {
	event: GridEvent.BpmChanged;
	gridId: GridId;
	bpm: number;
};
export type BarsChanged = {
	event: GridEvent.BarsChanged;
	gridId: GridId;
	bars: number;
};
export type GridSizeChanged = {
	event: GridEvent.GridSizeChanged;
	gridId: GridId;
	beats_per_bar: number;
	beat_divisions: number;
};
export type MoveGridDown = {
	event: GridEvent.MoveGridDown;
	gridId: GridId;
};

export type MoveGridUp = {
	event: GridEvent.MoveGridUp;
	gridId: GridId;
};

export type NameChanged = {
	event: GridEvent.NameChanged;
	gridId: GridId;
	name: string;
};
// Contains either delta or volume
export type VolumeChanged = {
	event: GridEvent.VolumeChanged;
	instrumentId: string;
	delta: number | undefined;
	volume: number | undefined;
};
export type MuteInstrument = {
	event: GridEvent.MuteInstrument;
	instrumentId: string;
};
export type SoloInstrument = {
	event: GridEvent.SoloInstrument;
	instrumentId: string;
};

export type ToggleToolsExpansion = {
	event: GridEvent.ToggleToolsExpansion;
	id: GridId;
};

export type ScrolledToGrid = {
	event: GridEvent.ScrolledToGrid;
	grid: GridSectionId;
};

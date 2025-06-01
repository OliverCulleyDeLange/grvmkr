import type { CellLocator, GridId } from '$lib';

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
	| BarsChanged
	| GridSizeChanged
	| NameChanged
	| VolumeChanged
	| MuteInstrument
	| SoloInstrument;

export enum GridEvent {
	TogglePlayingGrid = 'TogglePlayingGrid',
	TappedGridCell = 'TappedGridCell',
	StartCellSelection = 'StartCellSelection',
	ChangeCellSelection = 'ChangeCellSelection',
	AddGrid = 'AddGrid',
	DuplicateGrid = 'DuplicateGrid',
	RemoveGrid = 'RemoveGrid',
	BpmChanged = 'BpmChanged',
	BarsChanged = 'BarsChanged',
	GridSizeChanged = 'GridSizeChanged',
	NameChanged = 'NameChanged',
	VolumeChanged = 'VolumeChanged',
	MuteInstrument = 'MuteInstrument',
	SoloInstrument = 'SoloInstrument'
}

export type TogglePlayingGrid = {
	event: GridEvent.TogglePlayingGrid;
	playing: boolean;
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

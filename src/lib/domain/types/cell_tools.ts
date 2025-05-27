import type { GridId, HitTypeWithId, InstrumentWithId } from '$lib';

export type CellTools =
	| CellToolsForSingleCellSelection
	| CellToolsForMultiCellSelection
	| CellToolsForEmptyCellSelection;

export type SelectedCellToolsBase = {
	gridId: GridId;
	instrument: InstrumentWithId;
	hits: HitTypeWithId[];
	// Whether some cells have been copied (ie, can we show paste?)
	cellsCopied: boolean;
};

export type CellToolsForSingleCellSelection = SelectedCellToolsBase & {
	kind: 'single';
	cellsOccupied: number;
	isFirstCell: Boolean;
	isLastCell: Boolean;
};

export type CellToolsForMultiCellSelection = SelectedCellToolsBase & {
	kind: 'multi';
};

export type CellToolsForEmptyCellSelection = {
	kind: 'empty';
};

import type { CellLocator } from '$lib/domain/types/grid_domain';

export type GridCellUi = {
	// Unique identifier for the cell, combination of grid ID and cell locator
	id: string;
	isBeat: boolean;
	isFirstBeatOfBar: boolean;
	content: string;
	locator: CellLocator;
	cellsOccupied: number;
	cellDescription: string;
	addColorTint: boolean;
};

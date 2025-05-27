import type { CellLocator } from '$lib/domain/types/grid_domain';

export type GridCellUi = {
	isBeat: boolean;
	isFirstBeatOfBar: boolean;
	content: string;
	locator: CellLocator;
	cellsOccupied: number;
	cellDescription: string;
	selected: boolean;
};

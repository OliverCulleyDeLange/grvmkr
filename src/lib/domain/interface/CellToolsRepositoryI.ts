import type { InstrumentRepositoryI } from '$lib';
import type { GridRepositoryI } from './GridRepositoryI';

export interface CellToolsRepositoryI {
	updateCellTools(gridStore: GridRepositoryI, instrumentStore: InstrumentRepositoryI): void;
}

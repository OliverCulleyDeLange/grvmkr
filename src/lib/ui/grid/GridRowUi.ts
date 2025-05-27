import type { GridCellUi } from './GridCellUi';
import type { VolumeControlUi } from './volume_control/VolumeControlUi';

export type GridRowUi = {
	index: number;
	instrumentId: string;
	instrumentName: string;
	gridCells: GridCellUi[];
	volume: VolumeControlUi;
};

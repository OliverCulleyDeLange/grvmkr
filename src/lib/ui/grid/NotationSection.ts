import type { GridRowUi } from './GridRowUi';
import type { BeatIndicator } from './BeatIndicator';

// This represents how a grid is split vertically into sections to make long phrases easier to read

export type NotationSection = {
	columns: number;
	// A list of booleans indicating whether the column is currently playing
	beatIndicator: BeatIndicator[];
	sectionRows: GridRowUi[];
};

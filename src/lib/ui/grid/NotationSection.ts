import type { GridRowUi } from './GridRowUi';

// This represents how a grid is split vertically into sections to make long phrases easier to read
export type NotationSection = {
	columns: number;
	minIndex: number;
	sectionRows: GridRowUi[];
};

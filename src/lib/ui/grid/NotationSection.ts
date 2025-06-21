import type { GridId } from '$lib';
import type { GridRowUi } from './GridRowUi';

// Unique identifier for the section, a combination of grid ID and section index
export type GridSectionId = {
	grid: GridId;
	index: number;
};

// This represents how a grid is split vertically into sections to make long phrases easier to read
export type GridSection = {
	id: GridSectionId;
	index: number;
	columns: number;
	minIndex: number;
	sectionRows: GridRowUi[];
};

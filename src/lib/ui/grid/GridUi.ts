import type { GridId, GridConfig } from '$lib/domain/types/grid_domain';
import type { GridSection } from './NotationSection';

export type GridUi = {
	id: GridId;
	index: number;
	config: GridConfig;
	toolsExpanded: boolean;
	// This represents how a grid is split vertically into sections to make long phrases easier to read
	notationSections: GridSection[];
	msPerBeatDivision: number;
	gridCols: number;
};

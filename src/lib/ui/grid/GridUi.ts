import type { GridId, GridConfig } from '$lib/domain/types/grid_domain';
import type { CellToolsUi } from '../cell_tools/CellToolsUi';
import type { NotationSection } from './NotationSection';

export type GridUi = {
	id: GridId;
	index: number;
	config: GridConfig;
	toolsExpanded: boolean;
	// This represents how a grid is split vertically into sections to make long phrases easier to read
	notationSections: NotationSection[];
	msPerBeatDivision: number;
	gridCols: number;
	playing: boolean;
	currentlyPlayingColumn: number;
	cellTools: CellToolsUi;
};

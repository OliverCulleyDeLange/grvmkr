import type { Grid, GridConfig } from '../domain/types/grid_domain';

export interface GridSectionConfig {
	chunkSize: number;
	numSections: number;
	barSize: number;
}

/**
 * Calculate section configuration for a grid based on screen width and grid properties
 */
export function calculateGridSectionConfig(
	gridCols: number,
	config: GridConfig,
	screenWidth?: number
): GridSectionConfig {
	const barSize = gridCols / config.bars;
	let chunkSize: number;
	
	if (screenWidth) {
		const minCellWidth = 25; // Minimum width of a cell in pixels
		const maxCellsPerSection = Math.max(1, Math.floor(screenWidth / minCellWidth));
		// Find the largest multiple of barSize that fits in maxCellsPerSection
		const barsPerSection = Math.max(1, Math.floor(maxCellsPerSection / barSize));
		chunkSize = barsPerSection * barSize;
		// Ensure at least one bar per section
		if (chunkSize < barSize) chunkSize = barSize;
		// Don't exceed total columns
		if (chunkSize > gridCols) chunkSize = gridCols;
	} else {
		chunkSize = barSize * 2; // Fallback: 2 bars per section
		if (chunkSize > 32) {
			chunkSize = barSize; // Fallback: 1 bar per section if > 32 cells
		}
	}
	
	const numSections = Math.ceil(gridCols / chunkSize);
	
	return {
		chunkSize,
		numSections,
		barSize
	};
}

/**
 * Calculate which section a given column belongs to
 */
export function calculateSectionIndex(
	column: number,
	sectionConfig: GridSectionConfig
): number {
	return Math.floor(column / sectionConfig.chunkSize);
}

/**
 * Calculate which section a given column belongs to for a grid
 */
export function calculateSectionIndexForGrid(
	grid: Grid,
	column: number,
	screenWidth?: number
): number {
	const sectionConfig = calculateGridSectionConfig(grid.gridCols, grid.config, screenWidth);
	return calculateSectionIndex(column, sectionConfig);
}

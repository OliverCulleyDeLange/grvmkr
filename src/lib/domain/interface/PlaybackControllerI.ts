import type { Grid, GridId } from '../types/grid_domain';
import type { PlaybackDebugMetrics } from '../types/debug_domain';

export interface PlaybackControllerI {
	mostRecentlyPlayedGrid(): Grid | undefined;
	isPlayingFile(): boolean;
	isPlayingGrid(id: GridId): boolean;
	getCurrentlyPlayingColumn(gridId: string): number;
	stop(): void;
	restartInterval(): void;
	debugMetrics: PlaybackDebugMetrics;
	togglePlayback(
		grid: Grid, 
		loops: number, 
		onComplete?: (grid: Grid) => void,
		onSectionChange?: (gridId: GridId, sectionIndex: number) => void,
		screenWidth?: number
	): void;
	togglePlayGridsInSequence(
		grids: Grid[],
		onSectionChange?: (gridId: GridId, sectionIndex: number) => void,
		screenWidth?: number
	): Promise<void>;
}

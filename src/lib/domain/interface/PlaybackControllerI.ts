import type { Grid } from '../types/grid_domain';

export interface PlaybackControllerI {
	mostRecentlyPlayedGrid(): Grid | undefined;
	isPlayingFile(): boolean;
	stop(): void;
	togglePlayback(grid: Grid, loops: number, onComplete?: (grid: Grid) => void): void;
	togglePlayGridsInSequence(
		grids: Grid[],
		onPlay?: (grid: Grid) => void,
		onStop?: (grid: Grid) => void
	): Promise<void>;
}

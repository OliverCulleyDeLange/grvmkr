import type { Grid } from "../types/grid_domain";

export interface PlaybackControllerI {
    stop(): void;
    play(grid: Grid): void;
    playGridsInSequence(
        grids: Grid[],
        onPlay?: (grid: Grid) => void,
        onStop?: (grid: Grid) => void
    ): void;
}
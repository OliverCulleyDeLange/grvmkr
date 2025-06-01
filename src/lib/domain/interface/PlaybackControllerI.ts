import type { Grid } from "../types/grid_domain";

export interface PlaybackControllerI {
    isPlayingFile(): boolean
    stop(): void;
    play(grid: Grid, loops: number, onComplete?: (grid: Grid) => void): void;
    playGridsInSequence(
        grids: Grid[],
        onPlay?: (grid: Grid) => void,
        onStop?: (grid: Grid) => void
    ): void;
}
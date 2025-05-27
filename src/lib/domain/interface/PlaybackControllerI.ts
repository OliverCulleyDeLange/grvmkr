import type { Grid } from "../types/grid_domain";

export interface PlaybackControllerI {
    stop(): void;
    play(grid: Grid): void;
}
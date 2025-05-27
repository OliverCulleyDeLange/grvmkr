import type { Grid, GridId } from "$lib";

export interface GridRepositoryI {
    getFirstGrid(): Grid | null;
	getMostRecentlyPlayedGrid(): Grid | null;
	setPlaying(gridId: GridId, playing: boolean): void;
}
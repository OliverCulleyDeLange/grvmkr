import type { Grid, GridId } from "$lib";

export type GrvMkrFileId = string

// A file is made up of many grids
export type GrvMkrFile = {
    id: GrvMkrFileId
    name: string
    grids: Map<GridId, Grid>
};
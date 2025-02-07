import type { Grid, GridId } from "$lib";

export type FileId = string

// A file is made up of many grids
export type File = {
    id: FileId
    name: string
    grids: Map<GridId, Grid>
};
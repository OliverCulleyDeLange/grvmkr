import type { GridDtoId } from "./grid_data";

export type FileDtoId = string

// A file is made up of many grids
export type FileDto = {
    id: FileDtoId
    name: string
    grids: GridDtoId[]
};
import type { FileDto, File } from "$lib";
import type { GridId, Grid } from "$lib";

export function mapFileDtoToFile(fileDto: FileDto, grids: Map<GridId, Grid>): File {
    return {
        id: fileDto.id,
        name: fileDto.name,
        grids
    };
}
import type { FileDto, GrvMkrFile } from "$lib";
import type { GridId, Grid } from "$lib";

export function mapFileDtoToFile(fileDto: FileDto, grids: Map<GridId, Grid>): GrvMkrFile {
    return {
        id: fileDto.id,
        name: fileDto.name,
        grids
    };
}
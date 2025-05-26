import type { FileDto, GrvMkrFile, InstrumentWithId } from "$lib";
import type { GridId, Grid } from "$lib";

export function mapFileDtoToFile(fileDto: FileDto, grids: Map<GridId, Grid>, instruments: Map<string, InstrumentWithId>): GrvMkrFile {
    return {
        id: fileDto.id,
        name: fileDto.name,
        grids,
        instruments,
    };
}
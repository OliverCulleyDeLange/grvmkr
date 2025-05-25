import { GridTable, FileTable, mapGridDtoToGrid, InstrumentStore, mapFileDtoToFile, mapToDto } from "$lib";
import type { GrvMkrFile, GrvMkrFileId, FileDto, Grid, GridId } from "$lib";

export class FileRepository {
    private instrumentManager: InstrumentStore

    private fileTable: FileTable = new FileTable()
    private gridTable: GridTable = new GridTable()

    constructor(instrumentManager: InstrumentStore) {
        this.instrumentManager = instrumentManager
    }

    async saveFile(file: GrvMkrFile): Promise<void> {
        const fileDto = mapToDto(file);
        await this.fileTable.saveFile(fileDto);
        console.log("Saved File to DB", fileDto)
    }

    async getFile(id: GrvMkrFileId): Promise<GrvMkrFile | undefined> {
        const fileDto = await this.fileTable.getFile(id);
        if (!fileDto) return undefined;

        const grids = new Map<GridId, Grid>();
        for (const gridId of fileDto.grids) {
            const gridDto = await this.gridTable.getGrid(gridId);
            if (gridDto) grids.set(gridId, mapGridDtoToGrid(gridDto, this.instrumentManager));
        }

        return mapFileDtoToFile(fileDto, grids);
    }

    async deleteFile(id: GrvMkrFileId): Promise<void> {
        await this.fileTable.deleteFile(id);
        console.log("Deleted File from DB", id)
    }

    async getAllFiles(): Promise<GrvMkrFile[]> {
        const fileDtos = await this.fileTable.getAllFiles();
        const files: GrvMkrFile[] = [];

        for (const fileDto of fileDtos) {
            const grids = new Map<GridId, Grid>();
            for (const gridId of fileDto.grids) {
                const gridDto = await this.gridTable.getGrid(gridId);
                if (gridDto) grids.set(gridId, mapGridDtoToGrid(gridDto, this.instrumentManager));
            }
            files.push(mapFileDtoToFile(fileDto, grids));
        }

        return files;
    }

}

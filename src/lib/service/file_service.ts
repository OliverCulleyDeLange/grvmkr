import { GridTable, FileTable, mapGridDtoToGrid, InstrumentManager, mapFileDtoToFile, mapToDto } from "$lib";
import type { File, FileId, FileDto, Grid, GridId } from "$lib";

export class FileService {
    private instrumentManager: InstrumentManager

    private fileTable: FileTable = new FileTable()
    private gridTable: GridTable = new GridTable()

    constructor(instrumentManager: InstrumentManager) {
        this.instrumentManager = instrumentManager
    }

    async saveFile(file: File): Promise<void> {
        const fileDto = mapToDto(file);
        await this.fileTable.addFile(fileDto);
    }

    async getFile(id: FileId): Promise<File | undefined> {
        const fileDto = await this.fileTable.getFile(id);
        if (!fileDto) return undefined;

        const grids = new Map<GridId, Grid>();
        for (const gridId of fileDto.grids) {
            const gridDto = await this.gridTable.getGrid(gridId);
            if (gridDto) grids.set(gridId, mapGridDtoToGrid(gridDto, this.instrumentManager));
        }

        return mapFileDtoToFile(fileDto, grids);
    }

    async deleteFile(id: FileId): Promise<void> {
        await this.fileTable.deleteFile(id);
    }

    async getAllFiles(): Promise<File[]> {
        const fileDtos = await this.fileTable.getAllFiles();
        const files: File[] = [];

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

import { GridTable, InstrumentManager, mapGridDtoToGrid, mapGridToGridDto, type Grid, type GridId } from "$lib";

export class GridService {

    private instrumentManager: InstrumentManager

    constructor(instrumentManager: InstrumentManager) {
        this.instrumentManager = instrumentManager
    }

    private gridTable: GridTable = new GridTable();

    async saveGrid(grid: Grid): Promise<void> {
        const gridDto = mapGridToGridDto(grid);
        await this.gridTable.saveGrid(gridDto);
        console.log("Saved Grid to DB", grid, gridDto)
    }

    async getGrid(id: GridId): Promise<Grid | null> {
        const gridDto = await this.gridTable.getGrid(id);
        return gridDto ? mapGridDtoToGrid(gridDto, this.instrumentManager) : null;
    }

    async deleteGrid(id: GridId): Promise<void> {
        await this.gridTable.deleteGrid(id);
        console.log("Deleted Grid from DB", id)
    }

    async getAllGrids(): Promise<Grid[]> {
        const gridDtos = await this.gridTable.getAllGrids();
        return gridDtos.map(dto => mapGridDtoToGrid(dto, this.instrumentManager));
    }

    async deleteAllGrids(): Promise<void> {
        await this.gridTable.deleteAllGrids();
        console.log("Deleted all Grids from DB"
        )
    }
}

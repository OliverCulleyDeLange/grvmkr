import { GridTable, InstrumentRepository, InstrumentStore, mapGridDtoToGrid, mapGridToGridDto, type Grid, type GridDto, type GridId } from "$lib";

export class GridRepository {

    private instrumentRepository: InstrumentRepository = new InstrumentRepository()

    private gridTable: GridTable = new GridTable();

    async saveGrid(grid: Grid): Promise<void> {
        const gridDto = mapGridToGridDto(grid);
        await this.gridTable.saveGrid(gridDto);
        console.log("Saved Grid to DB", gridDto)
    }

    async getGrid(id: GridId): Promise<Grid | null> {
        const gridDto = await this.gridTable.getGrid(id);

        if (!gridDto) {
            console.warn(`Grid with id ${id} not found`);
            return null;
        }

        // Collect all instrumentIds used in this grid
        return await this.gridDtoToGrid(gridDto);
    }

    async getGrids(ids: GridId[]): Promise<Grid[]> {
        const gridDtos = await this.gridTable.getGrids(ids)
        const filtered = gridDtos.filter((d) => d != null);
        return await Promise.all(filtered.map(dto => this.gridDtoToGrid(dto)));
    }

    async deleteGrid(id: GridId): Promise<void> {
        await this.gridTable.deleteGrid(id);
        console.log("Deleted Grid from DB", id)
    }

    async getAllGrids(): Promise<Grid[]> {
        const gridDtos = await this.gridTable.getAllGrids();
        return await Promise.all(gridDtos.map(dto => this.gridDtoToGrid(dto)));
    }

    async deleteAllGrids(): Promise<void> {
        await this.gridTable.deleteAllGrids();
        console.log("Deleted all Grids from DB")
    }

    private async gridDtoToGrid(gridDto: GridDto): Promise<Grid> {
        const instrumentIds = gridDto.rows.map(row => row.instrumentId);
        const instrumentsArray = await this.instrumentRepository.getInstruments(instrumentIds);
        const instruments = new Map(instrumentsArray.map(i => [i.id, i]));

        return mapGridDtoToGrid(gridDto, instruments);
    }
}

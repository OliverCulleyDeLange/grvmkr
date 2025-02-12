import type { Bar, BarDto, Beat, GridCell, GridCellDto, BeatDto, Grid, GridConfig, GridConfigDto, GridDto, GridRow, GridRowDto, InstrumentHit, InstrumentHitDto, Notation, NotationDto } from "$lib";

export function mapGridToGridDto(grid: Grid): GridDto {
    return {
        id: grid.id,
        index: grid.index,
        config: mapGridConfigToGridConfigDto(grid.config),
        rows: grid.rows.map(row => mapGridRowToGridRowDto(row)),
        currentlyPlayingColumn: grid.currentlyPlayingColumn,
        msPerBeatDivision: grid.msPerBeatDivision,
        gridCols: grid.gridCols,
        playing: grid.playing,
    };
}

export function mapGridConfigToGridConfigDto(config: GridConfig): GridConfigDto {
    return {
        name: config.name,
        bpm: config.bpm,
        bars: config.bars,
        beatsPerBar: config.beatsPerBar,
        beatDivisions: config.beatDivisions
    };
}

export function mapGridRowToGridRowDto(gridRow: GridRow): GridRowDto {
    return {
        instrumentId: gridRow.instrument.id,
        cells: gridRow.cells.map((cell) => mapCellToCellDto(cell))
    };
}

export function mapCellToCellDto(cell: GridCell): GridCellDto {
    let dto: GridCellDto =  {
        hits: cell.hits.map((hit) => mapInstrumentHitToInstrumentHitDto(hit)),
        cells_occupied: cell.cells_occupied,
    }
    return dto
}

export function mapInstrumentHitToInstrumentHitDto(hit: InstrumentHit): InstrumentHitDto {
    return {
        instrumentId: hit.instrumentId,
        hitId: hit.hitId
    };
}
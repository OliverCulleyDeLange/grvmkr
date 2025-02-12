import type { Grid, GridCell, GridCellDto, GridConfig, GridConfigDto, GridDto, GridRow, GridRowDto, InstrumentHit, InstrumentHitDto, InstrumentManager } from "$lib";

export function mapGridDtoToGrid(gridDto: GridDto, instrumentManager: InstrumentManager): Grid {
    return {
        id: gridDto.id,
        index: gridDto.index,
        config: configFromDto(gridDto.config),
        rows: gridDto.rows.map(row => rowFromDto(row, instrumentManager)),
        currentlyPlayingColumn: gridDto.currentlyPlayingColumn,
        msPerBeatDivision: gridDto.msPerBeatDivision,
        gridCols: gridDto.gridCols,
        playing: false, // Ignore whatever play state from the db 
    };
}

export function configFromDto(configDto: GridConfigDto): GridConfig {
    return {
        name: configDto.name ?? "",
        bpm: configDto.bpm,
        bars: configDto.bars,
        beatsPerBar: configDto.beatsPerBar,
        beatDivisions: configDto.beatDivisions
    };
}

export function rowFromDto(gridRowDto: GridRowDto, instrumentManager: InstrumentManager): GridRow {
    let instrument = instrumentManager.instruments.get(gridRowDto.instrumentId)
    if (!instrument) {
        console.error(`Can't find instrument with id [${gridRowDto.instrumentId}] from db. Domain obj will have no instrument!`, instrument)
    }
    return {
        instrument: instrument!,
        cells: gridRowDto.cells.map((cell) => mapGridCellDtoToGridCell(cell))
    };
}


export function mapGridCellDtoToGridCell(divisionDto: GridCellDto): GridCell {
    let cell: GridCell = {
        hits: divisionDto.hits.map((hit) => mapInstrumentHitDtoToInstrumentHit(hit)),
        cells_occupied: divisionDto.cells_occupied,
    };
    return cell
}

export function mapInstrumentHitDtoToInstrumentHit(hitDto: InstrumentHitDto): InstrumentHit {
    return {
        instrumentId: hitDto.instrumentId,
        hitId: hitDto.hitId
    };
}
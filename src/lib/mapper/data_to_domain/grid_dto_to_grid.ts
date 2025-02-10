import type { Bar, BarDto, Beat, BeatDivision, BeatDivisionDto, BeatDto, Grid, GridConfig, GridConfigDto, GridDto, GridRow, GridRowDto, InstrumentHit, InstrumentHitDto, InstrumentManager, Notation, NotationDto } from "$lib";

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
        notation: notationFromDto(gridRowDto.notation)
    };
}

export function notationFromDto(notationDto: NotationDto): Notation {
    return {
        bars: notationDto.bars.map(bar => barFromDto(bar))
    };
}

export function barFromDto(barDto: BarDto): Bar {
    return {
        beats: barDto.beats.map(beat => beatFromDto(beat))
    };
}

export function beatFromDto(beatDto: BeatDto): Beat {
    return {
        divisions: beatDto.divisions.map(div => divisionFromDto(div))
    };
}

export function divisionFromDto(divisionDto: BeatDivisionDto): BeatDivision {
    return {
        beatIndex: divisionDto.gridIndex,
        hits: divisionDto.hits.map((hit) => hitFromDto(hit)),
        cellsOccupied: divisionDto.cellsOccupied
        
    };
}

export function hitFromDto(hitDto: InstrumentHitDto): InstrumentHit {
    return {
        instrumentId: hitDto.instrumentId,
        hitId: hitDto.hitId
    };
}
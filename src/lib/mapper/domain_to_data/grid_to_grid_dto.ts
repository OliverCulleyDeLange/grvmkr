import type { Bar, BarDto, Beat, BeatDivision, BeatDivisionDto, BeatDto, Grid, GridConfig, GridConfigDto, GridDto, GridRow, GridRowDto, InstrumentHit, InstrumentHitDto, Notation, NotationDto } from "$lib";

export function mapGridToGridDto(grid: Grid): GridDto {
    return {
        id: grid.id,
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
        notation: mapNotationToNotationDto(gridRow.notation)
    };
}

export function mapNotationToNotationDto(notation: Notation): NotationDto {
    return {
        bars: notation.bars.map(bar => mapBarToBarDto(bar))
    };
}

export function mapBarToBarDto(bar: Bar): BarDto {
    return {
        beats: bar.beats.map(beat => mapBeatToBeatDto(beat))
    };
}

export function mapBeatToBeatDto(beat: Beat): BeatDto {
    return {
        divisions: beat.divisions.map(div => mapBeatDivisionToBeatDivisionDto(div))
    };
}

export function mapBeatDivisionToBeatDivisionDto(division: BeatDivision): BeatDivisionDto {
    return {
        hit: division.hit ? mapInstrumentHitToInstrumentHitDto(division.hit) : undefined
    };
}

export function mapInstrumentHitToInstrumentHitDto(hit: InstrumentHit): InstrumentHitDto {
    return {
        instrumentId: hit.instrumentId,
        hitId: hit.hitId
    };
}
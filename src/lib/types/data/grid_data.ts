import type { HitDtoId, InstrumentDtoId } from "./instrument_data";

export type GridDtoId = string

export type GridDto = {
    id: GridDtoId
    index: number
    config: GridConfigDto
    rows: GridRowDto[]
    currentlyPlayingColumn: number
    msPerBeatDivision: number
    gridCols: number
    playing: boolean
};

export type GridConfigDto = {
    name: string | undefined
    bpm: number
    bars: number
    beatsPerBar: number
    beatDivisions: number
};

export type GridRowDto = {
    instrumentId: InstrumentDtoId
    notation: NotationDto
};

export type NotationDto = {
    bars: Array<BarDto>
}

export type BarDto = {
    beats: Array<BeatDto>
};

export type BeatDto = {
    divisions: Array<BeatDivisionDto>
};

export type BeatDivisionDto = {
    hit: InstrumentHitDto | undefined
};

export type InstrumentHitDto = {
    instrumentId: InstrumentDtoId,
    hitId: HitDtoId
}

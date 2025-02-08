import type { Grid, GridRow, Bar, Beat, BeatDivision } from "$lib"
import type { InstrumentId, InstrumentWithId } from "$lib"

// The values here are pre calculated
export function buildDefaultGrid(instruments: Map<InstrumentId, InstrumentWithId>, index: number): Grid {
    let grid: Grid = {
        id: `grid_${crypto.randomUUID()}`,
        index: index,
        config: {
            name: `Groove ${index + 1}`,
            bpm: 120,
            bars: 1,
            beatsPerBar: 4,
            beatDivisions: 4
        },
        rows: buildGridRows(instruments, 1, 4, 4),
        msPerBeatDivision: 125,
        gridCols: 16,
        playing: false,
        currentlyPlayingColumn: 0
    }
    return grid
}

export function buildGridRows(instruments: Map<InstrumentId, InstrumentWithId>, bars: number, beats: number, divisions: number): GridRow[] {
    return Array.from(instruments.values())
        .map((instrument) => defaultGridRow(instrument, bars, beats, divisions))
}

export function defaultGridRow(instrument: InstrumentWithId, bars: number, beats: number, divisions: number): GridRow {
    let notation = {
        bars: Array.from({ length: bars }, () => defaultBar(beats, divisions))
    }
    return { instrument, notation }
}

export function defaultBar(beats: number, divisions: number): Bar {
    return {
        beats: Array.from({ length: beats }, () => defaultBeat(divisions))
    }
}

export function defaultBeat(divisions: number): Beat {
    return {
        divisions: Array.from({ length: divisions }, () => defaultBeatDivision())
    }
}

export function defaultBeatDivision(): BeatDivision {
    return { hit: undefined }
}
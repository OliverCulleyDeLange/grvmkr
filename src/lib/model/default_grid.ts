import type { Grid, GridRow, Bar, Beat, BeatDivision } from "$lib"
import type { InstrumentId, InstrumentWithId } from "$lib"

// The values here are pre calculated
export function buildDefaultGrid(instruments: Map<InstrumentId, InstrumentWithId>): Grid {
    let grid: Grid = {
        id: `grid_${crypto.randomUUID()}`,
        config: {
            bpm: 120,
            bars: 1,
            beatsPerBar: 4,
            beatDivisions: 4
        },
        rows: buildGridRows(instruments),
        msPerBeatDivision: 125,
        gridCols: 16,
        playing: false,
        currentlyPlayingColumn: 0
    }
    return grid
}

export function buildGridRows(instruments: Map<InstrumentId, InstrumentWithId>): GridRow[] {
    return Array.from(instruments.values())
        .map((instrument) => defaultGridRow(instrument))
}

export function defaultGridRow(instrument: InstrumentWithId): GridRow {
    let notation = {
        bars: Array.from({ length: 1 }, () => defaultBar())
    }
    return { instrument, notation }
}

export function defaultBar(): Bar {
    return {
        beats: Array.from({ length: 4 }, () => defaultBeat())
    }
}

export function defaultBeat(): Beat {
    return {
        divisions: Array.from({ length: 4 }, () => defaultBeatDivision())
    }
}

export function defaultBeatDivision(): BeatDivision {
    return { hit: undefined }
}
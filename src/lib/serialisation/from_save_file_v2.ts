import { calculateMsPerBeatDivision, type Bar, type Beat, type BeatDivision, type Grid, type GridRow, type InstrumentManager, type SavedGridConfigV1, type SavedGridRowV1, type SavedGridV1, type SavedGridV2, type SavedInstrumentHitV1 } from "$lib";

// Maps a saved grid from a save file to grid models
export function mapSavedGridV2ToGrid(savedGrid: SavedGridV2, instrumentManager: InstrumentManager): Grid {
    let newRows: GridRow[] = savedGrid.rows.map((row, i) => {
        let instrument = instrumentManager.instruments.get(row.instrument_id)
        if (instrument) {
            let gridRow: GridRow = {
                instrument: instrument,
                notation: {
                    bars: mapSavedGridRowV1ToBars(row, savedGrid.config)
                }
            }
            return gridRow
        } else {
            console.error(`Failed to import grid row ${i}. Couldn't find instrument ${row.instrument_id}`, row)
            return null
        }
    }).filter((r) => r != null)
    let grid: Grid = {
        id: savedGrid.id,
        index: 0, // Not present in V2
        config: {
            name: savedGrid.config.name,
            bpm: savedGrid.config.bpm,
            bars: savedGrid.config.bars,
            beatsPerBar: savedGrid.config.beats_per_bar,
            beatDivisions: savedGrid.config.beat_divisions
        },
        rows: newRows,
        msPerBeatDivision: calculateMsPerBeatDivision(savedGrid.config.bpm, savedGrid.config.beat_divisions),
        gridCols: savedGrid.config.bars * (savedGrid.config.beats_per_bar * savedGrid.config.beat_divisions),
        playing: false,
        currentlyPlayingColumn: 0
    }
    return grid
}

function mapSavedGridRowV1ToBars(row: SavedGridRowV1, config: SavedGridConfigV1): Bar[] {
    const bars: Bar[] = [];
    let barSplit = row.hits.length / config.bars
    for (let i = 0; i < row.hits.length; i += barSplit) {
        let barHits = row.hits.slice(i, i + barSplit)
        // console.log(`bar slice ${i} - ${i + barSplit}`, barHits)
        let bar: Bar = {
            beats: mapSavedInstrumentHitV1sToBeat(barHits, config)
        }
        bars.push(bar);
    }
    return bars
}

function mapSavedInstrumentHitV1sToBeat(barHits: SavedInstrumentHitV1[], config: SavedGridConfigV1): Beat[] {
    const beats: Beat[] = [];
    let beatSplit = barHits.length / config.beats_per_bar
    for (let i = 0; i < barHits.length; i += beatSplit) {
        let beatHits = barHits.slice(i, i + beatSplit);
        // console.log(`beat slice ${i} - ${i + beatSplit}`, beatHits)
        let beat: Beat = {
            divisions: mapSavedInstrumentHitV1sToBeatDivisions(beatHits)
        }
        beats.push(beat)
    }
    return beats
}

function mapSavedInstrumentHitV1sToBeatDivisions(beatHits: SavedInstrumentHitV1[]): BeatDivision[] {
    return beatHits.map((beatHit) => {
        let hit = beatHit.hit_id && beatHit.instrument_id ? {
            hitId: beatHit.hit_id,
            instrumentId: beatHit.instrument_id
        } : undefined
        let beatDivision: BeatDivision = {
            cellsOccupied: 1, // V2 doesn't support divisions
            hits: hit ? [hit] : []
        }
        return beatDivision
    })
}

import { calculateMsPerBeatDivision, type Bar, type Beat, type BeatDivision, type Grid, type GridRow, type InstrumentManager, type SavedBeatV3, type SavedGridConfigV1, type SavedGridRowV1, type SavedGridRowV3, type SavedGridV1, type SavedGridV2, type SavedGridV3, type SavedInstrumentHitV1 } from "$lib";

// Maps a saved grid from a save file to grid models
export function mapSavedGridV3ToGrid(savedGrid: SavedGridV3, instrumentManager: InstrumentManager): Grid {
    let newRows: GridRow[] = savedGrid.rows.map((row, i) => {
        let instrument = instrumentManager.instruments.get(row.instrument_id)
        if (instrument) {
            let gridRow: GridRow = {
                instrument: instrument,
                notation: {
                    bars: mapSavedGridRowV3ToBars(row, savedGrid.config)
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

function mapSavedGridRowV3ToBars(row: SavedGridRowV3, config: SavedGridConfigV1): Bar[] {
    return row.notation.bars.map((bar) => {
        return {
            beats: mapSavedInstrumentHitV1sToBeat(bar.beats, config)
        }
    })
}

function mapSavedInstrumentHitV1sToBeat(beats: SavedBeatV3[], config: SavedGridConfigV1): Beat[] {
    return beats.map((beat) => {
        return {
            divisions: mapSavedInstrumentHitV1sToBeatDivisions(beat)
        }
    })
}

function mapSavedInstrumentHitV1sToBeatDivisions(beats: SavedBeatV3): BeatDivision[] {
    return beats.divisions.map((division) => {
        let beatDivision: BeatDivision = {
            gridIndex: division.gridIndex,
            cellsOccupied: division.cellsOccupied,
            hits: division.hits.map((hit) => {
                return {
                    hitId: hit.hit_id,
                    instrumentId: hit.instrument_id
                }
            })
        }
        return beatDivision
    })
}

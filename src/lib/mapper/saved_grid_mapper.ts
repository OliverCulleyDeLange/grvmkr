import type { Bar, Beat, BeatDivision, Grid, GridRow, InstrumentManager, SavedGridConfigV1, SavedGridRowV1, SavedGridV1, SavedInstrumentHitV1 } from "$lib";

// Maps a saved grid from a save file to grid models
export function mapSavedGridToGrid(savedGrid: SavedGridV1, instrumentManager: InstrumentManager): Grid {
    let newRows: GridRow[] = savedGrid.rows.map((row, i) => {
        let instrument = instrumentManager.instruments.get(row.instrument_id)
        if (instrument) {
            let gridRow: GridRow = {
                instrument: instrument,
                notation: {
                    bars: mapSavedRowToBars(row, savedGrid.config)
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
        config: {
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

function mapSavedRowToBars(row: SavedGridRowV1, config: SavedGridConfigV1): Bar[] {
    const bars: Bar[] = [];
    let barSplit = row.hits.length / config.bars
    for (let i = 0; i < row.hits.length; i += barSplit) {
        let barHits = row.hits.slice(i, i + barSplit)
        // console.log(`bar slice ${i} - ${i + barSplit}`, barHits)
        let bar: Bar = {
            beats: mapSavedBarHitsToBar(barHits, config)
        }
        bars.push(bar);
    }
    return bars
}

function mapSavedBarHitsToBar(barHits: SavedInstrumentHitV1[], config: SavedGridConfigV1): Beat[] {
    const beats: Beat[] = [];
    let beatSplit = barHits.length / config.beats_per_bar
    for (let i = 0; i < barHits.length; i += beatSplit) {
        let beatHits = barHits.slice(i, i + beatSplit);
        // console.log(`beat slice ${i} - ${i + beatSplit}`, beatHits)
        let beat: Beat = {
            divisions: mapSavedBeatHitsToDivisions(beatHits)
        }
        beats.push(beat)
    }
    return beats
}

function mapSavedBeatHitsToDivisions(beatHits: SavedInstrumentHitV1[]): BeatDivision[] {
    return beatHits.map((beatHit) => {
        let hit = beatHit.hit_id && beatHit.instrument_id ? {
            hitId: beatHit.hit_id,
            instrumentId: beatHit.instrument_id
        } : undefined
        let beatDivision: BeatDivision = {
            hit: hit
        }
        return beatDivision
    })
}

export function calculateMsPerBeatDivision(bpm: number, beatDivisions: number): number {
    return 60000 / bpm / beatDivisions;
}

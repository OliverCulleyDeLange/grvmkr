import { GridTable, InstrumentManager, type Bar, type BarDto, type Beat, type BeatDivision, type BeatDivisionDto, type BeatDto, type Grid, type GridConfig, type GridConfigDto, type GridDto, type GridId, type GridRow, type GridRowDto, type InstrumentHit, type InstrumentHitDto, type Notation, type NotationDto } from "$lib";

// Chat GPT Generated :)
export class GridService {

    private instrumentManager: InstrumentManager

    constructor(instrumentManager: InstrumentManager) {
        this.instrumentManager = instrumentManager
    }

    private gridTable: GridTable = new GridTable();

    /** ✅ Save a Grid */
    async saveGrid(grid: Grid): Promise<void> {
        const gridDto = this.toDto(grid);
        await this.gridTable.saveGrid(gridDto);
    }

    /** ✅ Get a Grid by ID */
    async getGrid(id: GridId): Promise<Grid | null> {
        const gridDto = await this.gridTable.getGrid(id);
        return gridDto ? this.fromDto(gridDto) : null;
    }

    /** ✅ Delete a Grid by ID */
    async deleteGrid(id: GridId): Promise<void> {
        await this.gridTable.deleteGrid(id);
    }

    /** ✅ Get all Grids */
    async getAllGrids(): Promise<Grid[]> {
        const gridDtos = await this.gridTable.getAllGrids();
        return gridDtos.map(dto => this.fromDto(dto));
    }

    /** ✅ Delete all Grids */
    async deleteAllGrids(): Promise<void> {
        await this.gridTable.deleteAllGrids();
    }


    /** ✅ Convert a domain Grid to a DTO GridDto */
    private toDto(grid: Grid): GridDto {
        return {
            id: grid.id,
            config: this.configToDto(grid.config),
            rows: grid.rows.map(row => this.rowToDto(row)),
            currentlyPlayingColumn: grid.currentlyPlayingColumn,
            msPerBeatDivision: grid.msPerBeatDivision,
            gridCols: grid.gridCols,
            playing: grid.playing,
        };
    }

    /** ✅ Convert a domain GridConfig to a DTO GridConfigDto */
    private configToDto(config: GridConfig): GridConfigDto {
        return {
            bpm: config.bpm,
            bars: config.bars,
            beatsPerBar: config.beatsPerBar,
            beatDivisions: config.beatDivisions
        };
    }

    /** ✅ Convert a domain GridRow to a DTO GridRowDto */
    private rowToDto(gridRow: GridRow): GridRowDto {
        return {
            instrumentId: gridRow.instrument.id,
            notation: this.notationToDto(gridRow.notation)
        };
    }

    /** ✅ Convert a domain Notation to a DTO NotationDto */
    private notationToDto(notation: NotationDto): NotationDto {
        return {
            bars: notation.bars.map(bar => this.barToDto(bar))
        };
    }

    /** ✅ Convert a domain Bar to a DTO BarDto */
    private barToDto(bar: BarDto): BarDto {
        return {
            beats: bar.beats.map(beat => this.beatToDto(beat))
        };
    }

    /** ✅ Convert a domain Beat to a DTO BeatDto */
    private beatToDto(beat: BeatDto): BeatDto {
        return {
            divisions: beat.divisions.map(div => this.divisionToDto(div))
        };
    }

    /** ✅ Convert a domain BeatDivision to a DTO BeatDivisionDto */
    private divisionToDto(division: BeatDivisionDto): BeatDivisionDto {
        return {
            hit: division.hit ? this.hitToDto(division.hit) : undefined
        };
    }

    /** ✅ Convert a domain InstrumentHit to a DTO InstrumentHitDto */
    private hitToDto(hit: InstrumentHitDto): InstrumentHitDto {
        return {
            instrumentId: hit.instrumentId,
            hitId: hit.hitId
        };
    }

    /** ✅ Convert a DTO GridDto back to a domain Grid */
    private fromDto(gridDto: GridDto): Grid {
        return {
            id: gridDto.id,
            config: this.configFromDto(gridDto.config),
            rows: gridDto.rows.map(row => this.rowFromDto(row)),
            currentlyPlayingColumn: gridDto.currentlyPlayingColumn,
            msPerBeatDivision: gridDto.msPerBeatDivision,
            gridCols: gridDto.gridCols,
            playing: gridDto.playing,
        };
    }

    /** ✅ Convert a DTO GridConfigDto back to a domain GridConfig */
    private configFromDto(configDto: GridConfigDto): GridConfig {
        return {
            bpm: configDto.bpm,
            bars: configDto.bars,
            beatsPerBar: configDto.beatsPerBar,
            beatDivisions: configDto.beatDivisions
        };
    }

    /** ✅ Convert a DTO GridRowDto back to a domain GridRow */
    private rowFromDto(gridRowDto: GridRowDto): GridRow {
        let instrument = this.instrumentManager.instruments.get(gridRowDto.instrumentId)
        return {
            instrument: instrument!,
            notation: this.notationFromDto(gridRowDto.notation)
        };
    }

    /** ✅ Convert a DTO NotationDto back to a domain Notation */
    private notationFromDto(notationDto: NotationDto): Notation {
        return {
            bars: notationDto.bars.map(bar => this.barFromDto(bar))
        };
    }

    /** ✅ Convert a DTO BarDto back to a domain Bar */
    private barFromDto(barDto: BarDto): Bar {
        return {
            beats: barDto.beats.map(beat => this.beatFromDto(beat))
        };
    }

    /** ✅ Convert a DTO BeatDto back to a domain Beat */
    private beatFromDto(beatDto: BeatDto): Beat {
        return {
            divisions: beatDto.divisions.map(div => this.divisionFromDto(div))
        };
    }

    /** ✅ Convert a DTO BeatDivisionDto back to a domain BeatDivision */
    private divisionFromDto(divisionDto: BeatDivisionDto): BeatDivision {
        return {
            hit: divisionDto.hit ? this.hitFromDto(divisionDto.hit) : undefined
        };
    }

    /** ✅ Convert a DTO InstrumentHitDto back to a domain InstrumentHit */
    private hitFromDto(hitDto: InstrumentHitDto): InstrumentHit {
        return {
            instrumentId: hitDto.instrumentId,
            hitId: hitDto.hitId
        };
    }

}

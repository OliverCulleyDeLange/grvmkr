import type { InstrumentWithId, HitTypeWithId } from "$lib";
import type { InstrumentDto, HitDto } from "$lib";
import { InstrumentTable, mapHitDtoToHitTypeWithId, mapHitTypeToHitDto, mapInstrumentToDomain, mapInstrumentToInstrumentDto } from "$lib";
import { HitTable } from "$lib";

export class InstrumentService {
    private instrumentTable = new InstrumentTable();
    private hitTable = new HitTable();

    async saveInstrument(instrument: InstrumentWithId): Promise<void> {
        // Save HitDto's first
        const hitDtos: HitDto[] = [...instrument.hitTypes.values()]
            .map((hitType) => mapHitTypeToHitDto(hitType));
        await Promise.all(hitDtos.map(hit => this.hitTable.saveHit(hit)));

        // Then save InstrumentDto
        const instrumentDto = mapInstrumentToInstrumentDto(instrument)
        await this.instrumentTable.saveInstrument(instrumentDto);
        console.log("Saved Instrument to DB", instrumentDto)
    }

    async getInstrument(id: string): Promise<InstrumentWithId | null> {
        const instrumentDto = await this.instrumentTable.getInstrument(id);
        if (!instrumentDto) return null;
        return this.buildInstrument(instrumentDto)
    }

    async getAllInstruments(): Promise<InstrumentWithId[]> {
        const instrumentDtos = await this.instrumentTable.getAllInstruments();
        return Promise.all(
            instrumentDtos.map(async (instrumentDto) => await this.buildInstrument(instrumentDto))
        );
    }

    async deleteInstrument(id: string): Promise<void> {
        const instrument = await this.getInstrument(id);
        if (!instrument) return;

        // Delete associated hits
        await Promise.all(Array.from(instrument.hitTypes.keys()).map(hitId => this.hitTable.deleteHit(hitId)));

        // Delete instrument
        await this.instrumentTable.deleteInstrument(id);
        console.log("Deleted Instrument from DB", id)
    }

    async deleteAllInstruments(): Promise<void> {
        await this.instrumentTable.deleteAllInstruments();
        await this.hitTable.deleteAllHits();
        console.log("Deleted all instruments from DB")
    }

    // Resolves instrument's hitIds into HitTypeWithId and builds InstrumentWithId
    private async buildInstrument(instrumentDto: InstrumentDto): Promise<InstrumentWithId> {
        const hitTypes: HitTypeWithId[] = (await Promise.all(
            instrumentDto.hitTypes.map(async (hitId) => await this.hitTable.getHit(hitId))
        )).filter((hitType) => hitType != null)
            .map((dto) => mapHitDtoToHitTypeWithId(dto, instrumentDto.volume));

        return mapInstrumentToDomain(instrumentDto, hitTypes);
    }

}

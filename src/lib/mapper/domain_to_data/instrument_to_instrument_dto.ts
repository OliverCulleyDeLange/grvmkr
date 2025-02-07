import type { HitDto, HitTypeWithId, InstrumentDto, InstrumentWithId } from "$lib";

export function mapHitTypeToHitDto(hitType: HitTypeWithId): HitDto {
    let dto: HitDto = {
        id: hitType.id,
        key: hitType.key,
        description: hitType.description,
        audioFileName: hitType.audioFileName
    };
    return dto
}
export function mapInstrumentToInstrumentDto(instrument: InstrumentWithId): InstrumentDto {
    const instrumentDto: InstrumentDto = {
        id: instrument.id,
        gridIndex: instrument.gridIndex,
        name: instrument.name,
        hitTypes: [...instrument.hitTypes.keys()]
    };
    return instrumentDto
}
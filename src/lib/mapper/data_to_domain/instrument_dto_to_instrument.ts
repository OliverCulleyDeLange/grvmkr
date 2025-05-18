import { defaultVolume, type HitDto, type HitTypeWithId, type InstrumentDto, type InstrumentWithId } from "$lib";
import { SvelteMap } from "svelte/reactivity";

export function mapInstrumentToDomain(instrumentDto: InstrumentDto, hitTypes: HitTypeWithId[]): InstrumentWithId {
    return {
        id: instrumentDto.id,
        gridIndex: instrumentDto.gridIndex,
        name: instrumentDto.name,
        hitTypes: new SvelteMap(hitTypes.map((hitType) => [hitType.id, hitType])),
        volume: instrumentDto.volume ?? defaultVolume,
    };
}

export function mapHitDtoToHitTypeWithId(dto: HitDto): HitTypeWithId {
    return {
        id: dto.id,
        key: dto.key,
        description: dto.description,
        audioFileName: dto.audioFileName
    }
}
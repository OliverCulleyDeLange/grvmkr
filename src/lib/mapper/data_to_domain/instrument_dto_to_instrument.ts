import { defaultVolume, type HitDto, type HitTypeWithId, type InstrumentDto, type InstrumentWithId } from "$lib";
import { SvelteMap } from "svelte/reactivity";

export function mapInstrumentDtoToInstrumentWithId(instrumentDto: InstrumentDto, hitTypes: HitTypeWithId[]): InstrumentWithId {
    return {
        id: instrumentDto.id,
        gridIndex: instrumentDto.gridIndex,
        name: instrumentDto.name,
        hitTypes: new SvelteMap(hitTypes.map((hitType) => [hitType.id, hitType])),
        volume: instrumentDto.volume ?? defaultVolume,
        muted: false,
        soloed: false,
    };
}

export function mapHitDtoToHitTypeWithId(dto: HitDto, volume: number | undefined): HitTypeWithId {
    return {
        id: dto.id,
        key: dto.key ?? "err",
        description: dto.description,
        audioFileName: dto.audioFileName,
        volume: volume ?? defaultVolume,
    }
}
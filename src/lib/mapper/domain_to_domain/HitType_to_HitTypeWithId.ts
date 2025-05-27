import type { HitType, HitTypeWithId } from "../../domain/types/instrument_domain";

export function mapHitTypeToHitTypeWithId(hitId: string, hit: HitType): HitTypeWithId {
    let hitWithId: HitTypeWithId = {
        id: hitId,
        key: hit.key,
        description: hit.description,
        audioFileName: hit.audioFileName,
        volume: hit.volume
    };
    return hitWithId;
}

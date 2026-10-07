import type { HitType, HitTypeWithId } from '../../domain/types/instrument_domain';

export function mapHitTypeToHitTypeWithId(hitId: string, hit: HitType): HitTypeWithId {
	const hitWithId: HitTypeWithId = {
		id: hitId,
		key: hit.key,
		description: hit.description,
		audioFileName: hit.audioFileName
	};
	return hitWithId;
}

import type { SavedHitV1 } from '$lib/data/types/serialisation/savefile_v1';
import type { HitTypeWithId } from '../../../domain/types/instrument_domain';

export function mapSavedHitV1ToHitTypeWithId(
	savedHit: SavedHitV1,
	instrumentVolume: number
): HitTypeWithId {
	let hit: HitTypeWithId = {
		id: savedHit.id,
		key: savedHit.key,
		description: savedHit.description,
		audioFileName: savedHit.audio_file_name,
		volume: instrumentVolume
	};
	return hit;
}

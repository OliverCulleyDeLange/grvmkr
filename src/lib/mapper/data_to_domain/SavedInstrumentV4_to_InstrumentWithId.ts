import type { SavedInstrumentV4 } from '$lib/data/types/serialisation/savefile_v4';
import { mapSavedHitV1ToHitTypeWithId } from '$lib/mapper/data_to_domain/SavedHitV1_to_HitTypeWithId';
import { SvelteMap } from 'svelte/reactivity';
import type { InstrumentWithId, HitId, HitTypeWithId } from '../../domain/types/instrument_domain';

export function mapSavedInstrumentsV4ToInstrumentWithIds(
	instruments: SavedInstrumentV4[]
): InstrumentWithId[] {
	return instruments.map((i) => mapSavedInstrumentV4ToInstrumentWithId(i));
}

export function mapSavedInstrumentV4ToInstrumentWithId(
	instrument: SavedInstrumentV4
): InstrumentWithId {
	const hitTypes: Map<HitId, HitTypeWithId> = new SvelteMap(
		instrument.hits.map((savedHit) => {
			const hit = mapSavedHitV1ToHitTypeWithId(savedHit, instrument.volume);
			return [hit.id, hit];
		})
	);
	const instrumentWithId: InstrumentWithId = {
		id: instrument.id,
		gridIndex: instrument.gridIndex,
		name: instrument.name,
		volume: instrument.volume,
		muted: false,
		soloed: false,
		hitTypes
	};
	return instrumentWithId;
}

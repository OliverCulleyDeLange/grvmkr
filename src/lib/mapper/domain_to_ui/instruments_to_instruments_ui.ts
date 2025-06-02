import {
	type HitTypeUi,
	type HitTypeWithId,
	type InstrumentId,
	type InstrumentsUi,
	type InstrumentUi,
	type InstrumentWithId
} from '$lib';

export function mapInstrumentsUi(instruments: Map<InstrumentId, InstrumentWithId>): InstrumentsUi {
	const ui: InstrumentsUi = {
		instruments: Array.from(instruments.values())
			.map((instrument) => mapInstrumentUi(instrument))
			.sort((a, b) => a.gridIndex - b.gridIndex)
	};
	return ui;
}

function mapInstrumentUi(instrument: InstrumentWithId): InstrumentUi {
	const ui: InstrumentUi = {
		id: instrument.id,
		name: instrument.name,
		gridIndex: instrument.gridIndex,
		hitTypes: Array.from(instrument.hitTypes.values()).map((h) => mapHitTypeUi(h))
	};
	return ui;
}

function mapHitTypeUi(hitType: HitTypeWithId): HitTypeUi {
	return {
		id: hitType.id,
		key: hitType.key,
		description: hitType.description,
		audioFileName: hitType.audioFileName
	};
}

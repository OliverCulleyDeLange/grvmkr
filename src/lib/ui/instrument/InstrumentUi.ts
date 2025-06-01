import type { HitId, InstrumentId } from '$lib/domain/types/instrument_domain';

export type InstrumentsUi = {
	instruments: InstrumentUi[];
};

export type InstrumentUi = {
	id: InstrumentId;
	name: string;
	gridIndex: number;
	hitTypes: HitTypeUi[];
};

export type HitTypeUi = {
	id: HitId;
	key: string;
	description: string;
	audioFileName: string;
};

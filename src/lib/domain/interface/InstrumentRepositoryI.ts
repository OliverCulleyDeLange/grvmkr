import type { HitType, InstrumentId, InstrumentWithId } from '$lib';

export interface InstrumentRepositoryI {
	getInstrument(id: string): InstrumentWithId | null;
	addDefaultInstrument(): Promise<void>;
	addHit(defaultHitType: HitType, instrumentId: InstrumentId): Promise<void>;
	removeInstrument(instrumentId: InstrumentId): Promise<void>;
	ensureInstrumentsInitialised(): Promise<void>;
	getInstruments(): Map<InstrumentId, InstrumentWithId>;
	replaceInstruments(instruments: InstrumentWithId[]): Promise<void>;
	moveInstrument(direction: 'up' | 'down', instrumentId: string): Promise<void>;
}

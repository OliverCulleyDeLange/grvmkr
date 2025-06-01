import {
	defaultHitType,
	type CellToolsRepositoryI,
	type FileRepositoryI,
	type GridRepositoryI,
	type InstrumentId,
	type InstrumentRepositoryI
} from '$lib';
import { syncInstruments } from './sync';

export async function addHitUseCase(
	instrumentId: InstrumentId,
	fileStore: FileRepositoryI,
	gridStore: GridRepositoryI,
	instrumentStore: InstrumentRepositoryI,
	cellToolsStore: CellToolsRepositoryI
) {
	await instrumentStore.addHit(defaultHitType, instrumentId);
	await syncInstruments(fileStore, gridStore, instrumentStore, cellToolsStore);
}

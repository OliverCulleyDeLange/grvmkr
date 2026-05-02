import { describe, expect, it } from 'vitest';
import { SvelteMap } from 'svelte/reactivity';
import type { GrvMkrFile, InstrumentWithId } from '$lib';
import { mapToDto } from './domain_to_data/file_to_file_dto';
import { mapFileDtoToFile } from './data_to_domain/file_dto_to_file';

function makeFile(instrumentVolumes?: Record<string, number>): GrvMkrFile {
	const instrument: InstrumentWithId = {
		id: 'inst-1',
		name: 'kick',
		gridIndex: 0,
		muted: false,
		soloed: false,
		hitTypes: new SvelteMap()
	};
	return {
		id: 'file-1',
		name: 'groove',
		grids: new Map(),
		instruments: new Map([[instrument.id, instrument]]),
		instrumentVolumes
	};
}

describe('FileDto <-> GrvMkrFile round-trip', () => {
	it('preserves instrumentVolumes through mapToDto', () => {
		const dto = mapToDto(makeFile({ 'inst-1': 0.42 }));
		expect(dto.instrumentVolumes).toEqual({ 'inst-1': 0.42 });
	});

	it('keeps instrumentVolumes undefined when the file has none', () => {
		const dto = mapToDto(makeFile(undefined));
		expect(dto.instrumentVolumes).toBeUndefined();
	});

	it('round-trips instrumentVolumes via mapToDto + mapFileDtoToFile', () => {
		const original = makeFile({ 'inst-1': 0.6 });
		const dto = mapToDto(original);
		const restored = mapFileDtoToFile(dto, original.grids, original.instruments);
		expect(restored.instrumentVolumes).toEqual({ 'inst-1': 0.6 });
	});

	it('produces a structuredClone-able instrumentVolumes when the source is a $state proxy', () => {
		// Simulate what $state does: deep reactive proxies wrap nested objects.
		// A transparent Proxy over the volumes object cannot be structuredCloned by browsers
		// (DataCloneError), so mapToDto must spread it into a plain object first.
		const proxiedVolumes = new Proxy({ 'inst-1': 0.75 }, {
			get(target, prop, receiver) { return Reflect.get(target, prop, receiver); },
			ownKeys(target) { return Reflect.ownKeys(target); },
			getOwnPropertyDescriptor(target, prop) { return Reflect.getOwnPropertyDescriptor(target, prop); }
		});
		const file = { ...makeFile({ 'inst-1': 0.75 }), instrumentVolumes: proxiedVolumes };
		const dto = mapToDto(file);
		// The result must be a plain object, not the proxy itself
		expect(dto.instrumentVolumes).not.toBe(proxiedVolumes);
		expect(Object.getPrototypeOf(dto.instrumentVolumes)).toBe(Object.prototype);
		expect(dto.instrumentVolumes).toEqual({ 'inst-1': 0.75 });
	});
});

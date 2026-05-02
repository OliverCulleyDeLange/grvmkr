import { describe, expect, it } from 'vitest';
import { SvelteMap } from 'svelte/reactivity';
import { defaultVolume } from '$lib';
import type { InstrumentWithId } from '$lib';
import { serialiseToSaveFileV5 } from './to_save_file_v5';

function makeInstrument(id: string, gridIndex = 0): InstrumentWithId {
	return {
		id,
		name: `inst-${id}`,
		gridIndex,
		muted: false,
		soloed: false,
		hitTypes: new SvelteMap()
	};
}

describe('serialiseToSaveFileV5', () => {
	it('writes per-instrument volume from the supplied map', () => {
		const instruments = [makeInstrument('a', 0), makeInstrument('b', 1)];
		const volumes = { a: 0.25, b: 0.75 };

		const file = serialiseToSaveFileV5('groove', [], instruments, volumes);

		expect(file.instruments.map((i) => [i.id, i.volume])).toEqual([
			['a', 0.25],
			['b', 0.75]
		]);
	});

	it('falls back to defaultVolume when an instrument has no entry in the volume map', () => {
		const instruments = [makeInstrument('a'), makeInstrument('b')];
		const volumes = { a: 0.3 }; // b is missing

		const file = serialiseToSaveFileV5('groove', [], instruments, volumes);

		expect(file.instruments.find((i) => i.id === 'b')!.volume).toBe(defaultVolume);
	});

	it('falls back to defaultVolume for every instrument when no volume map is provided', () => {
		const instruments = [makeInstrument('a'), makeInstrument('b')];

		const file = serialiseToSaveFileV5('groove', [], instruments);

		expect(file.instruments.every((i) => i.volume === defaultVolume)).toBe(true);
	});
});

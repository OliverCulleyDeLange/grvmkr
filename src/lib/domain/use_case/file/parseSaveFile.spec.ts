import { describe, expect, it } from 'vitest';
import type {
	SaveFileV3,
	SaveFileV4,
	SaveFileV5,
	SavedGridV3,
	SavedGridV5,
	SavedInstrumentV3,
	SavedInstrumentV4
} from '$lib';
import { parseSaveFile } from './loadFileUseCase';

function makeV4Instrument(id: string, volume: number, gridIndex = 0): SavedInstrumentV4 {
	return {
		type: 'instrument',
		version: 4,
		id,
		name: `inst-${id}`,
		gridIndex,
		hits: [],
		volume
	};
}

function makeV3Instrument(id: string, gridIndex = 0): SavedInstrumentV3 {
	return {
		type: 'instrument',
		version: 3,
		id,
		name: `inst-${id}`,
		gridIndex,
		hits: []
	};
}

function makeV3Grid(id: string): SavedGridV3 {
	return {
		type: 'grid',
		version: 3,
		id,
		config: {
			name: 'g',
			bpm: 120,
			bars: 1,
			beats_per_bar: 4,
			beat_divisions: 4
		},
		rows: []
	};
}

function makeV5Grid(id: string, index: number): SavedGridV5 {
	return {
		type: 'grid',
		version: 5,
		id,
		index,
		config: {
			name: 'g',
			bpm: 120,
			bars: 1,
			beats_per_bar: 4,
			beat_divisions: 4,
			repetitions: 1
		},
		rows: []
	};
}

describe('parseSaveFile', () => {
	it('extracts instrumentVolumes from a V5 save', () => {
		const save: SaveFileV5 = {
			type: 'savefile',
			version: 5,
			name: 'groove',
			instruments: [makeV4Instrument('a', 0.2), makeV4Instrument('b', 0.9, 1)],
			grids: [makeV5Grid('g1', 0)]
		};

		const file = parseSaveFile(JSON.stringify(save));

		expect(file.instrumentVolumes).toEqual({ a: 0.2, b: 0.9 });
		expect(file.instruments.size).toBe(2);
	});

	it('extracts instrumentVolumes from a V4 save', () => {
		const save: SaveFileV4 = {
			type: 'savefile',
			version: 4,
			name: 'groove',
			instruments: [makeV4Instrument('a', 0.4)],
			grids: [makeV3Grid('g1')]
		};

		const file = parseSaveFile(JSON.stringify(save));

		expect(file.instrumentVolumes).toEqual({ a: 0.4 });
	});

	it('leaves instrumentVolumes undefined for pre-V4 saves with no volume field', () => {
		const save: SaveFileV3 = {
			type: 'savefile',
			version: 3,
			name: 'groove',
			instruments: [makeV3Instrument('a')],
			grids: [makeV3Grid('g1')]
		};

		const file = parseSaveFile(JSON.stringify(save));

		expect(file.instrumentVolumes).toBeUndefined();
	});

	it('throws an unsupported-version error when the version field is missing', () => {
		const malformed = JSON.stringify({ type: 'savefile', name: 'mystery' });
		expect(() => parseSaveFile(malformed)).toThrow(/Unsupported file version/);
	});

	it('throws a descriptive error when an instrument has no hits array', () => {
		const save = {
			type: 'savefile',
			version: 5,
			name: 'broken',
			instruments: [
				{
					type: 'instrument',
					version: 4,
					id: 'a',
					name: 'kick',
					gridIndex: 0,
					volume: 0.5
					// hits intentionally missing
				}
			],
			grids: [makeV5Grid('g1', 0)]
		};

		expect(() => parseSaveFile(JSON.stringify(save))).toThrow(
			/instrument "kick" is missing its hits/
		);
	});

	it('throws a descriptive error when the instruments list is missing entirely', () => {
		const save = {
			type: 'savefile',
			version: 5,
			name: 'broken',
			grids: [makeV5Grid('g1', 0)]
		};

		expect(() => parseSaveFile(JSON.stringify(save))).toThrow(/missing its instruments/);
	});

	it('does not leak a volume field onto the resulting hit/instrument domain objects', () => {
		const save: SaveFileV5 = {
			type: 'savefile',
			version: 5,
			name: 'groove',
			instruments: [
				{
					...makeV4Instrument('a', 0.3),
					hits: [
						{
							type: 'hit',
							version: 1,
							id: 'h1',
							key: 'X',
							description: '',
							audio_file_name: 'kick.mp3'
						}
					]
				}
			],
			grids: [makeV5Grid('g1', 0)]
		};

		const file = parseSaveFile(JSON.stringify(save));
		const instrument = file.instruments.get('a')!;
		const hit = instrument.hitTypes.get('h1')!;

		expect('volume' in instrument).toBe(false);
		expect('volume' in hit).toBe(false);
	});
});

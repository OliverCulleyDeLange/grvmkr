import type {
	SavedGridConfigV2,
	SavedGridRowV3,
	SavedGridV3,
	SavedHitV1,
	SavedInstrumentV4,
	SaveFile
} from '$lib';

// Don't change anything in here.
// If things change, create a V6 and confirm backwards compatibility with V5 to V1 files.
// Changes since V4:
// - Added grid index for reordering
// - Added grid config repetitions for looping a grid a given number of times

export type SaveFileV5 = SaveFile & {
	type: 'savefile';
	version: 5;

	name: string;
	instruments: SavedInstrumentV4[];
	grids: SavedGridV5[];
};

export type SavedGridV5 = {
	type: 'grid';
	version: 5;

	id: string;
	index: number;
	config: SavedGridConfigV5;
	rows: SavedGridRowV3[];
};

export type SavedGridConfigV5 = {
	name: string;
	bpm: number;
	bars: number;
	beats_per_bar: number;
	beat_divisions: number;
	repetitions: number;
};

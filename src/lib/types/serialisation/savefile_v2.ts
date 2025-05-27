import type { SavedGridRowV1, SavedInstrumentV1, SaveFile } from '$lib';

// Don't change anything in here.
// If things change, create a V3 and confirm backwards compatibility with V2&V1 files.
// Changes since V1:
// - Added name to SavedGridConfigV2 (Grid name labels)
// - Added name to SaveFileV2 (File name label)

export type SaveFileV2 = SaveFile & {
	type: 'savefile';
	version: 2;

	name: string;
	instruments: SavedInstrumentV1[];
	grids: SavedGridV2[];
};

export type SavedGridV2 = {
	type: 'grid';
	version: 2;

	id: string;
	config: SavedGridConfigV2;
	rows: SavedGridRowV1[];
};

export type SavedGridConfigV2 = {
	name: string;
	bpm: number;
	bars: number;
	beats_per_bar: number;
	beat_divisions: number;
};

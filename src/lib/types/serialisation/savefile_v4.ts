import type { SavedGridV3, SavedHitV1, SaveFile } from '$lib';

// Don't change anything in here.
// If things change, create a V5 and confirm backwards compatibility with V4 to V1 files.
// Changes since V3:
// - Added insstrument volumes

export type SaveFileV4 = SaveFile & {
	type: 'savefile';
	version: 4;

	name: string;
	instruments: SavedInstrumentV4[];
	grids: SavedGridV3[];
};

export type SavedInstrumentV4 = {
	type: 'instrument';
	version: 4;

	id: string;
	name: string;
	gridIndex: number;
	hits: SavedHitV1[];
	volume: number;
};

// Types for storing in the DB
export type InstrumentDtoId = string;
export type HitDtoId = string;
// The key is the grid key, ie O for open, C for closed
export type HitKey = string | undefined;

// Stored in the instruments store
export type InstrumentDto = {
	id: InstrumentDtoId;
	hitTypes: HitDtoId[];
	gridIndex: number;
	name: string;
	volume: number | undefined;
};

// Stored in the hits store
export type HitDto = {
	id: HitDtoId;
	key: HitKey;
	description: string;
	audioFileName: string;
};

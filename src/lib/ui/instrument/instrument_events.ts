import type { HitId, HitTypeWithId, InstrumentHit, InstrumentId } from '$lib';

// Instrument UI Events
export type InstrumentEvents =
	| RemoveInstrument
	| AddInstrument
	| RenameInstrument
	| MoveUp
	| MoveDown
	| AddHit
	| ChangeSample
	| ChangeHitKey
	| ChangeHitDescription
	| RemoveHit
	| PlayHit;

export enum InstrumentEvent {
	RemoveInstrument = 'RemoveInstrument',
	AddInstrument = 'AddInstrument',
	RenameInstrument = 'RenameInstrument',
	MoveUp = 'MoveUp',
	MoveDown = 'MoveDown',
	AddHit = 'AddHit',
	ChangeHitKey = 'ChangeHitKey',
	ChangeHitDescription = 'ChangeHitDescription',
	ChangeSample = 'ChangeSample',
	RemoveHit = 'RemoveHit',
	PlayHit = 'PlayHit'
}

export type RemoveInstrument = {
	event: InstrumentEvent.RemoveInstrument;
	instrumentId: InstrumentId;
};
export type AddInstrument = {
	event: InstrumentEvent.AddInstrument;
};
export type RenameInstrument = {
	event: InstrumentEvent.RenameInstrument;
	instrumentId: InstrumentId;
	newName: string;
};
export type MoveUp = {
	event: InstrumentEvent.MoveUp;
	instrumentId: InstrumentId;
};
export type MoveDown = {
	event: InstrumentEvent.MoveDown;
	instrumentId: InstrumentId;
};

export type AddHit = {
	event: InstrumentEvent.AddHit;
	instrumentId: InstrumentId;
};

export type ChangeSample = {
	event: InstrumentEvent.ChangeSample;
	instrumentId: InstrumentId;
	hitId: HitId;
	file: File;
};

export type ChangeHitKey = {
	event: InstrumentEvent.ChangeHitKey;
	instrumentId: InstrumentId;
	hitId: HitId;
	newKey: string;
};

export type ChangeHitDescription = {
	event: InstrumentEvent.ChangeHitDescription;
	instrumentId: InstrumentId;
	hitId: HitId;
	description: string;
};

export type RemoveHit = {
	event: InstrumentEvent.RemoveHit;
	instrumentId: InstrumentId;
	hitId: HitId;
};
export type PlayHit = {
	event: InstrumentEvent.PlayHit;
	instrumentHit: InstrumentHit;
};

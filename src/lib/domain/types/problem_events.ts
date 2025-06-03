import type { HitTypeWithId } from './instrument_domain';

export type OnProblemEvent = (event: ProblemEvents) => void;

export type ProblemEvents = DatabaseError | DebugLog | MissingSampleAudio | LoadedNonGrooveFile;

export enum ProblemEvent {
	MissingSampleAudio = 'MissingSampleAudio',
	DatabaseError = 'DatabaseError',
	LoadedNonGrooveFile = 'LoadedNonGrooveFile',
	DebugLog = 'DebugLog'
}

export type MissingSampleAudio = {
	event: ProblemEvent.MissingSampleAudio;
	hit: HitTypeWithId;
};

export type DatabaseError = {
	event: ProblemEvent.DatabaseError;
	doingWhat: string;
	error: string;
};

export type LoadedNonGrooveFile = {
	event: ProblemEvent.LoadedNonGrooveFile;
};

export type DebugLog = {
	event: ProblemEvent.DebugLog;
	msg: string;
};

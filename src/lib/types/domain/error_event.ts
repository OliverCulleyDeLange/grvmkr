import type { HitTypeWithId } from "./instrument_domain";

export type OnErrorEvent = (event: ProblemEvents) => void;

export type ProblemEvents = DatabaseError | DebugLog | MissingSampleAudio;

export enum ProblemEvent {
	MissingSampleAudio = 'MissingSampleAudio',
	DatabaseError = 'DatabaseError',
	DebugLog = 'DebugLog'
}

export type MissingSampleAudio = {
	event: ProblemEvent.MissingSampleAudio;
	hit: HitTypeWithId
};

export type DatabaseError = {
	event: ProblemEvent.DatabaseError;
	doingWhat: string;
	error: string;
};

export type DebugLog = {
	event: ProblemEvent.DebugLog;
	msg: string;
};

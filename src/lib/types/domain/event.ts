export type OnDomainEvent = (event: DomainEvents) => void;

export type DomainEvents = DatabaseError | DebugLog;

export enum DomainEvent {
	DatabaseError = 'DatabaseError',
	DebugLog = 'DebugLog'
}

export type DatabaseError = {
	event: DomainEvent.DatabaseError;
	doingWhat: string;
	error: string;
};

export type DebugLog = {
	event: DomainEvent.DebugLog;
	msg: string;
};

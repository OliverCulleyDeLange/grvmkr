import type { ErrorId } from "$lib"

export type OnDomainEvent = (event: DomainEvents) => void

export type DomainEvents = DatabaseError

export enum DomainEvent {
    DatabaseError = "DatabaseError",
}

export type DatabaseError = {
    event: DomainEvent.DatabaseError
    doingWhat: string
    error: string
}
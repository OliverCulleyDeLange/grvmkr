import type { UiEvents } from '$lib';
import type { DomainEvent, DomainEvents } from './domain/event';

export type OnEvent = (event: AppEvent) => void;

export type AppEvent = UiEvents | DomainEvents;

import type { UiEvents } from '$lib';
import type { ProblemEvent, ProblemEvents } from './domain/error_event';

export type OnEvent = (event: AppEvent) => void;

export type AppEvent = UiEvents | ProblemEvents;

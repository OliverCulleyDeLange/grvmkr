import type { ProblemEvents, UiEvents } from '$lib';

export type OnEvent = (event: AppEvent) => void;

export type AppEvent = UiEvents | ProblemEvents;

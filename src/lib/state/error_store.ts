import type { ErrorId, AppError } from '$lib/types/domain/error';
import { ProblemEvent, type DatabaseError, type DebugLog, type MissingSampleAudio, type ProblemEvents } from '$lib/types/domain/error_event';
import { SvelteMap } from 'svelte/reactivity';

export type ErrorStore = {
	errors: Map<ErrorId, AppError>;
	addError: (error: ProblemEvents) => void;
	debugLog: (error: DebugLog) => void;
	dismissError: (id: string) => void;
};

export const createErrorStore = (): ErrorStore => {
	const errors: SvelteMap<ErrorId, AppError> = new SvelteMap();

	function addError(event: ProblemEvents) {
		if (event.event == ProblemEvent.DatabaseError) {
			handleDatabaseErrors(event);
		} else if (event.event == ProblemEvent.MissingSampleAudio) {
			handleMissingSampleAudio(event)
		}
	}

	function debugLog(event: DebugLog) {
		const error = {
			id: crypto.randomUUID(),
			message: event.msg
		};
		errors.set(error.id, error);
	}

	function dismissError(id: string) {
		let success = errors.delete(id);
		console.log(`Dismissed error with id ${id}, success: ${success}`);
	}

	function handleMissingSampleAudio(event: MissingSampleAudio) {
		const error = {
			id: crypto.randomUUID(),
			message: `Missing audio sample '${event.hit.audioFileName}' for hit key: ${event.hit.key}. Please re-import.`
		};
		errors.set(error.id, error);
	}

	function handleDatabaseErrors(event: DatabaseError) {
		if (event.error == 'UnknownError: The user denied permission to access the database.') {
			const error = {
				id: crypto.randomUUID(),
				message: "You have denied local storage. Please go to settings/content/cookies and enable 'allow sites to save and read cookie data', then refresh the page"
			};
			errors.set(error.id, error);
		} else {
			const error = {
				id: crypto.randomUUID(),
				message: `Error ${event.doingWhat}: [${event.error}]`
			};
			errors.set(error.id, error);
		}
	}

	return { errors, addError, debugLog, dismissError };
};


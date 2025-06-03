import type { ErrorId, AppError, LoadedNonGrooveFile } from '$lib';
import {
	ProblemEvent,
	type DatabaseError,
	type DebugLog,
	type MissingSampleAudio,
	type ProblemEvents
} from '$lib';
import { SvelteMap } from 'svelte/reactivity';

export class ErrorStore {
	errors: SvelteMap<ErrorId, AppError> = new SvelteMap();

	addError(event: ProblemEvents) {
		switch (event.event) {
			case ProblemEvent.DatabaseError:
				this.handleDatabaseErrors(event);
				break;
			case ProblemEvent.MissingSampleAudio:
				this.handleMissingSampleAudio(event);
				break;
			case ProblemEvent.LoadedNonGrooveFile:
				this.handleLoadedNonGrooveFile(event);
				break;
		}
	}

	debugLog(event: DebugLog) {
		const error: AppError = {
			id: crypto.randomUUID(),
			message: event.msg
		};
		this.errors.set(error.id, error);
	}

	dismissError(id: string) {
		const success = this.errors.delete(id);
		console.log(`Dismissed error with id ${id}, success: ${success}`);
	}

	private handleMissingSampleAudio(event: MissingSampleAudio) {
		const error: AppError = {
			id: crypto.randomUUID(),
			message: `Missing audio sample '${event.hit.audioFileName}' for hit key: ${event.hit.key}. Please re-import.`
		};
		this.errors.set(error.id, error);
	}

	private handleDatabaseErrors(event: DatabaseError) {
		const error: AppError =
			event.error === 'UnknownError: The user denied permission to access the database.'
				? {
					id: crypto.randomUUID(),
					message:
						"You have denied local storage. Please go to settings/content/cookies and enable 'allow sites to save and read cookie data', then refresh the page"
				}
				: {
					id: crypto.randomUUID(),
					message: `Error ${event.doingWhat}: [${event.error}]`
				};

		this.errors.set(error.id, error);
	}

	private handleLoadedNonGrooveFile(event: LoadedNonGrooveFile) {
		const error: AppError = {
			id: crypto.randomUUID(),
			message: `The file you tried to load was not a groove file. Please select only .grv files. `
		};

		this.errors.set(error.id, error);
	}
}

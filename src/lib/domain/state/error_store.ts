import type { ErrorId, AppError, LoadedNonGrooveFile, LoadedInvalidGrooveFile } from '$lib';
import {
	ProblemEvent,
	type DatabaseError,
	type DebugLog,
	type MissingSampleAudio,
	type ProblemEvents
} from '$lib';
import { SvelteMap } from 'svelte/reactivity';

const SUPPORT_EMAIL = 'grvmkr@oliverdelange.co.uk';

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
			case ProblemEvent.LoadedInvalidGrooveFile:
				this.handleLoadedInvalidGrooveFile(event);
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
			id: event.hit.audioFileName,
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
			message: `"${event.fileName}" doesn't look like a groove file. GrvMkr expects a .grv file (or .zip / .json export).`,
			contact: {
				email: SUPPORT_EMAIL,
				subject: `GrvMkr: unrecognised file "${event.fileName}"`,
				prompt: "If you think this file should work, send it to me and I'll take a look:"
			}
		};

		this.errors.set(error.id, error);
	}

	private handleLoadedInvalidGrooveFile(event: LoadedInvalidGrooveFile) {
		const error: AppError = {
			id: crypto.randomUUID(),
			message: `Couldn't load "${event.fileName}" — the file looks like a groove file but something went wrong: ${event.reason}`,
			contact: {
				email: SUPPORT_EMAIL,
				subject: `GrvMkr: failed to load "${event.fileName}"`,
				prompt:
					"If this groove is important to you, send the file over and I'll see if I can recover it:"
			}
		};

		this.errors.set(error.id, error);
	}
}

import type { GrvMkrFileId } from '$lib';

// Singleton handler for local storage values
class KeyValueRepository {
	private readonly WORKING_FILE_ID_KEY = 'WORKING_FILE_ID';
	private readonly THEME_KEY = 'THEME';
	private readonly SEEN_WELCOME_KEY = 'SEEN_WELCOME';

	saveWorkingFileId(id: GrvMkrFileId) {
		localStorage.setItem(this.WORKING_FILE_ID_KEY, id);
	}

	getWorkingFileId(): GrvMkrFileId | null {
		return localStorage.getItem(this.WORKING_FILE_ID_KEY);
	}

	saveTheme(theme: string) {
		localStorage.setItem(this.THEME_KEY, theme);
	}

	getTheme(): string | null {
		return localStorage.getItem(this.THEME_KEY);
	}

	// We store the date which they saw the welcome on
	saveWelcomeSeenOn(seenOn: string) {
		localStorage.setItem(this.SEEN_WELCOME_KEY, seenOn);
	}

	getWelcomeSeenOn(): string | null {
		return localStorage.getItem(this.SEEN_WELCOME_KEY);
	}
}

// Singleton
export const keyValueRepository = new KeyValueRepository();

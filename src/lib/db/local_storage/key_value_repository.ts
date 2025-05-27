import type { GrvMkrFileId } from '$lib/types/domain/file_domain';

// Singleton handler for local storage values
class KeyValueRepository {
	private readonly WORKING_FILE_ID_KEY = 'WORKING_FILE_ID';
	private readonly THEME_KEY = 'THEME';
	
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
}

// Singleton
export const keyValueRepository = new KeyValueRepository();
import type { GrvMkrFileId } from "$lib/types/domain/file_domain";

const WORKING_FILE_ID_KEY = 'WORKING_FILE_ID_KEY';

export function saveWorkingFileId(id: GrvMkrFileId) {
	localStorage.setItem(WORKING_FILE_ID_KEY, id);
}

export function getWorkingFileId(): GrvMkrFileId | null {
	return localStorage.getItem(WORKING_FILE_ID_KEY);
}
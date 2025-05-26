import type { FileDto, FileDtoId } from "$lib/types/data/file_data";
import { getDataDb } from "./data_db";
import { FILE_STORE } from "./db_config";

export class FileTable {

    async saveFile(file: FileDto): Promise<void> {
        const db = await getDataDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(FILE_STORE, "readwrite");
            const store = tx.objectStore(FILE_STORE);
            const request = store.put(file);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getFile(id: FileDtoId): Promise<FileDto | undefined> {
        const db = await getDataDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(FILE_STORE, "readonly");
            const store = tx.objectStore(FILE_STORE);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllFiles(): Promise<FileDto[]> {
        const db = await getDataDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(FILE_STORE, "readonly");
            const store = tx.objectStore(FILE_STORE);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteFile(id: FileDtoId): Promise<void> {
        const db = await getDataDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(FILE_STORE, "readwrite");
            const store = tx.objectStore(FILE_STORE);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /** ✅ Delete all files */
    async deleteAllFiles(): Promise<void> {
        const db = await getDataDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(FILE_STORE, "readwrite");
            const store = tx.objectStore(FILE_STORE);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Failed to delete all files");
        });
    }
}

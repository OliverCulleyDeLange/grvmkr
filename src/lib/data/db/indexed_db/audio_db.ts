import { AUDIO_DB_NAME, AUDIO_DB_STORES, AUDIO_DB_VERSION, SAMPLE_STORE } from './db_config';

// Wraps indexedDB - giving access to the audio sample files
export class AudioDb {
	async audioExists(fileName: string): Promise<boolean> {
		return this.onDb((db, resolve) => {
			const transaction = db.transaction(SAMPLE_STORE, 'readonly');
			const store = transaction.objectStore(SAMPLE_STORE);
			const request = store.get(fileName);
			request.onsuccess = () => {
				if (request.result) {
					resolve(true);
				} else {
					resolve(false);
				}
			};
			request.onerror = () => resolve(false);
		});
	}

	storeAudio(blob: Blob, filename: string): Promise<string> {
		return this.onDb((db, resolve, reject) => {
			const reader = new FileReader();
			reader.readAsArrayBuffer(blob);

			reader.onload = () => {
				const transaction = db.transaction(SAMPLE_STORE, 'readwrite');
				const store = transaction.objectStore(SAMPLE_STORE);

				const request = store.put({ name: filename, data: reader.result });
				request.onsuccess = () => resolve(filename);
				request.onerror = () => reject(`Failed to store audio file ${filename}`);
			};

			reader.onerror = (err) => reject(err);
		});
	}

	// Returns the blob URL of the audio file from the DB
	// Rejects promise if nothing found
	async loadAudioFileUrl(fileName: string): Promise<string> {
		return this.onDb((db, resolve, reject) => {
			const transaction = db.transaction(SAMPLE_STORE, 'readonly');
			const store = transaction.objectStore(SAMPLE_STORE);
			const request = store.get(fileName);
			request.onsuccess = () => {
				if (request.result) {
					const blob = new Blob([request.result.data], { type: 'audio/*' });
					const url = URL.createObjectURL(blob);
					resolve(url);
				} else {
					reject('loadAudio: onsuccess but no result');
				}
			};
			request.onerror = () => reject(request.error);
		});
	}

	private onDb(
		doStuff: (
			db: IDBDatabase,
			resolve: (val: unknown) => void,
			reject: (reason?: any) => void
		) => any
	): Promise<any> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(AUDIO_DB_NAME, AUDIO_DB_VERSION);

			request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
				console.log(`Upgrading ${AUDIO_DB_NAME}`);
				const db = (event.target as IDBOpenDBRequest).result;
				AUDIO_DB_STORES.forEach((storeName) => {
					if (!db.objectStoreNames.contains(storeName)) {
						db.createObjectStore(storeName, { keyPath: 'name' });
						console.log(`Upgrading: created object store [${storeName}]`);
					}
				});
			};

			request.onsuccess = (event: Event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				doStuff(db, resolve, reject);
			};
		});
	}
}

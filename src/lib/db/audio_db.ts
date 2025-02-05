
const audioDbName = "audioDb"
const sampleStoreName = "samples"

export class AudioDb {
    async audioExists(fileName: string): Promise<boolean> {
        return this.onDb((db, resolve) => {
            const transaction = db.transaction(sampleStoreName, 'readonly');
            const store = transaction.objectStore(sampleStoreName);
            const request = store.get(fileName);
            request.onsuccess = () => {
                if (request.result) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            };
            request.onerror = () => resolve(false);
        })
    }

    storeAudio(file: File): Promise<string> {
        return this.onDb((db, resolve, reject) => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);

            reader.onload = () => {
                const transaction = db.transaction(sampleStoreName, 'readwrite');
                const store = transaction.objectStore(sampleStoreName);

                store.put({ name: file.name, data: reader.result });
                // console.log(`Stored file ${file.name}`);
                resolve(file.name)
            };

            reader.onerror = (err) => reject(err)
        })
    }

    // Returns the blob URL of the audio file from the DB
    // Rejects promise if nothing found
    loadAudio(fileName: string): Promise<string> {
        return this.onDb((db, resolve, reject) => {
            const transaction = db.transaction(sampleStoreName, 'readonly');
            const store = transaction.objectStore(sampleStoreName);
            const request = store.get(fileName);
            request.onsuccess = () => {
                if (request.result) {
                    const blob = new Blob([request.result.data], { type: 'audio/*' });
                    const url = URL.createObjectURL(blob);
                    resolve(url)
                } else {
                    reject("loadAudio: onsuccess but no result");
                }
            };
            request.onerror = () => reject(request.error);
        })
    }

    private onDb(doStuff: (db: IDBDatabase, resolve: (val: unknown) => void, reject: (reason?: any) => void) => any): Promise<any> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(audioDbName, 1);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                console.log('Upgrading indexedDB');
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(sampleStoreName)) {
                    db.createObjectStore(sampleStoreName, { keyPath: 'name' });
                    console.log(`Upgrading: created object store ${sampleStoreName}`);
                }
            };


            request.onsuccess = (event: Event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                doStuff(db, resolve, reject)
            }
        })
    }
}
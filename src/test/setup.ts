import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach } from 'vitest';

beforeEach(() => {
	// Each test gets an isolated browser database. This also prevents async
	// persistence from a previously unmounted page leaking into the next test.
	globalThis.indexedDB = new IDBFactory();
	globalThis.localStorage?.clear();
});

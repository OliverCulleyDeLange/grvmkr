<script lang="ts">
	import type { InstrumentManager } from '$lib';

	let { instrumentManager }: { instrumentManager: InstrumentManager } = $props();

	function handleFile(event: Event) {
		const fileInput = event.target as HTMLInputElement;
		if (fileInput.files && fileInput.files[0]) {
			storeAudio(fileInput.files[0]);
		}
	}

	function storeAudio(file: File): void {
		const request = indexedDB.open('audioDB', 1);

		request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
			console.log('onupgradeneeded');
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains('sounds')) {
				db.createObjectStore('sounds', { keyPath: 'name' });
				console.log('created object store sounds');
			}
		};

		request.onsuccess = (event: Event) => {
			const reader = new FileReader();
			reader.readAsArrayBuffer(file);

			reader.onload = () => {
				const db = (event.target as IDBOpenDBRequest).result;
				const transaction = db.transaction('sounds', 'readwrite');
				const store = transaction.objectStore('sounds');

				store.put({ name: file.name, data: reader.result });
				console.log(`Stored file ${file.name}`);
			};
		};
	}

	function playStoredAudio(fileName: string): void {
		const request = indexedDB.open('audioDB', 1);

		request.onsuccess = (event: Event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			const transaction = db.transaction('sounds', 'readonly');
			const store = transaction.objectStore('sounds');
			const getRequest = store.get(fileName);

			getRequest.onsuccess = () => {
				if (getRequest.result) {
					const blob = new Blob([getRequest.result.data], { type: 'audio/*' });
					const url = URL.createObjectURL(blob);
					const audio = new Audio(url);
					audio.play();
				}
			};
		};
	}
</script>

<h1 class="text-xl">Instruments</h1>
{#each [...instrumentManager.instruments] as [instrumentId, instrument]}
	<input
		value={instrument.name}
		oninput={(e) => instrumentManager.onChangeName(e.target.value, instrumentId)}
		type="text"
		class="block rounded-lg border border-gray-300 bg-gray-300 p-2 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500"
	/>
	{#each [...instrument.hitTypes] as [hitId, hit]}
		<ul class="text-sm text-gray-600">
			<li class="flex-right flex p-1">
				<input
					value={hit.key}
					oninput={(e) => instrumentManager.onChangeHitKey(e.target.value, instrumentId, hitId)}
					type="text"
					class="block w-8 rounded-lg border border-gray-300 bg-gray-300 p-1 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500"
				/>
				➜
				<input
					value={hit.description}
					oninput={(e) =>
						instrumentManager.onChangeHitDescription(e.target.value, instrumentId, hitId)}
					type="text"
					class="block w-24 rounded-lg border border-gray-300 bg-gray-300 p-1 text-xs text-gray-900 focus:border-blue-500 focus:ring-blue-500"
				/>

				<input type="file" onchange={handleFile} accept="audio/*" />
				<button onclick={() => playStoredAudio('kick.wav')}>Play</button>
			</li>
		</ul>
	{/each}
{/each}

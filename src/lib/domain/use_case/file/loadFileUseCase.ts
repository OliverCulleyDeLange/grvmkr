import {
	AudioDb,
	generateFileId,
	generateGridId,
	mapSavedGridV1ToGrid,
	mapSavedGridV2ToGrid,
	mapSavedGridV3ToGrid,
	mapSavedGridV5ToGrid,
	mapSavedInstrumentsV1ToInstrumentWithIds,
	mapSavedInstrumentsV3ToInstrumentWithIds,
	mapSavedInstrumentsV4ToInstrumentWithIds,
	ProblemEvent,
	type FileRepositoryI,
	type Grid,
	type GridRepositoryI,
	type GrvMkrFile,
	type InstrumentId,
	type InstrumentRepositoryI,
	type InstrumentWithId,
	type OnEvent,
	type PlaybackControllerI,
	type SaveFile,
	type SaveFileV1,
	type SaveFileV2,
	type SaveFileV3,
	type SaveFileV4,
	type SaveFileV5
} from '$lib';
import JSZip from 'jszip';

export async function loadFileUseCase(
	onEvent: OnEvent,
	file: File,
	fileRepository: FileRepositoryI,
	instrumentRepository: InstrumentRepositoryI,
	gridRepository: GridRepositoryI,
	player: PlaybackControllerI
) {
	if (!(file.name.endsWith('.grv') || file.name.endsWith('.zip') || file.name.endsWith('.json'))) {
		onEvent({ event: ProblemEvent.LoadedNonGrooveFile, fileName: file.name });
		return;
	}

	const audioDb = new AudioDb();
	player.stop();

	const isGrvMkrFile = file.name.endsWith('.grv') || file.name.endsWith('.zip');
	let grvMkrFile: GrvMkrFile;
	try {
		grvMkrFile = isGrvMkrFile ? await loadFromZip(file, audioDb) : await loadFromJsonFile(file);
	} catch (e) {
		onEvent({
			event: ProblemEvent.LoadedInvalidGrooveFile,
			fileName: file.name,
			reason: describeLoadError(e)
		});
		return;
	}

	const previousInstruments = Array.from(instrumentRepository.getInstruments().values());
	const previousGrids = Array.from(gridRepository.getGrids().values());
	const currentFile = fileRepository.getFile();
	const previousFile: GrvMkrFile = {
		...currentFile,
		grids: new Map(previousGrids.map((grid) => [grid.id, grid])),
		instruments: new Map(previousInstruments.map((instrument) => [instrument.id, instrument])),
		instrumentVolumes: currentFile.instrumentVolumes
			? { ...currentFile.instrumentVolumes }
			: undefined
	};
	try {
		await instrumentRepository.replaceInstruments(Array.from(grvMkrFile.instruments.values()));
		await gridRepository.replaceGrids(Array.from(grvMkrFile.grids.values()), true);
		await fileRepository.loadFile(grvMkrFile);
	} catch (e) {
		// The repositories currently use separate IndexedDB transactions. Restore
		// the previous workspace if any stage of the import fails so the UI is not
		// left showing a half-imported groove.
		try {
			await instrumentRepository.replaceInstruments(previousInstruments);
			await gridRepository.replaceGrids(previousGrids, true);
			await fileRepository.loadFile(previousFile);
		} catch (rollbackError) {
			console.error('Failed to roll back groove import:', rollbackError);
		}
		onEvent({
			event: ProblemEvent.LoadedInvalidGrooveFile,
			fileName: file.name,
			reason: describeLoadError(e)
		});
	}
}

function describeLoadError(e: unknown): string {
	if (e instanceof Error) return e.message;
	if (typeof e === 'string') return e;
	return 'unknown error';
}

async function loadFromZip(file: File, audioDb: AudioDb): Promise<GrvMkrFile> {
	const zip = await JSZip.loadAsync(file);
	const grooveFile = zip.file('groovefile.json');
	if (!grooveFile) throw new Error('Missing groovefile.json');

	const fileText = await grooveFile.async('string');
	const grvMkrFile = parseSaveFile(fileText, true);

	const entries = Object.values(zip.files).filter(
		(entry) => !entry.dir && entry.name.startsWith('audio/')
	);
	for (const instrument of grvMkrFile.instruments.values()) {
		for (const hit of instrument.hitTypes.values()) {
			if (!hit.audioFileName) continue;
			const entry = entries.find(
				(candidate) => candidate.name.split('/').pop() === hit.audioFileName
			);
			if (!entry) continue;
			const safeName = hit.audioFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
			const uniqueName = `${hit.id}--grvmkr--${crypto.randomUUID()}--grvmkr--${safeName}`;
			await audioDb.storeAudio(await entry.async('blob'), uniqueName);
			hit.audioFileName = uniqueName;
		}
	}

	return grvMkrFile;
}

async function loadFromJsonFile(file: File): Promise<GrvMkrFile> {
	const fileText = await file.text();
	const grvMkrFile: GrvMkrFile = parseSaveFile(fileText, true);
	return grvMkrFile;
}

export function parseSaveFile(saveFileText: string, regenerateIds = false): GrvMkrFile {
	const saveFileBase: SaveFile = JSON.parse(saveFileText);

	let instruments: InstrumentWithId[] = [];
	let grids: Grid[] = [];
	let keyedInstruments = new Map<InstrumentId, InstrumentWithId>();
	let fileName = '';
	let instrumentVolumes: Record<InstrumentId, number> | undefined;

	switch (saveFileBase.version) {
		case 1: {
			const f = saveFileBase as SaveFileV1;
			instruments = mapSavedInstrumentsV1ToInstrumentWithIds(f.instruments);
			keyedInstruments = new Map(instruments.map((i) => [i.id, i]));
			grids = f.grids.map((g, i) => mapSavedGridV1ToGrid(g, i, keyedInstruments));
			break;
		}
		case 2: {
			const f = saveFileBase as SaveFileV2;
			instruments = mapSavedInstrumentsV1ToInstrumentWithIds(f.instruments);
			keyedInstruments = new Map(instruments.map((i) => [i.id, i]));
			grids = f.grids.map((g, i) => mapSavedGridV2ToGrid(g, i, keyedInstruments));
			fileName = f.name;
			break;
		}
		case 3: {
			const f = saveFileBase as SaveFileV3;
			instruments = mapSavedInstrumentsV3ToInstrumentWithIds(f.instruments);
			keyedInstruments = new Map(instruments.map((i) => [i.id, i]));
			grids = f.grids.map((g, i) => mapSavedGridV3ToGrid(g, i, keyedInstruments));
			fileName = f.name;
			break;
		}
		case 4: {
			const f = saveFileBase as SaveFileV4;
			instruments = mapSavedInstrumentsV4ToInstrumentWithIds(f.instruments);
			keyedInstruments = new Map(instruments.map((i) => [i.id, i]));
			grids = f.grids.map((g, i) => mapSavedGridV3ToGrid(g, i, keyedInstruments));
			fileName = f.name;
			instrumentVolumes = Object.fromEntries(f.instruments.map((i) => [i.id, i.volume]));
			break;
		}
		case 5: {
			const f = saveFileBase as SaveFileV5;
			instruments = mapSavedInstrumentsV4ToInstrumentWithIds(f.instruments);
			keyedInstruments = new Map(instruments.map((i) => [i.id, i]));
			grids = f.grids.map((g) => mapSavedGridV5ToGrid(g, keyedInstruments));
			fileName = f.name;
			instrumentVolumes = Object.fromEntries(f.instruments.map((i) => [i.id, i.volume]));
			break;
		}
		default:
			throw new Error(`Unsupported file version: ${saveFileBase.version}`);
	}

	if (regenerateIds) {
		const remapped = remapImportedIds(instruments, grids, instrumentVolumes);
		instruments = remapped.instruments;
		grids = remapped.grids;
		instrumentVolumes = remapped.instrumentVolumes;
	}

	const keyedGrids = new Map(grids.map((g) => [g.id, g]));
	keyedInstruments = new Map(instruments.map((i) => [i.id, i]));

	const grvMkrFile: GrvMkrFile = {
		id: generateFileId(),
		name: fileName,
		grids: keyedGrids,
		instruments: keyedInstruments,
		instrumentVolumes
	};
	return grvMkrFile;
}

function remapImportedIds(
	instruments: InstrumentWithId[],
	grids: Grid[],
	volumes: Record<InstrumentId, number> | undefined
) {
	const instrumentIds = new Map<InstrumentId, InstrumentId>();
	const hitIds = new Map<string, string>();
	const remappedInstruments = instruments.map((instrument) => {
		const newInstrumentId = `instrument_${crypto.randomUUID()}`;
		instrumentIds.set(instrument.id, newInstrumentId);
		const hitTypes = new Map(
			Array.from(instrument.hitTypes.values()).map((hit) => {
				const newHitId = `hit_${crypto.randomUUID()}`;
				hitIds.set(`${instrument.id}:${hit.id}`, newHitId);
				return [newHitId, { ...hit, id: newHitId }];
			})
		);
		return { ...instrument, id: newInstrumentId, hitTypes };
	});
	const instrumentsById = new Map(
		instruments.map((instrument, index) => [instrument.id, remappedInstruments[index]])
	);
	const remappedGrids = grids.map((grid) => ({
		...grid,
		id: generateGridId(),
		config: { ...grid.config },
		rows: grid.rows.map((row) => {
			const instrument = instrumentsById.get(row.instrument.id);
			if (!instrument) throw new Error(`Grid references unknown instrument ${row.instrument.id}`);
			return {
				instrument,
				cells: row.cells.map((cell) => ({
					cells_occupied: cell.cells_occupied,
					hits: cell.hits.map((hit) => ({
						instrumentId: instrumentIds.get(hit.instrumentId) ?? instrument.id,
						hitId: hitIds.get(`${hit.instrumentId}:${hit.hitId}`) ?? hit.hitId
					}))
				}))
			};
		})
	}));
	const remappedVolumes = volumes
		? Object.fromEntries(
				Object.entries(volumes).flatMap(([id, volume]) => {
					const newId = instrumentIds.get(id);
					return newId ? [[newId, volume]] : [];
				})
			)
		: undefined;
	return {
		instruments: remappedInstruments,
		grids: remappedGrids,
		instrumentVolumes: remappedVolumes
	};
}

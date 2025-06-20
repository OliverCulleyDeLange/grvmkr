import {
	AudioDb,
	generateFileId,
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
	if (file.name.endsWith('.grv') || file.name.endsWith('.zip') || file.name.endsWith('.json')) {
		const audioDb = new AudioDb();
		player.stop();

		const isGrvMkrFile = file.name.endsWith('.grv') || file.name.endsWith('.zip');
		const grvMkrFile = isGrvMkrFile
			? await loadFromZip(file, audioDb)
			: await loadFromJsonFile(file);

		await instrumentRepository.replaceInstruments(Array.from(grvMkrFile.instruments.values()));
		await gridRepository.replaceGrids(Array.from(grvMkrFile.grids.values()), true);
		await fileRepository.loadFile(grvMkrFile);
	} else {
		onEvent({ event: ProblemEvent.LoadedNonGrooveFile });
	}
}

async function loadFromZip(file: File, audioDb: AudioDb): Promise<GrvMkrFile> {
	const zip = await JSZip.loadAsync(file);
	const grooveFile = zip.file('groovefile.json');
	if (!grooveFile) throw new Error('Missing groovefile.json');

	const fileText = await grooveFile.async('string');
	const grvMkrFile = parseSaveFile(fileText);

	const audioFiles = zip.folder('audio');
	if (audioFiles) {
		await Promise.all(
			Object.values(audioFiles.files).map(async (entry) => {
				const blob = await entry.async('blob');
				const fileName = entry.name.split('/').pop(); // get just "kick.wav"
				if (fileName) {
					await audioDb.storeAudio(blob, fileName);
				}
			})
		);
	}

	return grvMkrFile;
}

async function loadFromJsonFile(file: File): Promise<GrvMkrFile> {
	const fileText = await file.text();
	const grvMkrFile: GrvMkrFile = parseSaveFile(fileText);
	return grvMkrFile;
}

function parseSaveFile(saveFileText: string): GrvMkrFile {
	const saveFileBase: SaveFile = JSON.parse(saveFileText);

	let instruments: InstrumentWithId[] = [];
	let grids: Grid[] = [];
	let keyedInstruments = new Map<InstrumentId, InstrumentWithId>();
	let fileName = '';

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
			break;
		}
		case 5: {
			const f = saveFileBase as SaveFileV5;
			instruments = mapSavedInstrumentsV4ToInstrumentWithIds(f.instruments);
			keyedInstruments = new Map(instruments.map((i) => [i.id, i]));
			grids = f.grids.map((g) => mapSavedGridV5ToGrid(g, keyedInstruments));
			fileName = f.name;
			break;
		}
		default:
			throw new Error(`Unsupported file version: ${saveFileBase.version}`);
	}

	let keyedGrids = new Map(grids.map((g) => [g.id, g]));

	const grvMkrFile: GrvMkrFile = {
		id: generateFileId(),
		name: fileName,
		grids: keyedGrids,
		instruments: keyedInstruments
	};
	return grvMkrFile;
}

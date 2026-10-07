import {
	defaultFile,
	defaultFileName,
	defaultVolume,
	FileRepository,
	GridRepository,
	keyValueRepository,
	ProblemEvent,
	type FileRepositoryI,
	type Grid,
	type GridId,
	type GrvMkrFile,
	type GrvMkrFileId,
	type InstrumentWithId,
	type OnEvent
} from '$lib';
import { SvelteMap } from 'svelte/reactivity';

// Responsible for storing, and modifying files
export class FileStore implements FileRepositoryI {
	private onEvent: OnEvent;
	private fileRepository: FileRepository = new FileRepository();
	private gridRepository: GridRepository = new GridRepository();
	private fileSaveQueue: Promise<void> = Promise.resolve();

	// Working file
	public file: GrvMkrFile = $state(defaultFile());

	// A list of all locally stored files. Never store a $state wrapped object in here
	public files: Map<GrvMkrFileId, GrvMkrFile> = new SvelteMap<GrvMkrFileId, GrvMkrFile>();

	constructor(onEvent: OnEvent) {
		this.onEvent = onEvent;
	}

	getFile(): GrvMkrFile {
		return this.file;
	}

	// Get or create the working file, and populate the full list of available files
	async initialise(): Promise<GrvMkrFile> {
		const workingFile = await this.initialiseWorkingFile();
		await this.updateAllFiles();
		return workingFile;
	}

	// Get or create the working file in the db and state
	async initialiseWorkingFile(): Promise<GrvMkrFile> {
		try {
			const workingFileFromDb = await this.fileRepository.getWorkingFile();
			if (workingFileFromDb) {
				this.file = workingFileFromDb;
				console.log('Initialised file from DB', workingFileFromDb);
			} else {
				// If no file exists in db, create the working file
				await this.saveWorkingFileInStateAndDB(this.file);
			}
			return this.file;
		} catch (e: unknown) {
			console.error('Error getting file', e);
			this.onEvent({
				event: ProblemEvent.DatabaseError,
				doingWhat: 'initialising file name',
				error: e instanceof Error ? e.message : String(e)
			});
			return Promise.reject(e);
		}
	}

	async saveWorkingFileInStateAndDB(file: GrvMkrFile) {
		this.file = file;
		await this.fileRepository.saveFile(file);
		keyValueRepository.saveWorkingFileId(file.id);
		console.log('Saved working file in state and DB', $state.snapshot(file));
	}

	async loadGroove(fileId: GrvMkrFileId): Promise<GrvMkrFile> {
		const newFile = this.files.get(fileId);
		if (!newFile) {
			console.error(`File with id ${fileId} not found in local files.`);
			return Promise.reject(new Error(`File with id ${fileId} not found`));
		}
		this.file = newFile;
		keyValueRepository.saveWorkingFileId(this.file.id);
		return newFile;
	}

	async deleteGroove(id: GrvMkrFileId): Promise<void> {
		if (id === this.file.id) return;
		// delete grids from the file
		const file = await this.fileRepository.getFile(id);
		const otherFiles = (await this.fileRepository.getAllFiles()).filter(
			(candidate) => candidate.id !== id
		);
		const referencedGridIds = new Set(
			otherFiles.flatMap((candidate) => Array.from(candidate.grids.keys()))
		);
		if (file?.grids) {
			for (const gridId of file.grids.keys()) {
				if (!referencedGridIds.has(gridId)) await this.gridRepository.deleteGrid(gridId);
			}
		}
		await this.fileRepository.deleteFile(id);
		await this.updateAllFiles();
	}

	async setGrids(grids: Map<GridId, Grid>) {
		this.file.grids = grids;
		await this.trySaveFile();
	}

	async setInstruments(instruments: Map<string, InstrumentWithId>) {
		this.file.instruments = instruments;
		await this.trySaveFile();
	}

	setInstrumentVolume(instrumentId: string, volume: number) {
		if (!this.file.instrumentVolumes) {
			this.file.instrumentVolumes = {};
		}
		this.file.instrumentVolumes[instrumentId] = volume;
		void this.trySaveFile();
	}

	getInstrumentVolume(instrumentId: string): number {
		return this.file.instrumentVolumes?.[instrumentId] ?? defaultVolume;
	}

	async saveWorkingFile() {
		const fileCopy: GrvMkrFile = { ...this.file };
		fileCopy.id = `file_${crypto.randomUUID()}`;
		await this.trySaveFile(fileCopy);
		this.files.set(fileCopy.id, $state.snapshot(fileCopy));
	}

	async resetWorkingFile() {
		// Set current working file name to the default
		this.file.name = defaultFileName();
		await this.trySaveFile();
	}

	async loadFile(file: GrvMkrFile) {
		this.file = file;
		await this.trySaveFile();
		keyValueRepository.saveWorkingFileId(this.file.id);
	}

	async trySaveFile(file: GrvMkrFile = this.file) {
		const save = this.fileSaveQueue.then(() => this.fileRepository.saveFile(file));
		this.fileSaveQueue = save.catch(() => undefined);
		try {
			await save;
		} catch (e: unknown) {
			console.error(`Error saving file. Error: [${e}]`, this.file);
			const error = e instanceof Error ? e.message : String(e);
			this.onEvent({
				event: ProblemEvent.DatabaseError,
				doingWhat: 'saving file to database',
				error
			});
		}
	}

	async reset() {
		await this.fileRepository.deleteAllFiles();
	}

	// Populate the internal state of all available files
	// Currently only triggered when we open the groove selector
	async updateAllFiles() {
		const filesArray = await this.fileRepository.getAllFiles();
		this.files.clear();
		for (const file of filesArray) {
			this.files.set(file.id, file);
		}
	}
}

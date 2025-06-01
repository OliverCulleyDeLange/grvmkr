import {
	defaultFile,
	defaultFileName,
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

	// Working file
	public file: GrvMkrFile = $state(defaultFile());

	// A list of all locally stored files. Never store a $state wrapped object in here
	public files: Map<GrvMkrFileId, GrvMkrFile> = new SvelteMap<GrvMkrFileId, GrvMkrFile>();

	constructor(onEvent: OnEvent) {
		this.onEvent = onEvent;
	}

	getFile(): GrvMkrFile {
		return this.file
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
			let workingFileFromDb = await this.fileRepository.getWorkingFile();
			if (workingFileFromDb) {
				this.file = workingFileFromDb;
				console.log('Initialised file from DB', workingFileFromDb);
			} else {
				// If no file exists in db, create the working file
				await this.saveWorkingFileInStateAndDB(this.file);
			}
			return this.file;
		} catch (e: any) {
			console.error('Error getting file', e);
			this.onEvent({
				event: ProblemEvent.DatabaseError,
				doingWhat: 'initialising file name',
				error: e.target.error
			});
			return Promise.reject(e);
		}
	}

	async saveWorkingFileInStateAndDB(file: GrvMkrFile) {
		this.file = file
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
		// delete grids from the file
		const file = await this.fileRepository.getFile(id);
		if (file?.grids) {
			for (const [id, grid] of file.grids) {
				this.gridRepository.deleteGrid(id);
			}
		}
		this.fileRepository.deleteFile(id);
		this.updateAllFiles();
	}

	async setGrids(grids: Map<GridId, Grid>) {
		this.file.grids = grids;
		this.trySaveFile();
	}
	
	async setInstruments(instruments: Map<string, InstrumentWithId>) {
		this.file.instruments = instruments;
		this.trySaveFile();
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

	async loadFile(
		file: GrvMkrFile,
	) {
		this.file = file
		await this.trySaveFile();
		keyValueRepository.saveWorkingFileId(this.file.id);
	}

	async trySaveFile(file: GrvMkrFile = this.file) {
		try {
			await this.fileRepository.saveFile(file);
		} catch (e: any) {
			console.error(`Error saving file. Error: [${e}]`, this.file);
			const error = e?.target?.error ?? e;
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

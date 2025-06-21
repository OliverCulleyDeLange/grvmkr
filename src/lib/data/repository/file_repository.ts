import {
	type FileDto,
	FileTable,
	type Grid,
	type GridId,
	GridRepository,
	type GrvMkrFile,
	type GrvMkrFileId,
	type InstrumentId,
	InstrumentRepository,
	InstrumentStore,
	type InstrumentWithId,
	keyValueRepository,
	mapFileDtoToFile,
	mapToDto
} from '$lib';

export class FileRepository {
	private fileTable: FileTable = new FileTable();
	private gridRepository: GridRepository = new GridRepository();
	private instrumentRepository: InstrumentRepository = new InstrumentRepository();

	async saveFile(file: GrvMkrFile): Promise<void> {
		const fileDto = mapToDto(file);
		await this.fileTable.saveFile(fileDto);
		console.log('Saved File to DB', fileDto);
	}

	async getWorkingFile(): Promise<GrvMkrFile | null> {
		const workingFileId: GrvMkrFileId | null = keyValueRepository.getWorkingFileId();
		if (!workingFileId) {
			return null;
		}
		const fileDto = await this.fileTable.getFile(workingFileId);
		if (!fileDto) return null;

		return await this.fileDtoToGrvMkrFile(fileDto);
	}

	async getFile(id: GrvMkrFileId): Promise<GrvMkrFile | undefined> {
		const fileDto = await this.fileTable.getFile(id);
		if (!fileDto) return undefined;

		return await this.fileDtoToGrvMkrFile(fileDto);
	}

	async deleteFile(id: GrvMkrFileId): Promise<void> {
		await this.fileTable.deleteFile(id);
		console.log('Deleted File from DB', id);
	}

	async deleteAllFiles(): Promise<void> {
		await this.fileTable.deleteAllFiles();
	}

	async getAllFiles(): Promise<GrvMkrFile[]> {
		const fileDtos = await this.fileTable.getAllFiles();
		const files: GrvMkrFile[] = [];

		for (const fileDto of fileDtos) {
			const file = await this.fileDtoToGrvMkrFile(fileDto);
			files.push(file);
		}

		return files;
	}

	private async fileDtoToGrvMkrFile(fileDto: FileDto) {
		const grids = new Map<GridId, Grid>();
		for (const gridId of fileDto.grids) {
			const grid = await this.gridRepository.getGrid(gridId);
			if (grid) grids.set(grid.id, grid);
		}

		const instruments = new Map<InstrumentId, InstrumentWithId>();
		// FIXME fileDto.instruments is not iterable 
		for (const instrumentId of fileDto.instruments) {
			const instrument = await this.instrumentRepository.getInstrument(instrumentId);
			if (instrument) instruments.set(instrument.id, instrument);
		}

		return mapFileDtoToFile(fileDto, grids, instruments);
	}
}

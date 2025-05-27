import type { AppErrorUi } from './AppErrorUi';

// Toolbar UI
export type ToolbarUi = {
	darkMode: boolean;
	errors: AppErrorUi[];
	fileName: string;
};

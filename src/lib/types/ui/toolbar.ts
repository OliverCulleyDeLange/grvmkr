// Toolbar UI Events
export type ToolbarEvents = Save | Load | Reset | FileNameChanged

export enum ToolbarEvent {
    Save = "Save",
    Load = "Load",
    Reset = "Reset",
    FileNameChanged = "FileNameChanged",
}

export type Reset = {
    event: ToolbarEvent.Reset
}
export type Save = {
    event: ToolbarEvent.Save
}
export type Load = {
    event: ToolbarEvent.Load
    file: File
}
export type FileNameChanged = {
    event: ToolbarEvent.FileNameChanged
    fileName: string
}

// Toolbar UI components
export type ToolbarUi = {
    errors: AppErrorUi[],
    fileName: string
}

export type AppErrorUi = {
    message: string
}
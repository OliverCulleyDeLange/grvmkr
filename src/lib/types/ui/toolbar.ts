// Grid UI Events
export type ToolbarEvents = Save | Load

export enum ToolbarEvent {
    Save = "Save",
    Load = "Load"
}

export type Save = {
    event: ToolbarEvent.Save
}
export type Load = {
    event: ToolbarEvent.Load
    file: File
}
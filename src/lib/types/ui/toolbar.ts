// Grid UI Events
export type ToolbarEvents = Save | Load | Reset

export enum ToolbarEvent {
    Save = "Save",
    Load = "Load",
    Reset = "Reset"
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
# QA

A list of stuff the app should do. I'd love to say i'll write automated tests for these, but i probably won't.

# Grid Editing

- Changes to the groove are immediately visible and audible
- BPM changes are immediately visible and audible
- Grid size changes are immediatley visible and audible
- Removing a grid
- Selecting a cell opens cell toolbar for that grid only

# Playback

- Play buttons start playing groove
-

# Instruments

- Creating a new instrument
  - Adds new instrument ui with no audio sample
  - Adds row to all grids
  - Saves instrument to db
  - Saves all grids to db
- Removing an instrument
  - Deletes instrument UI
  - Deletes row from all grids
  - Deletes instrument in db
  - Saves all grids to db
- Adding hit to instrument
  - Shows new default hit UI with no audio sample
  - Updates cell tools with new hit types (instrument cell must be selected)
  - Allows selecting new hit by clicking grid cells (not via cell tools)
- Removing hit from instrument
- Change hit sample

# Load and Save

- Load legacy file structures (v1, v2)
- Load current file (v3)
- Save current file (v3)
-

# Local persistence

- Page refreshes shouldn't lose any work
  - Grids, instruments, and file name
- Reset button resets app fully

# Printing

- 'Print / Save PDF button' works
- Grids should looks sensible when printing / saving as PDF via print

# Help

- '?' button opens info panel

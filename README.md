# GrvMkr
[Groove Maker](https://oliverdelange.co.uk/grvmkr/) is a percussion grid notation tool and modern replacement for the now obsolete [Mango Drum](http://mangodrum.com/) which only runs on Windows.

## Features
- ✅ Installable (as a pwa) on desktop (windows and mac) and mobile (ios and android)
- ✅ Live editing
  - Modify the grid and hear the results immediately, even when playing.
  - Multi select grid cells in a row (shift click or drag) + copy (ctrl/cmd + C) and paste (ctrl/cmd + V)
- ✅ Choose the BPM for your composition (obviously)
- ✅ Create your own instruments
  - Upload your own audio samples and create multiple 'hits' (sounds) per instrument
- ✅ Built in instruments
  - There are currently some standard built ins for making beats / samba grooves
- ✅ Save your composition grids as a json file, which can be re-loaded at a later date. 
- ✅ Save your composition grids as a PDF file for sharing with others
  -  Technically possible by 'Printing to PDF'. I've made sure the grids aren't split between pages. 
- ✅ Saving progress automatically so you don't lose everything if you refresh the page
- ✅ Mute / Solo and instrument volume controls
- ✅ Dark mode theme

### Coming soon (maybe)
- Save/open grids locally
- Configurable instruments per grid / groove
- Undo / Redo? In case you delete something you didn't mean to 
- Record and trim sample into instrument

### Unimplemented
Some features from MangoDrum are still missing, i may or may not add them depending on whether anyone actually uses this tool and would find them useful. 

- ❓ Create a 'Playlist' which brings all the sections of your composition together
  -  Er, kinda - You can create multiple grids, and play them seperately, but you can't create a playlist per se. If this is a useful feature, let me know, but the main purpose of this tool isn't to create songs, its to create grid notation.
- ❌ ~~Metronome~~: Didn't seem that useful. Just create an instrument with a beep sound file and fill in some squares?
  
## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

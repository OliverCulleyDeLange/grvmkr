# GrvMkr
[Groove Maker](https://oliverdelange.co.uk/grvmkr/) is a percussion grid notation tool and modern replacement for the now obsolete [Mango Drum](http://mangodrum.com/) which only runs on Windows.

## Features
- ✅ Live editing
  - Modify the grid and hear the results immediately, even when playing.
- ✅ Choose the BPM for your composition (obviously)
- ✅ Create your own instruments
  - Upload your own audio samples and create multiple 'hits' (sounds) per instrument
- ✅ Built in instruments
  - There are currently 3 built ins - HiHat (open&closed), snare and kick. I may or may not add more. Probably not. 
- ✅ Save your composition grids as a json file, which can be re-loaded at a later date. 
- ✅ Save your composition grids as a PDF file for sharing with others
  -  Technically possible by 'Printing to PDF'. I've made sure the grids aren't split between pages. 
- ✅ Saving progress automatically so you don't lose everything if you refresh the page

### Coming soon (maybe)
- Triplets
  - Visually, join two cells in the grid, and put 3 markers in there
    - How to set different markers?
    - How to set two cells as joined?
    - How to deal with the uneven timing. Can't use static ms between beat divisions anymore.
      - Probably need to calculate a msDelta between the phrase start time, and all the required notes ahead of time, and use setTimeout instead of setInterval to play the sounds
- File & Grid labels
- Delineate bars more visually
- Grid text color
- 1e&a in top bar
- Sample packs - Samba, Classics kits

### Unimplemented
Some features from MangoDrum are still missing, i may or may not add them depending on whether anyone actually uses this tool and would find them useful. 

- ❓ Create a 'Playlist' which brings all the sections of your composition together
  -  Er, kinda - You can create multiple grids, and play them seperately, but you can't create a playlist per se. If this is a useful feature, let me know, but the main purpose of this tool isn't to create songs, its to create grid notation.
- ❌ ~~Change the volume and balance of each instrument~~: This didn't seem that important to me.
- ❌ ~~Metronome~~: As above, didn't seem that useful. Just create an instrument with a beep sound file and fill in some squares?
- ❌ ~~Undo and Redo~~: Seems unnecessary for such a simple app.
  
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

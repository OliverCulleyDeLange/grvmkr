# GrvMkr

[Groove Maker](https://oliverdelange.co.uk/grvmkr/) is a percussion grid notation tool and modern replacement for the now obsolete [Mango Drum](http://mangodrum.com/) which only runs on Windows.

## Features

- ✅ Live editing and playback
  - Modify the grid and hear the results immediately, even when playing.
  - Multi select grid cells in a row. On desktop, shift click or click and drag cursor. On mobile press and drag cells.
  - Merge cells + uneven hits like triplets
  - Play the entire file like a song arrangement
  - Or play an individual grid, looped forever to fine tune tre groove
- ✅ Keyboard shortcuts:
  - Copy (ctrl/cmd + C) & Paste (ctrl/cmd + V). Also available in the grid toolbar for mobile users.
  - Space to play / pause
- ✅ Choose the BPM for your composition (obviously)
- ✅ Create your own instruments
  - Upload your own audio samples and create multiple 'hits' (sounds) per instrument
- ✅ Built in instruments
  - There are currently some standard built ins for making  samba grooves
- ✅ Save and load grids in the app (saved to your browsers internal database)
- ✅ Save your composition grids as a file, which can be re-loaded on other computers. Useful for sharing with band members!
- ✅ Save or print your composition grids as a PDF file for sharing with others
  - Technically possible by 'Printing to PDF'. I've made sure the grids aren't split between pages.
- ✅ Saving progress automatically so you don't lose everything if you refresh the page
- ✅ Mute / Solo and instrument volume controls
- ✅ Dark mode theme
- ✅ Installable (as a pwa) on desktop (windows and mac) and mobile (ios and android)


### Coming soon (maybe)
- Example groove (samba)
- Premade grooves for classic rhythms for community samba bands
- Groove repetitions for playback
- Configurable instruments per grid / groove
- Undo / Redo? In case you delete something you didn't mean to
- Record and trim sample into instrument

### Unimplemented

Some features from MangoDrum are still missing, i may or may not add them depending on whether anyone actually uses this tool and would find them useful.

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

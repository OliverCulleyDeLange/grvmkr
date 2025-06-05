# GrvMkr

[Groove Maker](https://oliverdelange.co.uk/grvmkr/) is a percussion grid notation tool and modern replacement for the now obsolete [Mango Drum](http://mangodrum.com/) which only runs on Windows.

## Features

- ✅ Live editing and playback
  - Modify the grid and hear the results immediately, even when playing.
  - Multi select grid cells in a row. On desktop, shift click or click and drag cursor. On mobile press and drag cells.
  - Merge cells + uneven hits like triplets
  - Play the entire file like a song arrangement
  - Or play an individual grid, looped forever to fine tune your groove
- ✅ Grid Tools
  - Choose the BPM, number of bars, and grid size for each grid individually.
  - Duplicate any grid
  - Move grids up or down in the file
  - Choose how many repetitions of a grid to play when 'play file' is used (individual grids still loop infinitley when 'play grid' selected)
- ✅ Keyboard shortcuts:
  - Copy (ctrl/cmd + C) & Paste (ctrl/cmd + V). Also available in the grid toolbar for mobile users.
  - Space to play / pause
- ✅ Create your own instruments
  - Upload your own audio samples and create multiple 'hits' (sounds) per instrument
- ✅ Built in instruments
  - There are currently some standard built ins for making samba grooves
- ✅ Save and load grids in the app (saved to your browsers internal database)
- ✅ Save your composition grids as a file, which can be re-loaded on other computers. Useful for sharing with band members!
- ✅ Save or print your composition grids as a PDF file for sharing with others
  - Technically possible by 'Printing to PDF'. I've made sure the grids aren't split between pages.
- ✅ Saving progress automatically so you don't lose everything if you refresh the page
- ✅ Mute / Solo and instrument volume controls
- ✅ Dark mode theme
- ✅ Installable (as a pwa) on desktop (windows and mac) and mobile (ios and android)

### Coming soon (maybe)

- Right click / hold press to delete
- Premade grooves for classic rhythms for community samba bands
- Configurable instruments per grid / groove
- Undo / Redo? In case you delete something you didn't mean to
- Record and trim sample into instrument

# Analytics

I'm using goatcounter to provide simple analytics on who's using the tool.
[grvmkr.goatcounter.com](https://grvmkr.goatcounter.com/)

Its fully anonymous and doesn't collect any personal information. I've also made it public so anyone can see the data i'm collecting.

# Error reporting

I'm using sentry to collect errors [https://ocd-4h.sentry.io/](ocd-4h.sentry.io)

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

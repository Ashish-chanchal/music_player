# VibePulse

A music player built with React + Vite. It plays your local library and streams free music from the open [Audius](https://audius.co) catalogue — no account or API key needed.

## Run it

```bash
npm install
npm run dev      # development server
npm run build    # production build in dist/
npm run preview  # serve the production build
```

## Your music

- Put audio files in `public/music/` and list them in `public/songsdata.json`.
- Album art and album names are read from the MP3 tags and stored in `public/covers/` (`meta.json` + images).
- Keyboard shortcuts: `Space` play/pause, `←`/`→` seek 5s, `Shift`+`←`/`→` previous/next, `M` mute, `/` search.

## Open catalogue

Browse and search stream from Audius by default. To use Creative Commons music from Jamendo instead, add a free client id (https://devportal.jamendo.com) to `src/config.js`.

## Deployment

The GitHub workflows deploy to Azure Static Web Apps; the build output directory is `dist`.

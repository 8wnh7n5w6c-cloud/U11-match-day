# Pitch Pal

Pitch Pal is a Vue 3 + Ionic mobile app packaged for iOS and Android with Capacitor. The interface uses Ionic components with a custom Pitch Pal visual theme.

## Requirements

- Node.js 20.19 or newer
- Xcode for iOS builds (the project uses Swift Package Manager)
- Android Studio, a JDK, and the Android SDK for Android builds

## Develop

Use the Node version pinned in `.nvmrc` (Node 20.20.2):

```sh
nvm install
nvm use
npm install
npm run dev
```

## Build and sync native projects

```sh
npm run build
npm run cap:sync
npm run ios
npm run android
```

The Android Studio project is in `android/`; the Xcode project is in `ios/App/App.xcodeproj`. Local match and season data continue to use the existing `u11v5` and `playerNames` local-storage keys.

## Publish on GitHub Pages

The `Deploy GitHub Pages` workflow builds the project with the repository URL prefix and deploys it whenever changes reach `main`. In the repository settings, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. The normal local build and development server continue to use the root path.

## Code layout

- `src/components/` — focused screens and navigation
- `src/composables/usePitchPal.js` — match, squad, timer, and persistence state
- `src/domain/fairness.js` — pure fairness and season-balance calculations
- `src/theme.css` — Ionic theme and responsive styling

Vue single-file components use the Options API, with each template above its script. VS Code recommends Vue Official and ESLint. Run `npm run lint` to check JavaScript and Vue components.

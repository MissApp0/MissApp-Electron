# MissApp Electron

Desktop client and release/update system for MissApp.

## Repositories

- **Web app:** `MissApp0/MissApp0.github.io`
- **Desktop app:** `MissApp0/MissApp-Electron`

The desktop client currently uses the production MissApp web application at:

`https://missapp0.github.io`

This keeps the Firebase/Firestore application logic shared while this repository owns Electron packaging, desktop security, and automatic updates.

## Run locally

```bash
npm install
npm start
```

## Build

```bash
npm run dist:win
npm run dist:linux
npm run dist:mac
```

Installers are written to `dist/`.

## Automatic updates

MissApp uses `electron-updater` and GitHub Releases.

Release flow:

1. Change the version in `package.json`, for example `1.0.1`.
2. Commit and push the change.
3. Create and push a matching tag such as `v1.0.1`.
4. GitHub Actions builds the Windows installer.
5. The workflow publishes the installer to the GitHub Release.
6. Installed MissApp clients check for updates.
7. Updates download in the background.
8. MissApp asks the user to restart and install the update.

The updater uses GitHub's Actions token during CI. No long-lived GitHub token is stored in the repository.

## Security

The Electron window uses:

- `contextIsolation: true`
- `nodeIntegration: false`
- sandboxed preload
- restricted external navigation
- external links opened in the system browser
- updater logic kept outside the web renderer

## Future desktop features

The repository is ready to grow with:

- system tray
- native notifications
- start with Windows
- offline caching
- native call controls
- Windows code signing
- macOS signing/notarization
- dedicated desktop settings

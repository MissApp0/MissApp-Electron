# MissApp Desktop

MissApp Desktop is a lightweight Windows client that opens the live MissApp website inside Electron.

## What users need

Users do **not** need Node.js, npm, Git, or a developer environment.

The Windows installer contains the Electron runtime and the MissApp desktop files.

## Login

The desktop client uses a persistent Chromium session for MissApp. Firebase authentication state, cookies, and local storage are kept between launches, so users normally sign in once and remain signed in.

## Downloads

Each tagged release publishes:

- **MissApp-<version>-Setup.exe** — normal Windows installer.
- **MissApp-<version>-Portable.zip** — portable application folder. Extract it and run **MissApp.exe**.

## Release build

The GitHub Actions release workflow intentionally does **not** use npm or electron-builder. It downloads the matching Electron Windows runtime directly, packages the application files, and creates the installer with NSIS.

Create and push a version tag such as `v1.0.4` to start a release build.

## Architecture

- Live MissApp site: `https://missapp0.github.io/`
- Persistent Electron WebView session: `persist:missapp`
- Secure preload with context isolation.
- Node integration disabled.
- Sandboxed renderer.
- Separate native call window.
- Native Windows notifications.

## Security

The main window only permits MissApp's own web origin inside Electron. External links are opened in the normal browser.

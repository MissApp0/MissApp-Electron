# MissApp Electron

## MissApp GitHub Cloner — Windows EXE

This repository builds a standalone Windows EXE. End users do not need Node.js, npm, or npm install to run the finished application.

## Download and run

1. Open the repository's Releases page.
2. Download either the Portable EXE (runs directly) or the Windows installer EXE.
3. Launch the EXE.

The EXE contains the Electron runtime and application files.

Note: the cloner currently uses the Windows git command to perform repository clones. Git must be installed on the computer for cloning to work.

## Maintainers

Node.js/npm are only used by GitHub Actions to build the EXE. End users do not need them.

Push a version tag such as v1.0.1 to build and publish the Windows EXEs automatically. You can also run the workflow manually; that uploads the EXEs as a GitHub Actions artifact.

## Automatic updates

Installed builds use electron-updater and GitHub Releases. No long-lived GitHub token is stored in the repository.

## Security

- contextIsolation enabled
- nodeIntegration disabled
- sandboxed preload
- restricted filesystem access
- MissApp0-only repository validation

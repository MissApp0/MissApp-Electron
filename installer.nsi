!define APP_NAME "MissApp"
!define APP_EXE "MissApp.exe"
!define INSTALL_DIR "$PROGRAMFILES64\\MissApp"

Name "${APP_NAME}"
OutFile "dist\\MissApp-SETUP.exe"
InstallDir "${INSTALL_DIR}"
RequestExecutionLevel user
Unicode True
SetCompressor /SOLID lzma

Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "build\\MissApp\\*"

  CreateDirectory "$SMPROGRAMS\\MissApp"
  CreateShortcut "$SMPROGRAMS\\MissApp\\MissApp.lnk" "$INSTDIR\\${APP_EXE}"
  CreateShortcut "$DESKTOP\\MissApp.lnk" "$INSTDIR\\${APP_EXE}"

  WriteUninstaller "$INSTDIR\\Uninstall MissApp.exe"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MissApp" "DisplayName" "${APP_NAME}"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MissApp" "UninstallString" "$INSTDIR\\Uninstall MissApp.exe"
  WriteRegStr HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MissApp" "DisplayVersion" "$%MISSAPP_VERSION%"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\\MissApp.lnk"
  Delete "$SMPROGRAMS\\MissApp\\MissApp.lnk"
  RMDir "$SMPROGRAMS\\MissApp"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MissApp"
SectionEnd

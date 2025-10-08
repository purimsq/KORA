; KORA Medical Knowledge App - NSIS Installer Script
; This script creates a Windows installer for the KORA Electron application

;--------------------------------
; Include Modern UI

  !include "MUI2.nsh"

;--------------------------------
; General

  ; Name and file
  Name "KORA Medical Knowledge"
  OutFile "KORA-Setup.exe"
  Unicode True

  ; Default installation folder
  InstallDir "$PROGRAMFILES64\KORA"
  
  ; Get installation folder from registry if available
  InstallDirRegKey HKCU "Software\KORA" ""

  ; Request application privileges for Windows Vista and later
  RequestExecutionLevel admin

;--------------------------------
; Variables

  Var StartMenuFolder

;--------------------------------
; Interface Settings

  !define MUI_ABORTWARNING
  !define MUI_ICON "electron\resources\icon.ico"
  !define MUI_UNICON "electron\resources\icon.ico"

;--------------------------------
; Pages

  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_LICENSE "LICENSE"
  !insertmacro MUI_PAGE_DIRECTORY
  
  ; Start Menu Folder Page Configuration
  !define MUI_STARTMENUPAGE_REGISTRY_ROOT "HKCU" 
  !define MUI_STARTMENUPAGE_REGISTRY_KEY "Software\KORA" 
  !define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "Start Menu Folder"
  
  !insertmacro MUI_PAGE_STARTMENU Application $StartMenuFolder
  
  !insertmacro MUI_PAGE_INSTFILES
  !insertmacro MUI_PAGE_FINISH
  
  !insertmacro MUI_UNPAGE_WELCOME
  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES
  !insertmacro MUI_UNPAGE_FINISH

;--------------------------------
; Languages
 
  !insertmacro MUI_LANGUAGE "English"

;--------------------------------
; Installer Sections

Section "Install KORA" SecInstall

  SetOutPath "$INSTDIR"
  
  ; Copy all application files
  File /r "dist-electron\win-unpacked\*.*"
  
  ; Store installation folder
  WriteRegStr HKCU "Software\KORA" "" $INSTDIR
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Add to Add/Remove Programs
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KORA" \
                   "DisplayName" "KORA Medical Knowledge"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KORA" \
                   "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KORA" \
                   "DisplayIcon" "$\"$INSTDIR\KORA.exe$\""
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KORA" \
                   "Publisher" "KORA Medical"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KORA" \
                   "DisplayVersion" "1.0.0"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KORA" \
                   "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KORA" \
                   "NoRepair" 1
  
  ; Create Start Menu shortcuts
  !insertmacro MUI_STARTMENU_WRITE_BEGIN Application
    CreateDirectory "$SMPROGRAMS\$StartMenuFolder"
    CreateShortcut "$SMPROGRAMS\$StartMenuFolder\KORA.lnk" "$INSTDIR\KORA.exe"
    CreateShortcut "$SMPROGRAMS\$StartMenuFolder\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  !insertmacro MUI_STARTMENU_WRITE_END
  
  ; Create Desktop shortcut
  CreateShortcut "$DESKTOP\KORA.lnk" "$INSTDIR\KORA.exe"

SectionEnd

;--------------------------------
; Uninstaller Section

Section "Uninstall"

  ; Remove files and directories
  RMDir /r "$INSTDIR"
  
  ; Remove Start Menu shortcuts
  !insertmacro MUI_STARTMENU_GETFOLDER Application $StartMenuFolder
  Delete "$SMPROGRAMS\$StartMenuFolder\KORA.lnk"
  Delete "$SMPROGRAMS\$StartMenuFolder\Uninstall.lnk"
  RMDir "$SMPROGRAMS\$StartMenuFolder"
  
  ; Remove Desktop shortcut
  Delete "$DESKTOP\KORA.lnk"
  
  ; Remove registry keys
  DeleteRegKey HKCU "Software\KORA"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\KORA"

SectionEnd

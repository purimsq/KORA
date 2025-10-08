# KORA Electron Setup Guide

This guide explains how to set up and deploy the KORA Medical Knowledge application as an Electron desktop app.

## Prerequisites

Before building the Electron app, you need to install the following dependencies:

```bash
npm install --save-dev electron electron-builder
npm install --save electron-is-dev
```

## Development

To run the app in development mode with Electron:

1. Start the development server (this is already set up):
   ```bash
   npm run dev
   ```

2. In a separate terminal, start Electron:
   ```bash
   npx electron electron/main.js
   ```

## Building for Production

### 1. Build the Web App

First, build the web application:

```bash
npm run build
```

### 2. Build Electron App

Build the Electron app for your platform:

**For Windows:**
```bash
npx electron-builder --win
```

**For macOS:**
```bash
npx electron-builder --mac
```

**For Linux:**
```bash
npx electron-builder --linux
```

**For all platforms:**
```bash
npx electron-builder -mwl
```

## Using NSIS Installer (Windows Only)

The project includes an NSIS installer script (`installer.nsi`) for advanced Windows deployment scenarios.

### Prerequisites for NSIS

1. Install NSIS (Nullsoft Scriptable Install System):
   - Download from: https://nsis.sourceforge.io/Download
   - Or use Chocolatey: `choco install nsis`

2. Build the Electron app first:
   ```bash
   npm run build
   npx electron-builder --win --dir
   ```

3. Compile the NSIS installer:
   ```bash
   makensis installer.nsi
   ```

This will create `KORA-Setup.exe` in the current directory.

### NSIS Installer Features

The NSIS installer provides:
- Custom installation directory selection
- Start Menu shortcuts
- Desktop shortcut
- Uninstaller
- Registry entries for Add/Remove Programs
- Support for both 32-bit and 64-bit Windows

## Electron Builder Configuration

The `electron-builder.json` file configures the build process:

- **Windows**: Creates NSIS installer and portable executable
- **macOS**: Creates DMG and ZIP packages  
- **Linux**: Creates AppImage and DEB packages

## Package.json Scripts

Add these scripts to your `package.json` for easier building:

```json
{
  "scripts": {
    "electron:dev": "electron electron/main.js",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  }
}
```

## File Structure

```
KORA/
├── electron/
│   ├── main.js           # Electron main process
│   ├── preload.js        # Preload script for security
│   └── resources/        # Icons and resources
│       ├── icon.ico      # Windows icon
│       ├── icon.icns     # macOS icon
│       └── icon.png      # Linux icon
├── installer.nsi         # NSIS installer script
├── electron-builder.json # Electron Builder configuration
└── dist/                 # Built web app (created by npm run build)
```

## Distribution

After building, your installers will be in the `dist-electron` directory:

**Windows:**
- `KORA Medical Knowledge-Setup-{version}.exe` (NSIS installer)
- `KORA Medical Knowledge-{version}-portable.exe` (Portable version)

**macOS:**
- `KORA Medical Knowledge-{version}-mac.dmg`
- `KORA Medical Knowledge-{version}-mac.zip`

**Linux:**
- `KORA Medical Knowledge-{version}-linux.AppImage`
- `KORA Medical Knowledge-{version}-linux.deb`

## Notes

- The app is configured to work both as a web app and Electron desktop app
- Icons need to be created and placed in `electron/resources/` before building
- The Electron app will use the production build from the `dist` folder
- All user data is stored in the Electron app's userData directory
- The app supports offline functionality through downloaded articles

## Troubleshooting

1. **Build fails**: Make sure you've run `npm run build` first
2. **Icons missing**: Create icons in the required formats and place them in `electron/resources/`
3. **NSIS errors**: Ensure NSIS is installed and in your PATH
4. **Port conflicts**: The dev server must run on port 5000 for Electron to connect

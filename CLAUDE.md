# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Open Chat" - an Electron-based chat application in early development stage. Currently implemented as a basic Electron app with a landing page showcasing planned features like secure messaging, real-time communication, and cross-platform support.

## Architecture

### Core Structure
- **main.js**: Electron main process entry point - creates the main window and manages app lifecycle
- **index.html**: Frontend landing page with feature showcase and modern UI design
- **package.json**: Node.js project configuration with Electron as the primary dependency

### Technology Stack
- **Electron 37.2.4**: Desktop app framework
- **pnpm**: Package manager (configured with workspace support)
- **HTML/CSS/JavaScript**: Frontend implementation with modern styling including dark mode support

## Development Commands

### Running the Application
```bash
pnpm start
# or
npm run start
```
This starts the Electron application using `electron .`

### Package Management
```bash
pnpm install    # Install dependencies
pnpm rebuild electron    # Run if Electron fails to start (enables install scripts)
```

### Project Structure
```
├── main.js           # Electron main process
├── index.html        # Application UI (currently landing page)
├── package.json      # Project configuration
├── pnpm-lock.yaml    # Dependency lock file
└── pnpm-workspace.yaml # Workspace configuration
```

## Development Notes

### Current State
- Basic Electron shell with landing page
- No actual chat functionality implemented yet
- UI includes placeholder features for planned functionality
- Responsive design with dark/light mode support

### Architecture Considerations
- Main process (main.js) is minimal - only creates window and loads HTML
- All UI is currently in a single HTML file with embedded CSS
- No renderer process JavaScript or IPC communication implemented
- Security headers are basic (CSP configured in HTML)

### Expansion Areas
When developing this further:
- Add renderer process scripts for chat functionality
- Implement IPC communication between main and renderer processes
- Add backend services for actual messaging
- Consider security implications for real chat implementation
- Split CSS and JavaScript into separate files as the app grows
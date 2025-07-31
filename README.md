# Open Chat

A minimal, modern Electron-based chat application that supports multiple LLM providers.

## Running the Application

### Development Mode (Recommended)
```bash
pnpm dev
```
This starts both esbuild (for React) and Electron in development mode with hot reload.

### Production Mode
```bash
pnpm run start
```
This builds the React app first, then starts Electron with the built files.

### Quick Start (if already built)
```bash
pnpm start:quick
```
This starts Electron without rebuilding (assumes you already ran `pnpm build`).

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build the React app for production
- `pnpm build:app` - Build the React app and package it with Electron Builder
- `pnpm start` - Build and run the production app
- `pnpm start:quick` - Run the production app without rebuilding

## Troubleshooting

If you encounter Electron installation issues:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```
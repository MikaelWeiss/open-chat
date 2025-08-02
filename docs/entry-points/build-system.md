# Build System Entry Point

## Overview
Custom esbuild-based build system for React frontend compilation and asset management.

## Entry Point Details
- **Binary**: `node build.js`
- **Main file**: `build.js`
- **Output**: `dist/` directory
- **Technology**: esbuild, PostCSS, Tailwind CSS

## Build Commands
```bash
# Development build with watch mode
pnpm dev:build
# Equivalent to: node build.js --watch

# Production build
pnpm build
# Equivalent to: node build.js

# Combined development mode
pnpm dev
# Runs build with watch + electron
```

## Build Configuration

### esbuild Settings
- **Entry Points**: 
  - `src/main.tsx` → `dist/index.html`
  - `src/quick-chat.tsx` → `dist/quick-chat.html`
- **Format**: ESM (ES modules)
- **Target**: ES2020
- **Bundle**: True
- **Minify**: True (production)
- **Source Maps**: True (development)

### CSS Processing
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS post-processing with autoprefixer
- **Config**: `tailwind.config.mjs`, `postcss.config.js`

### TypeScript Configuration
- **Config**: `tsconfig.json` (app), `tsconfig.node.json` (build tools)
- **Strict Mode**: Enabled
- **Module Resolution**: Node16

## Watch Mode
```bash
# Automatic rebuild on file changes
node build.js --watch
```

### Watched Directories
- `src/` - All TypeScript/React source files
- `src/index.css` - Main CSS entry point

## Output Structure
```
dist/
├── index.html          # Main app HTML
├── quick-chat.html     # Quick chat HTML
└── assets/
    ├── index-[hash].js     # Main app JavaScript bundle
    ├── index-[hash].css    # Main app CSS bundle
    ├── quick-chat-[hash].js # Quick chat JavaScript bundle
    └── quick-chat-[hash].css # Quick chat CSS bundle
```

## Build Process Steps
1. **Clean**: Remove previous build artifacts
2. **CSS Processing**: Compile Tailwind CSS with PostCSS
3. **TypeScript Compilation**: Transform TS/TSX to JavaScript
4. **Bundling**: Combine modules with esbuild
5. **Asset Hashing**: Generate content-based hashes for caching
6. **HTML Generation**: Create HTML files with proper asset references

## Environment Variables
| Variable | Purpose | Default | Build Impact |
|----------|---------|---------|--------------|
| `NODE_ENV` | Build mode | `production` | Minification, source maps |

## Dependencies
- **esbuild**: Fast JavaScript bundler
- **postcss**: CSS post-processor
- **tailwindcss**: CSS framework
- **autoprefixer**: CSS vendor prefix automation
- **typescript**: TypeScript compiler

## Performance
- **Cold Build**: ~500ms for full build
- **Incremental**: ~50ms for single file changes
- **Bundle Size**: ~300KB (gzipped)

## Troubleshooting

### Build Failures
```bash
# Clear node_modules and rebuild
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear build cache
rm -rf dist/
pnpm build
```

### TypeScript Errors
```bash
# Check TypeScript compilation
npx tsc --noEmit
```

### CSS Issues
```bash
# Rebuild Tailwind CSS
npx tailwindcss -i src/index.css -o dist/assets/index.css
```

### Watch Mode Issues
- File system limits on Linux: Increase `fs.inotify.max_user_watches`
- Windows path issues: Use forward slashes in patterns

---
*Last updated from source at commit [latest] – edit this file: docs/entry-points/build-system.md*
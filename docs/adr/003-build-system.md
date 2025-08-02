# ADR-003: Custom esbuild Build System

**Status**: Accepted  
**Date**: 2024-01-22  
**Deciders**: Build Team  

## Context

We needed a build system for the React frontend that would provide:
- Fast development builds with hot reloading
- Optimized production builds for Electron packaging
- TypeScript compilation with strict type checking
- CSS processing with Tailwind CSS
- Multiple entry points (main app + quick chat)
- Integration with Electron's file structure requirements

## Decision

We chose to implement a **custom esbuild-based build system** rather than using existing frameworks.

## Rationale

### Considered Options

1. **Custom esbuild** (Our choice)
2. **Vite** (Modern build tool)
3. **Create React App** (Zero-config React setup)
4. **Webpack + custom config** (Traditional bundler)
5. **Parcel** (Zero-config bundler)

### Why Custom esbuild Won

**Pros:**
- **Speed**: esbuild is 10-100x faster than other bundlers
- **Control**: Full control over build process for Electron-specific needs
- **Simplicity**: Minimal configuration, single build.js file
- **Multiple Outputs**: Easy to generate both main app and quick chat bundles
- **Electron Integration**: Direct control over HTML generation and asset paths

**Performance Comparison:**
```bash
# Cold build times (approximate)
esbuild:    500ms
Vite:       2s
Webpack:    8s
Parcel:     4s
```

**Custom Build Script Benefits:**
- Generates appropriate HTML files for Electron
- Handles asset hashing for cache busting
- Integrates PostCSS for Tailwind CSS processing
- Supports watch mode for development
- Minimal dependencies

### Rejected Alternatives

**Vite**:
- Pros: Great DX, fast HMR, good Electron integration
- Cons: Another tool to learn, potential conflicts with Electron's file structure
- **Rejection Reason**: Wanted minimal toolchain complexity

**Create React App**:
- Pros: Zero config, well-tested, extensive ecosystem
- Cons: Difficult to customize for Electron, includes unnecessary web optimizations
- **Rejection Reason**: Too opinionated for Electron use case

**Webpack**:
- Pros: Mature, extensive plugin ecosystem, battle-tested
- Cons: Complex configuration, slower builds, overkill for our needs
- **Rejection Reason**: Speed and complexity concerns

**Parcel**:
- Pros: Zero config, good performance, easy setup
- Cons: Less control over output structure, harder to debug issues
- **Rejection Reason**: Need for custom HTML generation

## Implementation Details

### Build Script Structure (`build.js`)
```javascript
const esbuild = require('esbuild')
const fs = require('fs')
const path = require('path')

// Main app build
await esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  target: 'es2020',
  minify: !isDev,
  sourcemap: isDev,
  // ... other options
})

// Quick chat build  
await esbuild.build({
  entryPoints: ['src/quick-chat.tsx'],
  // ... similar config
})

// Generate HTML files with proper asset references
generateHTML('dist/index.html', mainAssets)
generateHTML('dist/quick-chat.html', quickChatAssets)
```

### CSS Processing Pipeline
1. **Tailwind CSS**: Utility-first styling framework
2. **PostCSS**: CSS post-processing with autoprefixer
3. **esbuild CSS loader**: Bundles and minifies CSS

### TypeScript Integration
- Uses esbuild's built-in TypeScript support for fast compilation
- Separate `tsc --noEmit` check for type validation in CI
- Strict TypeScript configuration for better code quality

### Output Structure
```
dist/
├── index.html              # Main app HTML
├── quick-chat.html         # Quick chat HTML
└── assets/
    ├── index-[hash].js     # Main app bundle
    ├── index-[hash].css    # Main app styles
    ├── quick-chat-[hash].js # Quick chat bundle
    └── quick-chat-[hash].css # Quick chat styles
```

## Consequences

### Positive
- **Extremely fast builds**: 500ms for full rebuild, ~50ms for incremental
- **Simple maintenance**: Single build.js file to understand and modify
- **Electron optimized**: Perfect integration with Electron's requirements
- **Development experience**: Fast rebuilds enable good development flow
- **Bundle optimization**: Tree-shaking and minification work well

### Negative
- **Custom solution**: Team needs to maintain build logic
- **Less ecosystem**: Fewer plugins compared to Webpack/Vite
- **Learning curve**: Team needs to understand esbuild APIs
- **Limited ecosystem**: Can't easily use complex Webpack plugins

### Mitigation Strategies
- **Documentation**: Comprehensive comments in build.js
- **Testing**: Automated tests for build output validation
- **Fallback plan**: Migration path to Vite if complexity grows
- **Monitoring**: Build time tracking to catch performance regressions

## Configuration Files

### Key Configuration Files
- `build.js` - Main build script
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.mjs` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration

### Environment Variables
```bash
NODE_ENV=development  # Enables source maps, disables minification
WATCH=true           # Enables watch mode
```

## Migration Considerations

If the custom build system becomes insufficient:

**Option 1: Migrate to Vite**
- Similar performance characteristics
- Better ecosystem support
- Requires rewriting build configuration

**Option 2: Enhance Current System**  
- Add more esbuild plugins
- Improve development server
- Add advanced optimizations

**Decision Criteria:**
- Build complexity exceeds single file
- Need for advanced features (micro-frontends, etc.)
- Team preference changes

## Review Date

This decision should be reviewed in 9 months (October 2024) or if:
- Build times become a bottleneck
- Team struggles to maintain custom build logic
- esbuild ecosystem changes significantly
- Need for features not available in esbuild

---
*Last updated from source at commit [latest] – edit this file: docs/adr/003-build-system.md*
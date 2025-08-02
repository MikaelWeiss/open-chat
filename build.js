const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const isWatch = process.argv.includes('--watch');
const isDev = process.env.NODE_ENV === 'development' || isWatch;

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist', { recursive: true });
}

// Copy index.html to dist and create additional entry point HTML files
const baseHtmlContent = fs.readFileSync('index.html', 'utf8')
  .replace('href="/favicon.svg"', 'href="./favicon.svg"')
  .replace('</head>', '  <link rel="stylesheet" href="./main.css">\n  </head>');

// Main app HTML
const mainHtmlContent = baseHtmlContent
  .replace('src="/src/main.tsx"', 'type="module" src="./main.js"');
fs.writeFileSync('dist/index.html', mainHtmlContent);

// Settings HTML
const settingsHtmlContent = baseHtmlContent
  .replace('src="/src/main.tsx"', 'type="module" src="./settings.js"')
  .replace('<title>Open Chat</title>', '<title>Open Chat - Settings</title>');
fs.writeFileSync('dist/settings.html', settingsHtmlContent);

// Shortcuts HTML
const shortcutsHtmlContent = baseHtmlContent
  .replace('src="/src/main.tsx"', 'type="module" src="./shortcuts.js"')
  .replace('<title>Open Chat</title>', '<title>Open Chat - Shortcuts</title>');
fs.writeFileSync('dist/shortcuts.html', shortcutsHtmlContent);

// No longer need quick-chat.html - we use the same index.html with URL params

// Copy favicon if it exists
if (fs.existsSync('public/favicon.svg')) {
  fs.copyFileSync('public/favicon.svg', 'dist/favicon.svg');
}

// Process CSS with Tailwind
async function processCss() {
  const cssContent = fs.readFileSync('src/index.css', 'utf8');
  const result = await postcss([tailwindcss, autoprefixer])
    .process(cssContent, { from: 'src/index.css', to: 'dist/main.css' });
  
  fs.writeFileSync('dist/main.css', result.css);
  if (result.map) {
    fs.writeFileSync('dist/main.css.map', result.map.toString());
  }
}

const buildOptions = {
  entryPoints: {
    'main': 'src/entries/main.tsx',
    'settings': 'src/entries/settings.tsx',
    'shortcuts': 'src/entries/shortcuts.tsx'
  },
  bundle: true,
  outdir: 'dist',
  platform: 'browser',
  target: 'es2020',
  format: 'esm', // Changed to esm to enable code splitting
  splitting: true, // Enable code splitting
  sourcemap: isDev,
  minify: !isDev,
  metafile: true,
  define: {
    'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
  },
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.js': 'js',
  },
  jsx: 'automatic',
  jsxImportSource: 'react',
  external: ['*.css'],
};

async function build() {
  try {
    // Process CSS first
    await processCss();
    
    if (isWatch) {
      // Build JS
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      
      // Watch CSS file
      fs.watchFile('src/index.css', async () => {
        console.log('🎨 CSS changed, rebuilding...');
        await processCss();
      });
      
      console.log('👀 Watching for changes...');
    } else {
      const result = await esbuild.build(buildOptions);
      
      // Save metafile for esbuild-visualizer
      if (result.metafile) {
        fs.writeFileSync('dist/metafile.json', JSON.stringify(result.metafile, null, 2));
        console.log('📊 Metafile saved to dist/metafile.json');
      }
      
      console.log('✅ Build completed successfully!');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
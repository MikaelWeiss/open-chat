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

// Copy index.html to dist
const htmlContent = fs.readFileSync('index.html', 'utf8')
  .replace('src="/src/main.tsx"', 'src="./main.js"')
  .replace('href="/favicon.svg"', 'href="./favicon.svg"')
  .replace('</head>', '  <link rel="stylesheet" href="./main.css">\n  </head>');

fs.writeFileSync('dist/index.html', htmlContent);

// Copy quick-chat.html to dist
const quickChatHtmlContent = fs.readFileSync('quick-chat.html', 'utf8')
  .replace('src="/src/quick-chat.tsx"', 'src="./quick-chat.js"')
  .replace('href="/favicon.svg"', 'href="./favicon.svg"')
  .replace('</head>', '  <link rel="stylesheet" href="./main.css">\n  </head>');

fs.writeFileSync('dist/quick-chat.html', quickChatHtmlContent);

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
    'main': 'src/main.tsx',
    'quick-chat': 'src/quick-chat.tsx'
  },
  bundle: true,
  outdir: 'dist',
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  sourcemap: isDev,
  minify: !isDev,
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
      await esbuild.build(buildOptions);
      console.log('✅ Build completed successfully!');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
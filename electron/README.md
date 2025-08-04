# Open Chat

> A modern, feature-rich chat application for AI providers with all the bells and whistles

## Why Open Chat?

Many AI provider chat interfaces (specifically Anthropic) lack essential features that power users need. Open Chat was created to provide a superior chat experience.

## Quick Start

Get up and running in one command:

```bash
git clone https://github.com/mikaelweiss/open-chat.git && cd open-chat && npm install && npm start
```

This will:
1. Clone the repository
2. Install all dependencies 
3. Run the app

## Installation & Development

### Prerequisites
- Node.js 18 or higher
- npm

### Manual Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/open-chat.git
cd open-chat

# Install dependencies
npm install

# Build
npm run build

# Start development mode
npm dev
```

### Available Scripts

- `npm dev` - Start development server with hot reload (React + Electron)
- `npm build` - Build the React app for production
- `npm build:app` - Build and package the app with Electron Builder
- `npm start` - Build and run in production mode
- `npm start:quick` - Run without rebuilding (assumes built)

## Contributing

Contributions are welcome! Please submit issues and pull requests!

## Building for Production

### Development Build
```bash
npm start
```

### Packaged App
```bash
npm build:app
```

This creates distributable packages in the `dist` folder for your platform.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/open-chat/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/open-chat/discussions)
- 📧 **Email**: your-email@example.com


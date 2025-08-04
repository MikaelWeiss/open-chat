# Open Chat Documentation

Welcome to the comprehensive documentation for Open Chat - a modern, feature-rich chat application for AI providers built with Electron and React.

## 📚 Documentation Structure

### Getting Started
- **[Onboarding](./onboarding.md)** - Quick setup, installation, and first steps
- **[Development Workflow](./development-workflow.md)** - Daily development commands and debugging
- **[FAQ & Common Issues](./faq-footguns.md)** - Troubleshooting and known problems

### Architecture & Design
- **[High-Level Architecture](./architecture/overview.md)** - System overview and component relationships
- **[Module Map](./module-map.md)** - Service boundaries and dependencies
- **[Data Contracts](./data-contracts.md)** - API schemas and event formats
- **[ADR (Architecture Decisions)](./adr/)** - Decision records and rationale

### Reference Guides
- **[Entry Points](./entry-points/)** - Runnable processes and their configurations
- **[Where to Look When...](./where-to-look-when.md)** - Quick navigation index
- **[Glossary & Naming](./glossary.md)** - Domain terms and coding conventions
- **[Debugging & Telemetry](./debugging-telemetry.md)** - Monitoring and troubleshooting

### Code Examples
- **[Examples](./examples/)** - Working code samples and patterns
- **[Changelog](./changelog.md)** - Version history and migration notes

## 🚀 Quick Navigation

### For New Contributors
1. Start with [Onboarding](./onboarding.md) for setup
2. Read [Module Map](./module-map.md) to understand the codebase
3. Check [Development Workflow](./development-workflow.md) for daily commands
4. Browse [Examples](./examples/) for code patterns

### For Debugging Issues
1. Check [FAQ & Common Issues](./faq-footguns.md) first
2. Use [Where to Look When...](./where-to-look-when.md) to find relevant code
3. Follow [Debugging & Telemetry](./debugging-telemetry.md) for systematic troubleshooting
4. Review [Data Contracts](./data-contracts.md) for API issues

### For Architecture Understanding
1. Start with [High-Level Architecture](./architecture/overview.md)
2. Review [Architecture Decision Records](./adr/) for context
3. Study [Module Map](./module-map.md) for boundaries
4. Check [Entry Points](./entry-points/) for process details

## 🏗️ Project Overview

Open Chat is a desktop application that provides a superior chat experience for AI providers, addressing limitations in standard web interfaces. Built with modern web technologies wrapped in Electron, it offers:

- **Multi-Provider Support**: Anthropic, OpenAI, Groq, and more
- **Rich Features**: File attachments, streaming responses, usage tracking
- **Power User Tools**: Global shortcuts, quick chat overlay, keyboard navigation
- **Modern Architecture**: React + TypeScript frontend, Node.js backend, Zustand state management

## 📋 Key Documentation Principles

This documentation follows these principles:

1. **Actionable**: Every page provides concrete next steps
2. **Searchable**: Well-organized with clear headings and cross-references
3. **Current**: Updated with each significant change
4. **Example-Driven**: Working code samples for all major features
5. **Beginner-Friendly**: Assumes minimal context, explains domain terms

## 🔧 Contributing to Documentation

### Adding New Documentation
1. Follow the existing structure and naming conventions
2. Include practical examples and command-line snippets
3. Add cross-references to related documentation
4. Update this README with new sections

### Documentation Standards
- **File Format**: Markdown (.md) files
- **Naming**: Kebab-case filenames (e.g., `my-new-doc.md`)
- **Structure**: Clear headings with consistent hierarchy
- **Code Examples**: Always runnable and tested
- **Links**: Relative links to other documentation

### Updating Documentation
- **With Code Changes**: Update relevant docs in the same PR
- **Regular Review**: Documentation review every quarter
- **User Feedback**: Incorporate user questions into FAQ and guides

## 📖 External Resources

### Framework Documentation
- [Electron Documentation](https://www.electronjs.org/docs) - Desktop app framework
- [React Documentation](https://react.dev) - UI library
- [Zustand Documentation](https://zustand-demo.pmnd.rs/) - State management
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling framework

### AI Provider Documentation
- [Anthropic API](https://docs.anthropic.com/api) - Claude models
- [OpenAI API](https://platform.openai.com/docs) - GPT models
- [Groq API](https://console.groq.com/docs) - Fast inference

### Development Tools
- [esbuild Documentation](https://esbuild.github.io/) - Build system
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type system
- [npm Documentation](https://npm.io/) - Package manager

## 🤝 Support & Community

### Getting Help
- **Documentation Issues**: [GitHub Issues](https://github.com/yourusername/open-chat/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/yourusername/open-chat/discussions)
- **Bug Reports**: Use issue templates with reproduction steps

### Communication Channels
- **GitHub**: Primary platform for code and documentation
- **Discord**: Community chat (link TBD)
- **Email**: For sensitive issues (security, etc.)

## 🗂️ Documentation Changelog

### Recent Updates
- **2024-01-XX**: Initial comprehensive documentation structure
- **2024-01-XX**: Added architecture decision records (ADRs)
- **2024-01-XX**: Created working examples and troubleshooting guides

### Upcoming Improvements
- Interactive tutorials for common workflows
- Video guides for complex setup procedures
- API reference documentation generator
- Documentation search functionality

---

*This documentation is continuously improved. Last major update: [current date] – contribute improvements via [GitHub](https://github.com/yourusername/open-chat).*
# FAQ / Common Issues & Footguns

## Installation & Setup Issues

### Electron Installation Problems

**Q: `Error: Electron failed to install correctly` or blank app window**

A: This usually happens when Electron's binary wasn't downloaded properly.

```bash
# Solution 1: Rebuild Electron
rm -rf node_modules/electron/
npm install
npm rebuild electron

# Solution 2: Clear cache and reinstall
rm -rf node_modules npm-lock.yaml
npm install
npm rebuild electron

# Solution 3: Force download
npm install electron --force
```

**Q: `EACCES` permission errors during installation**

A: Don't use `sudo` with npm. Fix permissions instead:

```bash
# Check npm global directory
npm config get global-dir

# Fix permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.local/share/npm

# Or use different global directory
npm config set global-dir ~/.npm-global
```

### Port Conflicts

**Q: `Port 3000 is already in use` during development**

A: Kill the conflicting process or use a different port:

```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm dev
```

**Q: Quick Chat global shortcut not working**

A: Check for conflicts with other applications:

```bash
# macOS: Check System Preferences → Keyboard → Shortcuts
# Windows: Check Windows Settings → System → About → Advanced system settings
# Linux: Check desktop environment shortcuts

# Try different shortcut in Settings → Keyboard
# Example: Ctrl+Shift+Space instead of Cmd+Shift+Space
```

## Runtime Issues

### Settings Corruption

**Q: Settings keep resetting to defaults**

A: Settings file is likely corrupted. Check and fix:

```bash
# Check corruption status in app
# Settings → Advanced → Check Corruption Status

# Manually check settings file (macOS)
cat ~/Library/Application\ Support/open-chat/settings.json

# Backup and reset if needed
cp ~/Library/Application\ Support/open-chat/settings.json ./settings-backup.json
# Then in app: Settings → Advanced → Reset All Settings
```

**Q: `JSON.parse` errors in console**

A: Settings file has invalid JSON:

```bash
# Validate JSON manually
node -e "console.log(JSON.parse(require('fs').readFileSync('path/to/settings.json', 'utf8')))"

# Or use online JSON validator
# Fix manually or reset via app
```

### API & Provider Issues

**Q: `INVALID_API_KEY` errors**

A: API key configuration issues:

1. **Check key format**:
   - Anthropic: Should start with `sk-ant-`
   - OpenAI: Should start with `sk-`
   - Groq: Check provider documentation

2. **Test API key manually**:
   ```bash
   # Test Anthropic key
   curl -H "x-api-key: YOUR_KEY" https://api.anthropic.com/v1/messages
   
   # Test OpenAI key
   curl -H "Authorization: Bearer YOUR_KEY" https://api.openai.com/v1/models
   ```

3. **Check provider status**: Visit provider status pages

**Q: `MODEL_NOT_FOUND` errors**

A: Model is no longer available or subscription issue:

1. **Refresh models**: Settings → Provider → Refresh Models button
2. **Check subscription**: Some models require paid plans
3. **Use alternative model**: Try different model from same provider

**Q: Streaming stops mid-response**

A: Network or rate limiting issues:

```bash
# Check network connectivity
ping api.anthropic.com

# Check for rate limiting (look for 429 status codes in console)
# Wait and retry, or check rate limits in provider dashboard

# Verify no firewall blocking
# Corporate networks may block streaming connections
```

### Memory & Performance Issues

**Q: App becomes slow or uses too much RAM**

A: Memory leaks or large conversation history:

1. **Check memory usage**:
   - Activity Monitor (macOS) / Task Manager (Windows)
   - Look for high "Memory" usage by Open Chat

2. **Clear old conversations**:
   - File → Export conversations (backup)
   - Delete old conversations to free memory

3. **Restart app**:
   - Close and restart to clear memory leaks

**Q: UI becomes unresponsive during long responses**

A: Rendering performance issue:

```bash
# Enable development mode for better debugging
NODE_ENV=development npm start

# Check DevTools Console for errors
# Look for React warnings about large lists or frequent re-renders
```

## Build & Development Issues

### Build Failures

**Q: `esbuild` build fails with TypeScript errors**

A: TypeScript compilation issues:

```bash
# Check TypeScript compilation separately
npx tsc --noEmit

# Fix TypeScript errors first, then rebuild
npm build
```

**Q: CSS not loading or styles broken**

A: Tailwind CSS or PostCSS issues:

```bash
# Rebuild CSS specifically
rm -rf dist/assets/*.css
npm build

# Check Tailwind config
npx tailwindcss -i src/index.css -o dist/test.css

# Verify PostCSS config
npx postcss src/index.css -o dist/test-postcss.css
```

**Q: Hot reload not working**

A: File watcher issues:

```bash
# macOS: Increase file watcher limit
sudo sysctl -w kern.maxfiles=65536
sudo sysctl -w kern.maxfilesperproc=65536

# Linux: Increase inotify limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Windows: Usually works out of the box
# If issues, try running as administrator
```

### Debugging Issues

**Q: DevTools not opening or blank**

A: Electron DevTools issues:

```bash
# Enable DevTools explicitly
NODE_ENV=development electron . --enable-devtools

# Force DevTools to show
# In app: View → Toggle Developer Tools (Cmd+Option+I)

# If still blank, try Electron rebuild
npm rebuild electron
```

**Q: Main process debugging not working**

A: Inspector port conflicts:

```bash
# Use different port
NODE_ENV=development electron --inspect=9230 .

# Check if port is in use
lsof -i :9229

# Kill conflicting process
kill $(lsof -t -i:9229)
```

## Data & Storage Issues

### Conversation Data

**Q: Conversations disappeared**

A: Data storage issues:

```bash
# Check if conversations file exists (macOS)
ls -la ~/Library/Application\ Support/open-chat/

# Check file permissions
ls -la ~/Library/Application\ Support/open-chat/conversations.json

# Look for backup files
ls -la ~/Library/Application\ Support/open-chat/*.backup

# Check console for file system errors
# Console App on macOS, filter by "open-chat"
```

**Q: Conversations not syncing between windows**

A: IPC communication issues:

1. **Check console logs** for IPC errors
2. **Restart app** to reset IPC connections
3. **File → Refresh** in menu (if available)

### File Attachments

**Q: Image uploads fail or don't display**

A: File handling issues:

```bash
# Check supported file types
# Images: jpg, jpeg, png, gif, webp

# Verify file size (app may have limits)
ls -lh path/to/image.jpg

# Check file permissions
file path/to/image.jpg
```

**Q: Audio files not uploading**

A: Codec or format issues:

```bash
# Check supported audio formats
# Audio: mp3, wav, ogg, aac, m4a, flac, webm

# Convert to supported format if needed
ffmpeg -i input.mp4 output.wav
```

## Common User Errors

### Workflow Mistakes

**Q: Accidentally deleted important conversation**

A: No built-in undo, but check backups:

1. **Look for auto-backups** in settings directory
2. **Check Recent exports** (if you used File → Export)
3. **Consider it a learning experience** and implement regular exports

**Q: Global shortcut captured by another app**

A: Shortcut conflicts:

1. **Try different shortcut**: Settings → Keyboard → Global Hotkey
2. **Check system shortcuts**: 
   - macOS: System Preferences → Keyboard → Shortcuts
   - Windows: Windows key shortcuts
   - Linux: Desktop environment shortcuts

**Q: API costs higher than expected**

A: Usage monitoring and optimization:

1. **Check usage stats**: Settings → Usage Statistics
2. **Monitor token usage** per conversation
3. **Use cheaper models** for simple tasks
4. **Set up cost alerts** in Settings → Usage

### Configuration Errors

**Q: Dark/Light theme not working**

A: Theme configuration issues:

1. **Check theme setting**: Settings → Appearance → Theme
2. **Try "System" theme** to follow OS preference
3. **Restart app** after theme change
4. **Clear browser cache** (Cmd+Shift+R or Ctrl+Shift+R)

**Q: Models not showing up for provider**

A: Model fetching issues:

1. **Refresh models**: Settings → Provider → Refresh Models
2. **Check API key permissions**: Some keys have model restrictions
3. **Wait for rate limits**: Too frequent refreshes may be blocked
4. **Check provider documentation**: For model availability

## Emergency Recovery

### Nuclear Options (Last Resort)

**Q: App completely broken, nothing works**

A: Complete reset:

```bash
# WARNING: This deletes all conversations and settings
rm -rf ~/Library/Application\ Support/open-chat/

# Or use app reset (safer, creates backup)
# Settings → Advanced → Reset All Data
```

**Q: Can't even open the app**

A: Installation corruption:

```bash
# Complete reinstall
rm -rf node_modules npm-lock.yaml
rm -rf ~/Library/Application\ Support/open-chat/
npm install
npm rebuild electron
npm start
```

## Prevention Tips

### Regular Maintenance

1. **Export conversations monthly**: File → Export All Conversations
2. **Backup settings**: Copy settings.json periodically
3. **Monitor usage**: Check Settings → Usage Statistics weekly
4. **Update regularly**: Keep app and dependencies updated
5. **Test API keys**: Verify provider access monthly

### Best Practices

1. **Use descriptive conversation titles**
2. **Delete old conversations** you don't need
3. **Don't share API keys** in screenshots or logs
4. **Set up cost alerts** to avoid billing surprises
5. **Keep conversations focused** (better for memory usage)

## Getting Help

### Debug Information to Collect

When reporting issues, include:

```bash
# System information
node --version
npm --version
electron --version

# App version (from About dialog)
# Operating system and version
# Console logs (DevTools → Console)
# Settings corruption status (Settings → Advanced)
# Steps to reproduce the issue
```

### Support Channels

- **GitHub Issues**: Report bugs with reproduction steps
- **Discussions**: Ask questions and share tips
- **Email**: For sensitive issues (API key problems, etc.)

---
*Last updated from source at commit [latest] – edit this file: docs/faq-footguns.md*
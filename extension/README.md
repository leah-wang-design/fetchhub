# Fetch - Browser Extension

Visual feedback tool for any webpage. Capture screenshots, annotate with area selections, and collaborate with your team.

## Features

- 📸 **On-Demand Screenshots** - Capture exactly when you need feedback
- 🎯 **Area Selection** - Drag to select regions with pink highlights
- 💬 **Comment Annotations** - Add feedback text to selected areas
- 🔄 **Multi-Screenshot Sessions** - Capture multiple screenshots in one review
- 🌐 **Auto URL Detection** - Automatically captures page URL and title
- 👤 **User Profiles** - Auto-fills your name from Chrome profile
- ☁️ **Cloud Storage** - All feedback saved to Cloudflare backend
- 🤝 **Team Collaboration** - View all feedback via web gallery

## Installation

### Load Unpacked (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `extension` directory: `/Users/leahwang/design-feedback/extension/`
5. Extension installed! Look for the 📸 icon in your toolbar

### Production (Coming Soon)
Will be available on Chrome Web Store

## Usage

### Start Reviewing

**Option 1: Via Extension Icon**
1. Click the extension icon in toolbar
2. Click **"Start Reviewing"**
3. A floating "Add Comment" button appears on the page

**Option 2: Via Keyboard Shortcut** (Coming Soon)
- Press `Alt+Shift+F` to toggle review mode

### Add Comments

1. With review mode active, interact with the page normally
2. When ready to capture feedback, click **"Add Comment"**
3. Screenshot captured → annotation mode opens
4. **Drag to select areas** on the screenshot (pink highlights)
5. **Enter comment text** in the modal
6. Click **"Add Comment"** to save
7. Back to page view → can add more screenshots

### Save Session

After capturing all screenshots:
1. Click **"Save"** button in annotation mode
2. Or get prompted when exiting review mode
3. Extension auto-detects URL and your name
4. All screenshots + comments saved to cloud

### View Feedback

- Click extension icon → See recent reviews
- Click **"View All Sessions"** → Opens web gallery
- Or visit: https://design-feedback.px-tester.workers.dev

## How It Works

### Architecture

```
Browser Tab (Any Website)
    ↓
Content Script (Injected Overlay UI)
    ↓
Background Service Worker (Screenshot Capture)
    ↓
Cloudflare Worker API (D1 Database)
    ↓
Web Gallery (View Sessions)
```

### Components

1. **Content Script** (`content/content.js`)
   - Injects floating button
   - Renders annotation overlay
   - Handles area selection
   - Manages comment modals

2. **Background Worker** (`background/service-worker.js`)
   - Captures visible tab screenshots
   - Detects current URL and title
   - Gets user profile info
   - Makes API calls to backend

3. **Popup UI** (`popup/popup.html`)
   - Toggle review mode
   - View recent sessions
   - Quick access to gallery

### Permissions

- `activeTab` - Capture current tab screenshot
- `tabs` - Access tab URL and title
- `storage` - Remember user preferences
- `identity` - Get Google profile name (optional)
- `<all_urls>` - Inject content script on any page

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Esc` | Cancel annotation mode |
| `Enter` | Submit comment (when modal open) |
| _Coming soon_ | More shortcuts |

## API Backend

Extension connects to existing Cloudflare Worker:
- **Base URL**: `https://design-feedback.px-tester.workers.dev`
- **Endpoints**: Same as web app (screenshots, comments, sessions)

## Troubleshooting

### Button Not Appearing
- Make sure review mode is active (check extension popup)
- Refresh the page after enabling review mode
- Some restricted pages (chrome://, chrome-extension://) don't allow extensions

### Screenshot Capture Failed
- Ensure you granted `activeTab` permission
- Try clicking the page first to focus it
- Check browser console for errors

### Comments Not Saving
- Check internet connection
- Verify backend is accessible
- Check browser console for API errors

## Development

### File Structure

```
extension/
├── manifest.json              # Extension config
├── background/
│   └── service-worker.js      # Screenshot capture, API
├── content/
│   ├── content.js            # Overlay UI, annotations
│   └── content.css           # Overlay styles
├── popup/
│   ├── popup.html            # Extension popup
│   ├── popup.js              # Popup logic
│   └── popup.css             # Popup styles
├── icon16.png                # Toolbar icon (16x16)
├── icon48.png                # Extension icon (48x48)
└── icon128.png               # Store icon (128x128)
```

### Testing Locally

1. Make changes to files
2. Go to `chrome://extensions/`
3. Click refresh icon on extension card
4. Test on any webpage

### Debug Console

- **Content Script**: Right-click page → Inspect → Console tab
- **Background Worker**: `chrome://extensions/` → Extension card → Service worker → inspect
- **Popup**: Right-click extension icon → Inspect popup

## Roadmap

- [ ] Firefox support (Manifest V2 version)
- [ ] Safari extension
- [ ] Keyboard shortcuts
- [ ] Drawing tools (arrows, text, circles)
- [ ] Video recording mode
- [ ] Slack/Discord integrations
- [ ] Team permissions

## Support

Issues or questions? Contact: [your-email@example.com]

## License

MIT

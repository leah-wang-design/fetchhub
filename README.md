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
1. Download updated extension: Go to: https://github.com/leah-wang-design/fetchhub
2. Click "Code" → "Download ZIP"
3. Unzip to your local directory

### Load Unpacked (Development)
1. Open Chrome, **Login your PERSONAL gmail**and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `extension` directory: `/Users/leahwang/design-feedback/extension/`
5. Extension installed! Look for the 📸 icon in your toolbar
6. Authenticate FIRST: Visit: https://fetchhub.px-tester.workers.dev Login with your @cloudflare.com email via Cloudflare Access
7. Then use extension. Note: you need to view the webpage in the **same browser** where you have the extension installed.

### Production (Coming Soon)
Will be available on Chrome Web Store

## Usage

### Start Reviewing

1. Click the extension icon in toolbar
2. Click **"Start Reviewing"**
3. A floating "Add Comment" button appears on the page

### Add Comments

1. With review mode active, interact with the page normally
2. When ready to capture feedback, click **Add Comment"**
3. Screenshot captured → annotation mode opens
4. **Drag to select areas** on the screenshot (pink highlights)
5. **Enter comment text** in the modal and confirm with the up arrow.
6. Back to page view → can add more screenshots
7. Click **"SAVE"** once you are done

### Save Session

After capturing all screenshots:
1. Click **"Save"** button in annotation mode
2. Or get prompted when exiting review mode
3. Extension auto-detects URL and your name
4. All screenshots + comments saved to cloud

### View Feedback

- Click extension icon → See recent reviews
- Click **"View All Sessions"** → Opens web gallery
- Or visit: https://fetchhub.px-tester.workers.dev

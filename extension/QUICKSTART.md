# Quick Start Guide

## Load Extension in Chrome (5 minutes)

### Step 1: Create Placeholder Icons (1 min)

The extension needs icon files. Quick temporary solution:

```bash
# Create simple colored PNG files
# You can use any image (even a screenshot) for testing

# Option A: Use any PNG image and copy it 3 times
cp /path/to/any-image.png icon16.png
cp /path/to/any-image.png icon48.png
cp /path/to/any-image.png icon128.png

# Option B: Download from internet and rename
# Or skip this - Chrome will use default icon
```

### Step 2: Load Extension (2 min)

1. Open Chrome
2. Go to: `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Navigate to: `/Users/leahwang/design-feedback/extension/`
6. Click **"Select"**

✅ Extension installed! You'll see it in the toolbar.

### Step 3: Test It (2 min)

1. **Navigate to any website** (e.g., `google.com`, `github.com`)
2. **Click extension icon** (📸 or default icon in toolbar)
3. Click **"Start Reviewing"**
4. **Floating button appears**: "📸 Add Comment"
5. Click **"Add Comment"**
6. Screenshot captured!
7. **Drag on screenshot** to select area (pink highlight)
8. **Enter comment** and click "Add Comment"
9. Click **"Save"** to finish

### Step 4: View Results

1. Click extension icon again
2. See your review in "Recent Reviews"
3. Or visit: https://design-feedback.px-tester.workers.dev
4. Your feedback is saved! ✅

## Troubleshooting

### Can't See Floating Button?
- Click extension icon → verify "Review Mode: On"
- Refresh the page after enabling
- Some pages (chrome://) don't allow extensions

### Screenshot Not Captured?
- Click on the page first to focus it
- Check that you allowed permissions when installing
- Try a different website

### Comments Not Saving?
- Check internet connection
- Verify backend is running: https://design-feedback.px-tester.workers.dev
- Open browser console (F12) to see errors

## What's Next?

- Test on multiple websites
- Add multiple comments in one session
- View feedback in web gallery
- Share with team members

## Development Mode

To make changes:
1. Edit files in `/extension/` directory
2. Go to `chrome://extensions/`
3. Click **refresh icon** on extension card
4. Test changes

No rebuild needed - just refresh!

## Common Issues

**Extension shows errors on install:**
- Check that all files exist in correct locations
- Ensure `manifest.json` is valid JSON
- Icons are optional for testing

**Doesn't work on some pages:**
- Chrome extensions can't inject into:
  - `chrome://` pages
  - `chrome-extension://` pages
  - Chrome Web Store
  - Some Google internal pages

**API connection fails:**
- Ensure Cloudflare Worker backend is deployed
- Check CORS headers in worker
- Verify API_BASE URL in `background/service-worker.js`

Happy reviewing! 🎉

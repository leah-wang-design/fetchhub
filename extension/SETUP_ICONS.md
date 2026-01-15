# Setup Extension Icons with Acorn Image

## Quick Setup (1 minute)

### Step 1: Save the Acorn Image

1. Right-click the acorn image (the one you uploaded)
2. Save it to Downloads folder as `acorn.png`
3. Or save it directly to the extension folder

### Step 2: Run Commands

Open Terminal in the extension folder and run:

```bash
cd /Users/leahwang/design-feedback/extension

# If saved to Downloads:
sips -z 16 16 ~/Downloads/acorn.png --out icon16.png
sips -z 48 48 ~/Downloads/acorn.png --out icon48.png
sips -z 128 128 ~/Downloads/acorn.png --out icon128.png

# Or if you have the image elsewhere:
# Replace /path/to/acorn.png with your actual path
sips -z 16 16 /path/to/acorn.png --out icon16.png
sips -z 48 48 /path/to/acorn.png --out icon48.png
sips -z 128 128 /path/to/acorn.png --out icon128.png
```

### Step 3: Verify

```bash
ls -lh icon*.png
```

You should see:
- icon16.png
- icon48.png  
- icon128.png

✅ Done! Now load the extension in Chrome.

## Alternative: Use the Script

```bash
# Make script executable (already done)
chmod +x create-icons.sh

# Run with your acorn image path
./create-icons.sh ~/Downloads/acorn.png
```

## Next: Load Extension

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select: `/Users/leahwang/design-feedback/extension/`
5. Start testing! 🎉

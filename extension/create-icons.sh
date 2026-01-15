#!/bin/bash

# Create Icons Script
# Usage: ./create-icons.sh /path/to/acorn-image.png

if [ -z "$1" ]; then
  echo "Usage: ./create-icons.sh /path/to/acorn-image.png"
  echo ""
  echo "Please provide the path to your acorn image"
  exit 1
fi

SOURCE_IMAGE="$1"

if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "Error: File not found: $SOURCE_IMAGE"
  exit 1
fi

echo "Creating extension icons from: $SOURCE_IMAGE"

# Create 16x16 icon
sips -z 16 16 "$SOURCE_IMAGE" --out icon16.png
echo "✓ Created icon16.png"

# Create 48x48 icon
sips -z 48 48 "$SOURCE_IMAGE" --out icon48.png
echo "✓ Created icon48.png"

# Create 128x128 icon
sips -z 128 128 "$SOURCE_IMAGE" --out icon128.png
echo "✓ Created icon128.png"

echo ""
echo "✅ All icons created successfully!"
echo ""
echo "Next steps:"
echo "1. Go to chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click 'Load unpacked'"
echo "4. Select: $(pwd)"

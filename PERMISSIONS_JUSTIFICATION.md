# Chrome Extension Permissions Justification

## Extension: Fetch - Visual Feedback Tool

### Permissions Requested

#### 1. **activeTab**
**Why needed:** Allows the extension to access the current tab when the user clicks the extension icon. This is used to:
- Capture screenshots of the active webpage
- Inject the annotation overlay when user starts a review
- Read page title and URL for organizing screenshots

**User benefit:** Provides secure, on-demand access only when user explicitly activates the extension.

#### 2. **tabs**
**Why needed:** Required to:
- Get the current tab's URL and title for screenshot metadata
- Query active tabs to determine which page to capture
- Send messages to content scripts in the active tab

**User benefit:** Enables proper organization and labeling of captured screenshots.

#### 3. **storage**
**Why needed:** Stores:
- Cached username (to avoid repeated API calls)
- Recent review sessions (for quick access in popup)
- User preferences

**User benefit:** Faster loading times and better user experience with cached data.

#### 4. **scripting**
**Why needed:** Dynamically injects content scripts to:
- Add the annotation overlay UI to webpages
- Capture screenshots programmatically
- Handle user interactions with annotation markers

**User benefit:** Provides the core screenshot and annotation functionality.

#### 5. **cookies**
**Why needed:** Reads the `CF_Authorization` cookie to:
- Authenticate API requests to the backend
- Maintain secure user sessions
- Sync screenshots across devices

**User benefit:** Secure authentication without requiring users to manually log in through the extension.

---

### Content Scripts with `<all_urls>`

**Why needed:** The extension's core purpose is to allow users to capture screenshots and add annotations to **any webpage** they visit. Content scripts must be available on all URLs to:
- Inject the annotation overlay UI when user starts a review
- Capture screenshots of any webpage
- Add visual feedback markers and comments

**User benefit:** Works universally on any website the user wants to review, without requiring per-site permissions.

**Security measures:**
- Content scripts only activate when user explicitly clicks "Start review"
- No automatic data collection or tracking
- Scripts are passive until user interaction
- All data stays local until user saves a screenshot

---

### Why NOT Using `host_permissions: ["<all_urls>"]`

We **removed** `host_permissions: ["<all_urls>"]` because:
- The extension only needs access to the **active tab** (via `activeTab` permission)
- Content scripts provide the necessary UI injection on all pages
- No background access to all tabs is required
- More secure and privacy-friendly approach

---

### Data Collection Summary

**What we collect:**
- Screenshots user explicitly captures
- Annotations and comments user adds
- Page URL and title of captured screenshots
- User email/name from Cloudflare Access authentication

**What we DON'T collect:**
- Browsing history beyond captured screenshots
- Passwords or form data
- Tracking or analytics
- Any data from pages user doesn't screenshot

**Privacy Policy:** https://fetch-privacy.px-tester.workers.dev

---

### Single Purpose

**Extension Purpose:** Visual feedback and annotation tool for collaborative webpage design reviews.

All permissions directly support this single purpose:
- `activeTab` + `scripting` → Capture and annotate webpages
- `tabs` → Organize screenshots by page
- `storage` → Cache user data for performance
- `cookies` → Secure authentication
- Content scripts on `<all_urls>` → Work on any webpage user wants to review

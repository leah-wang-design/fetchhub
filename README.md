# Fetch Hub

A collaborative visual feedback tool built on Cloudflare Workers. Upload any URL and let your team add comments by clicking directly on the page.

## Features

- 🎯 **Click-to-Comment**: Click anywhere on the page to add feedback
- 👥 **Collaborative**: Share a link and collect feedback from multiple people
- 📍 **Positioned Markers**: See exactly where each comment was made
- ⏱️ **Timestamped**: All comments include commenter name and timestamp
- ✅ **Resolve Tracking**: Mark comments as resolved when addressed
- 📤 **Export**: Download all feedback as JSON
- 🚀 **Fast & Free**: Built on Cloudflare Workers + D1 (free tier)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Icons**: Lucide React

## Project Structure

```
design-feedback/
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── worker/                  # Cloudflare Worker
│   ├── src/
│   │   ├── index.ts        # Main worker
│   │   ├── api.ts          # API handlers
│   │   └── types.ts
│   ├── migrations/         # D1 migrations
│   ├── wrangler.toml
│   └── package.json
└── README.md
```

## Setup

### Prerequisites

- Node.js 18+
- npm or pnpm
- Cloudflare account (free)
- Wrangler CLI

### Installation

1. **Install dependencies**

```bash
# Install frontend dependencies
cd frontend
npm install

# Install worker dependencies
cd ../worker
npm install
```

2. **Create D1 Database**

```bash
cd worker
npm run db:create
```

This will output a database ID. Copy it and update `wrangler.toml`:

```toml
[[ d1_databases ]]
binding = "DB"
database_name = "design-feedback-db"
database_id = "YOUR_DATABASE_ID_HERE"  # Replace with your database ID
```

3. **Run Migrations**

```bash
npm run db:migrate
```

4. **Build Frontend**

```bash
cd ../frontend
npm run build
```

This builds the React app and outputs it to `worker/public/`.

5. **Deploy Worker**

```bash
cd ../worker
npm run deploy
```

Your app will be live at: `https://design-feedback.YOUR_SUBDOMAIN.workers.dev`

## Development

### Run Frontend Locally

```bash
cd frontend
npm run dev
```

Access at `http://localhost:5173`

### Run Worker Locally

```bash
cd worker
npm run dev
```

For local development with D1:

```bash
npm run db:migrate:local
npm run dev
```

## Usage

### 1. Enter a URL

Open the app and enter any URL you want to review (e.g., a staging site, design preview, etc.)

### 2. Add Feedback

- Click the **"Add Feedback"** button to enable feedback mode
- Click anywhere on the page to drop a comment pin
- Enter your name and comment
- Click **"Add Comment"** to save

### 3. View Comments

- All comments appear in the sidebar on the right
- Click any comment to highlight its location
- Click the checkbox to mark a comment as resolved

### 4. Share & Collaborate

Share the URL with your team. The URL format is:

```
https://design-feedback.YOUR_SUBDOMAIN.workers.dev?url=https://preview.example.com
```

Everyone viewing the same target URL will see the same comments.

### 5. Export Feedback

Click the download icon in the sidebar to export all comments as JSON.

## API Endpoints

### GET `/api/comments?url=<encoded-url>`
Get all comments for a specific URL

### POST `/api/comments`
Create a new comment

**Body:**
```json
{
  "target_url": "https://example.com",
  "x": 25.5,
  "y": 40.2,
  "commenter_name": "John Doe",
  "comment_text": "This button should be blue"
}
```

### PUT `/api/comments/:id/resolve`
Toggle resolved status for a comment

### GET `/api/export?url=<encoded-url>`
Export all comments for a URL as JSON

## Database Schema

```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  target_url TEXT NOT NULL,
  x REAL NOT NULL,              -- X coordinate (%)
  y REAL NOT NULL,              -- Y coordinate (%)
  commenter_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  resolved INTEGER DEFAULT 0,   -- 0 = unresolved, 1 = resolved
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Deployment

### Update Code

```bash
# Build frontend
cd frontend
npm run build

# Deploy worker
cd ../worker
npm run deploy
```

### Custom Domain

Add a custom domain in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Click "Settings" > "Triggers"
4. Add a custom domain

## Cloudflare Free Tier Limits

- **Requests**: 100,000/day
- **D1 Storage**: 5 GB
- **D1 Reads**: 5 million/day
- **D1 Writes**: 100,000/day

More than enough for most teams!

## Troubleshooting

### CORS Errors

The worker includes CORS headers. If you still see CORS errors, check that your target URL allows iframe embedding.

### Database Not Found

Make sure you:
1. Created the database with `npm run db:create`
2. Updated `wrangler.toml` with the correct `database_id`
3. Ran migrations with `npm run db:migrate`

### Comments Not Appearing

Check the browser console for errors. Common issues:
- Database not migrated
- Wrong database ID in `wrangler.toml`
- Network errors (check worker logs in Cloudflare Dashboard)

## License

MIT

## Contributing

Pull requests welcome! Please open an issue first to discuss major changes.

---

Built with ❤️ using Cloudflare Workers

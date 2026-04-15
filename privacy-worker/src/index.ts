export default {
  async fetch(request: Request): Promise<Response> {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Fetch Extension</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
      background: #f9f9f9;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #34495e;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    h3 {
      color: #555;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    ul {
      padding-left: 20px;
      margin: 10px 0;
    }
    li {
      margin: 8px 0;
    }
    .last-updated {
      color: #7f8c8d;
      font-style: italic;
      margin-bottom: 30px;
    }
    .summary {
      background: #ecf0f1;
      padding: 20px;
      border-left: 4px solid #3498db;
      margin: 30px 0;
      border-radius: 4px;
    }
    strong {
      color: #2c3e50;
    }
    code {
      background: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Privacy Policy for Fetch Extension</h1>
    <p class="last-updated"><strong>Last Updated:</strong> April 15, 2026</p>

    <h2>Overview</h2>
    <p>Fetch is a Chrome extension that allows users to capture screenshots and add visual feedback to webpages. This privacy policy explains what data we collect, how we use it, and your rights regarding your data.</p>

    <h2>What We Collect</h2>
    <ul>
      <li><strong>Email and name</strong> (from Cloudflare Access authentication)</li>
      <li><strong>Screenshots</strong> you capture with page URL and title</li>
      <li><strong>Annotations and comments</strong> you add</li>
      <li><strong>Workspace information</strong> you create</li>
    </ul>

    <h2>What We Don't Collect</h2>
    <ul>
      <li>Browsing history beyond screenshots you capture</li>
      <li>Passwords or sensitive form data</li>
      <li>Tracking or analytics data</li>
      <li>Third-party cookies</li>
    </ul>

    <h2>How We Use Your Data</h2>
    <p>We use your data solely to provide the core functionality:</p>
    <ul>
      <li>Store and retrieve your screenshots</li>
      <li>Display your annotations and feedback</li>
      <li>Organize screenshots in workspaces</li>
      <li>Authenticate your access to the service</li>
    </ul>

    <h2>Data Sharing</h2>
    <p><strong>We do not sell your data.</strong> Your screenshots and annotations are visible only to:</p>
    <ul>
      <li>Other authenticated users in your organization with Cloudflare Access</li>
      <li>Workspace members for shared workspaces</li>
    </ul>

    <h2>Security & Privacy</h2>
    <ul>
      <li>Cloudflare Access authentication with JWT verification</li>
      <li>HTTPS encryption for all data transmission</li>
      <li>HttpOnly cookies prevent token theft</li>
      <li>Automatic token expiration</li>
      <li>No data selling or advertising</li>
    </ul>

    <h2>Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
      <li>Access all data associated with your account</li>
      <li>Delete individual screenshots and annotations</li>
      <li>Delete entire review sessions</li>
      <li>Request complete account deletion</li>
    </ul>

    <h2>Cookies</h2>
    <p>We use the <code>CF_Authorization</code> cookie (set by Cloudflare Access) for authentication. This is an HttpOnly, Secure cookie with a session-based duration (typically 15 minutes to 24 hours).</p>

    <h2>Third-Party Services</h2>
    <p>We use Cloudflare services for:</p>
    <ul>
      <li>Cloudflare Access (authentication)</li>
      <li>Cloudflare Workers (backend hosting)</li>
      <li>Cloudflare D1 (database storage)</li>
    </ul>
    <p>We do not use analytics, advertising, or social media tracking.</p>

    <h2>Data Retention</h2>
    <p>Screenshots and annotations are retained until you delete them. Deleted items are permanently removed from the database.</p>

    <h2>Compliance</h2>
    <p>This extension complies with Chrome Web Store Developer Program Policies, GDPR, and CCPA.</p>

    <div class="summary">
      <h3>Summary</h3>
      <p><strong>What we collect:</strong> Screenshots you capture, annotations you add, your email/name from Cloudflare Access</p>
      <p><strong>Why:</strong> To provide screenshot and feedback functionality</p>
      <p><strong>Who can see it:</strong> Other authenticated users in your organization</p>
      <p><strong>Your control:</strong> Delete any screenshot or annotation at any time</p>
    </div>

    <h2>Contact Information</h2>
    <p>If you have questions about this privacy policy or wish to exercise your data rights, please contact: <strong>lwang@cloudflare.com</strong></p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
    <p style="text-align: center; color: #7f8c8d;"><em>By using the Fetch extension, you acknowledge that you have read and understood this privacy policy and agree to its terms.</em></p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  },
};

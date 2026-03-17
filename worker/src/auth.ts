import type { Env } from './types';

export interface AuthenticatedUser {
  email: string;
  userId: string;
  name: string;
}

/**
 * Validates Cloudflare Access JWT and extracts user info
 */
export async function authenticateRequest(
  request: Request,
  env: Env
): Promise<AuthenticatedUser | null> {
  // Get JWT from Cloudflare Access header
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  
  if (!jwt) {
    // For local development: return mock user
    const url = new URL(request.url);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      const mockEmail = 'dev@localhost.com';
      const mockName = 'Local Dev User';
      const userId = await getOrCreateUser(mockEmail, mockName, env);
      return { email: mockEmail, userId, name: mockName };
    }
    return null;
  }

  try {
    // Parse JWT payload (Cloudflare Access JWTs are already verified by the proxy)
    const payload = parseJwt(jwt);
    const email = payload.email as string;

    if (!email || !email.endsWith('@cloudflare.com')) {
      return null;
    }

    // Extract full name from JWT
    let name = '';
    if (payload.name) {
      // Use 'name' field if available
      name = String(payload.name);
    } else if (payload.given_name && payload.family_name) {
      // Fallback to first + last name
      name = `${payload.given_name} ${payload.family_name}`;
    } else if (payload.given_name) {
      // Fallback to just first name
      name = String(payload.given_name);
    } else {
      // Final fallback: format username from email (lowercase)
      const username = email.split('@')[0];
      // Convert "john.doe" to "john doe"
      name = username
        .split(/[._-]/)
        .map(part => part.toLowerCase())
        .join(' ');
    }

    // Get or create user in database
    const userId = await getOrCreateUser(email, name, env);

    return { email, userId, name };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Parse JWT payload without verification (verification handled by Cloudflare Access)
 */
function parseJwt(token: string): any {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

/**
 * Get existing user or create new user record
 */
async function getOrCreateUser(email: string, name: string, env: Env): Promise<string> {
  // Check if user exists
  const existing = await env.DB.prepare(
    'SELECT id FROM users WHERE email = ?'
  )
    .bind(email)
    .first<{ id: string }>();

  if (existing) {
    // Update name if it exists (in case JWT has updated info)
    await env.DB.prepare('UPDATE users SET name = ? WHERE id = ?')
      .bind(name, existing.id)
      .run();
    return existing.id;
  }

  // Create new user
  const userId = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO users (id, email, name) VALUES (?, ?, ?)'
  )
    .bind(userId, email, name)
    .run();

  return userId;
}

/**
 * Create 401 Unauthorized response
 */
export function unauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Unauthorized - Cloudflare Access authentication required' }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

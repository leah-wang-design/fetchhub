import type { Env } from './types';
import {
  handleGetScreenshots,
  handleCreateScreenshot,
  handleUpdateScreenshot,
  handleDeleteScreenshots,
  handleRestoreScreenshot,
  handleCleanupTrash,
  handleGetComments,
  handleCreateComment,
  handleDeleteComment,
  handleUpdateComment,
  handleToggleResolve,
  handleGetPageSessions,
  handleDeleteReply,
  handleCreateWorkspace,
  handleGetWorkspaces,
  handleGetWorkspace,
  handleUpdateWorkspace,
  handleDeleteWorkspace,
} from './api';
import { authenticateRequest, unauthorizedResponse } from './auth';
import { handleGetReplies, handleCreateReply } from './replies';
import { handleUpdateReply } from './api';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Cf-Access-Jwt-Assertion',
        },
      });
    }

    // Authenticate all API requests
    if (url.pathname.startsWith('/api/')) {
      const user = await authenticateRequest(request, env);
      if (!user) {
        return unauthorizedResponse();
      }
      // Store user in request context for handlers
      (request as any).user = user;
    }

    if (url.pathname === '/api/user' && request.method === 'GET') {
      const user = (request as any).user;
      return new Response(JSON.stringify({ 
        email: user.email,
        name: user.name,
        userId: user.userId
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (url.pathname === '/api/sessions' && request.method === 'GET') {
      return handleGetPageSessions(request, env);
    }

    if (url.pathname === '/api/workspaces' && request.method === 'GET') {
      return handleGetWorkspaces(request, env);
    }

    if (url.pathname === '/api/workspaces' && request.method === 'POST') {
      return handleCreateWorkspace(request, env);
    }

    const workspaceMatch = url.pathname.match(/^\/api\/workspaces\/([^/]+)$/);
    if (workspaceMatch && request.method === 'GET') {
      const workspaceId = workspaceMatch[1];
      return handleGetWorkspace(request, env, workspaceId);
    }

    if (workspaceMatch && request.method === 'PUT') {
      const workspaceId = workspaceMatch[1];
      return handleUpdateWorkspace(request, env, workspaceId);
    }

    if (workspaceMatch && request.method === 'DELETE') {
      const workspaceId = workspaceMatch[1];
      return handleDeleteWorkspace(request, env, workspaceId);
    }

    if (url.pathname === '/api/screenshots' && request.method === 'GET') {
      return handleGetScreenshots(request, env);
    }

    if (url.pathname === '/api/screenshots' && request.method === 'POST') {
      return handleCreateScreenshot(request, env);
    }

    if (url.pathname === '/api/screenshots' && request.method === 'DELETE') {
      return handleDeleteScreenshots(request, env);
    }

    const screenshotMatch = url.pathname.match(/^\/api\/screenshots\/([^/]+)$/);
    if (screenshotMatch && request.method === 'PUT') {
      const screenshotId = screenshotMatch[1];
      return handleUpdateScreenshot(request, env, screenshotId);
    }

    if (url.pathname === '/api/comments' && request.method === 'GET') {
      return handleGetComments(request, env);
    }

    if (url.pathname === '/api/comments' && request.method === 'POST') {
      return handleCreateComment(request, env);
    }

    const commentMatch = url.pathname.match(/^\/api\/comments\/([^/]+)$/);
    if (commentMatch && request.method === 'DELETE') {
      const commentId = commentMatch[1];
      return handleDeleteComment(request, env, commentId);
    }

    if (commentMatch && request.method === 'PUT') {
      const commentId = commentMatch[1];
      return handleUpdateComment(request, env, commentId);
    }

    const resolveMatch = url.pathname.match(/^\/api\/comments\/([^/]+)\/resolve$/);
    if (resolveMatch && request.method === 'PUT') {
      const commentId = resolveMatch[1];
      return handleToggleResolve(request, env, commentId);
    }

    const restoreMatch = url.pathname.match(/^\/api\/screenshots\/([^/]+)\/restore$/);
    if (restoreMatch && request.method === 'PUT') {
      const screenshotId = restoreMatch[1];
      return handleRestoreScreenshot(request, env, screenshotId);
    }

    if (url.pathname === '/api/trash/cleanup' && request.method === 'POST') {
      return handleCleanupTrash(request, env);
    }

    if (url.pathname === '/api/replies' && request.method === 'GET') {
      return handleGetReplies(request, env);
    }

    if (url.pathname === '/api/replies' && request.method === 'POST') {
      return handleCreateReply(request, env);
    }

    const replyMatch = url.pathname.match(/^\/api\/replies\/([^/]+)$/);
    if (replyMatch && request.method === 'PUT') {
      const replyId = replyMatch[1];
      return handleUpdateReply(request, env, replyId);
    }
    if (replyMatch && request.method === 'DELETE') {
      const replyId = replyMatch[1];
      return handleDeleteReply(request, env, replyId);
    }

    // Serve the SPA - return index.html for all non-API routes
    // This allows React Router to handle client-side routing
    if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/assets/')) {
      const indexRequest = new Request(new URL('/', url), request);
      return env.ASSETS.fetch(indexRequest);
    }

    return env.ASSETS.fetch(request);
  },
};

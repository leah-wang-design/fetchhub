import type { Env, Comment, Screenshot, CreateCommentRequest, CreateScreenshotRequest, UpdateCommentRequest, UpdateReplyRequest } from './types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function handleGetScreenshots(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pageUrl = url.searchParams.get('url');
  const workspaceId = url.searchParams.get('workspace');
  const showDeleted = url.searchParams.get('deleted') === 'true';

  try {
    let query = 'SELECT * FROM screenshots WHERE deleted_at IS NULL ORDER BY timestamp DESC';
    let bindings: any[] = [];
    
    if (showDeleted) {
      query = 'SELECT * FROM screenshots WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC';
      if (workspaceId) {
        query = 'SELECT * FROM screenshots WHERE deleted_at IS NOT NULL AND workspace_id = ? ORDER BY deleted_at DESC';
        bindings = [workspaceId];
      }
    } else if (pageUrl && workspaceId) {
      query = 'SELECT * FROM screenshots WHERE page_url = ? AND workspace_id = ? AND deleted_at IS NULL ORDER BY timestamp DESC';
      bindings = [pageUrl, workspaceId];
    } else if (pageUrl) {
      query = 'SELECT * FROM screenshots WHERE page_url = ? AND deleted_at IS NULL ORDER BY timestamp DESC';
      bindings = [pageUrl];
    } else if (workspaceId) {
      query = 'SELECT * FROM screenshots WHERE workspace_id = ? AND deleted_at IS NULL ORDER BY timestamp DESC';
      bindings = [workspaceId];
    }

    let stmt = env.DB.prepare(query);
    if (bindings.length > 0) {
      stmt = stmt.bind(...bindings);
    }

    const { results } = await stmt.all<Screenshot>();

    return new Response(JSON.stringify({ screenshots: results || [] }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch screenshots' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleDeleteScreenshots(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pageUrl = url.searchParams.get('url');
  const screenshotId = url.searchParams.get('id');
  const permanent = url.searchParams.get('permanent') === 'true';

  if (!pageUrl && !screenshotId) {
    return new Response(JSON.stringify({ error: 'URL or ID parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const deletedAt = Date.now();

    if (permanent) {
      // Permanent delete
      if (screenshotId) {
        await env.DB.prepare('DELETE FROM comments WHERE screenshot_id = ?').bind(screenshotId).run();
        await env.DB.prepare('DELETE FROM screenshots WHERE id = ?').bind(screenshotId).run();
      } else if (pageUrl) {
        const screenshotStmt = env.DB.prepare('SELECT id FROM screenshots WHERE page_url = ?').bind(pageUrl);
        const { results: screenshots } = await screenshotStmt.all<{ id: string }>();
        if (screenshots && screenshots.length > 0) {
          for (const s of screenshots) {
            await env.DB.prepare('DELETE FROM comments WHERE screenshot_id = ?').bind(s.id).run();
          }
          await env.DB.prepare('DELETE FROM screenshots WHERE page_url = ?').bind(pageUrl).run();
        }
      }
    } else {
      // Soft delete - move to trash
      if (screenshotId) {
        await env.DB.prepare('UPDATE screenshots SET deleted_at = ? WHERE id = ?').bind(deletedAt, screenshotId).run();
      } else if (pageUrl) {
        await env.DB.prepare('UPDATE screenshots SET deleted_at = ? WHERE page_url = ?').bind(deletedAt, pageUrl).run();
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error deleting screenshots:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete screenshots' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleCreateScreenshot(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as CreateScreenshotRequest;

    if (!body.page_url || !body.image_data || !body.created_by) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = generateId();
    const timestamp = Date.now();
    const user = (request as any).user;
    const workspaceId = body.workspace_id || 'default';

    await env.DB.prepare(
      'INSERT INTO screenshots (id, page_url, page_title, image_data, width, height, created_by, timestamp, user_id, workspace_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(id, body.page_url, body.page_title, body.image_data, body.width, body.height, body.created_by, timestamp, user?.userId, workspaceId)
      .run();

    const screenshot: Screenshot = {
      id,
      page_url: body.page_url,
      page_title: body.page_title,
      image_data: body.image_data,
      width: body.width,
      height: body.height,
      created_by: body.created_by,
      timestamp,
      workspace_id: workspaceId,
    };

    return new Response(JSON.stringify(screenshot), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error creating screenshot:', error);
    return new Response(JSON.stringify({ error: 'Failed to create screenshot' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleUpdateScreenshot(request: Request, env: Env, screenshotId: string): Promise<Response> {
  try {
    const body = await request.json() as { workspace_id: string };

    if (!body.workspace_id) {
      return new Response(JSON.stringify({ error: 'workspace_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Update screenshot workspace_id
    await env.DB.prepare(
      'UPDATE screenshots SET workspace_id = ? WHERE id = ?'
    ).bind(body.workspace_id, screenshotId).run();

    // Fetch updated screenshot
    const { results } = await env.DB.prepare(
      'SELECT * FROM screenshots WHERE id = ?'
    ).bind(screenshotId).all<Screenshot>();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Screenshot not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify(results[0]), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error updating screenshot:', error);
    return new Response(JSON.stringify({ error: 'Failed to update screenshot' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleGetComments(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const screenshotId = url.searchParams.get('screenshot_id');

  if (!screenshotId) {
    return new Response(JSON.stringify({ error: 'Missing screenshot_id parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM comments WHERE screenshot_id = ? ORDER BY timestamp DESC'
    )
      .bind(screenshotId)
      .all<Comment>();

    return new Response(JSON.stringify({ comments: results || [] }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch comments' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleCreateComment(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as CreateCommentRequest;

    if (!body.screenshot_id || !body.commenter_name || !body.comment_text) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = generateId();
    const timestamp = Date.now();
    const user = (request as any).user;

    await env.DB.prepare(
      'INSERT INTO comments (id, screenshot_id, x, y, width, height, commenter_name, comment_text, timestamp, resolved, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)'
    )
      .bind(id, body.screenshot_id, body.x, body.y, body.width, body.height, body.commenter_name, body.comment_text, timestamp, user?.userId)
      .run();

    const comment: Comment = {
      id,
      screenshot_id: body.screenshot_id,
      x: body.x,
      y: body.y,
      width: body.width,
      height: body.height,
      commenter_name: body.commenter_name,
      comment_text: body.comment_text,
      timestamp,
      resolved: 0,
    };

    return new Response(JSON.stringify(comment), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return new Response(JSON.stringify({ error: 'Failed to create comment' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleDeleteComment(request: Request, env: Env, commentId: string): Promise<Response> {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM comments WHERE id = ?')
      .bind(commentId)
      .all<Comment>();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Delete associated replies first (cascade delete)
    await env.DB.prepare('DELETE FROM replies WHERE comment_id = ?')
      .bind(commentId)
      .run();

    // Delete the comment
    await env.DB.prepare('DELETE FROM comments WHERE id = ?')
      .bind(commentId)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete comment' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleUpdateComment(request: Request, env: Env, commentId: string): Promise<Response> {
  try {
    const body = await request.json() as UpdateCommentRequest;

    if (!body.comment_text || !body.comment_text.trim()) {
      return new Response(JSON.stringify({ error: 'Comment text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { results } = await env.DB.prepare('SELECT * FROM comments WHERE id = ?')
      .bind(commentId)
      .all<Comment>();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    await env.DB.prepare('UPDATE comments SET comment_text = ? WHERE id = ?')
      .bind(body.comment_text.trim(), commentId)
      .run();

    const updatedComment = { ...results[0], comment_text: body.comment_text.trim() };

    return new Response(JSON.stringify(updatedComment), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return new Response(JSON.stringify({ error: 'Failed to update comment' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleToggleResolve(request: Request, env: Env, commentId: string): Promise<Response> {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM comments WHERE id = ?')
      .bind(commentId)
      .all<Comment>();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const currentResolved = results[0].resolved;
    const newResolved = currentResolved === 1 ? 0 : 1;

    await env.DB.prepare('UPDATE comments SET resolved = ? WHERE id = ?')
      .bind(newResolved, commentId)
      .run();

    const updatedComment = { ...results[0], resolved: newResolved };

    return new Response(JSON.stringify(updatedComment), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error toggling resolve:', error);
    return new Response(JSON.stringify({ error: 'Failed to toggle resolve status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleRestoreScreenshot(request: Request, env: Env, screenshotId: string): Promise<Response> {
  try {
    await env.DB.prepare('UPDATE screenshots SET deleted_at = NULL WHERE id = ?').bind(screenshotId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error restoring screenshot:', error);
    return new Response(JSON.stringify({ error: 'Failed to restore screenshot' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleUpdateReply(request: Request, env: Env, replyId: string): Promise<Response> {
  try {
    const body = await request.json() as UpdateReplyRequest;

    if (!body.reply_text || !body.reply_text.trim()) {
      return new Response(JSON.stringify({ error: 'Reply text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { results } = await env.DB.prepare('SELECT * FROM replies WHERE id = ?')
      .bind(replyId)
      .all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Reply not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    await env.DB.prepare('UPDATE replies SET reply_text = ? WHERE id = ?')
      .bind(body.reply_text.trim(), replyId)
      .run();

    const updatedReply = { ...results[0], reply_text: body.reply_text.trim() };

    return new Response(JSON.stringify(updatedReply), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error updating reply:', error);
    return new Response(JSON.stringify({ error: 'Failed to update reply' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleDeleteReply(request: Request, env: Env, replyId: string): Promise<Response> {
  try {
    const { results } = await env.DB.prepare('SELECT * FROM replies WHERE id = ?')
      .bind(replyId)
      .all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Reply not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    await env.DB.prepare('DELETE FROM replies WHERE id = ?')
      .bind(replyId)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete reply' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleCleanupTrash(request: Request, env: Env): Promise<Response> {
  try {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Get screenshots to permanently delete
    const screenshotStmt = env.DB.prepare('SELECT id FROM screenshots WHERE deleted_at IS NOT NULL AND deleted_at < ?').bind(thirtyDaysAgo);
    const { results: screenshots } = await screenshotStmt.all<{ id: string }>();

    if (screenshots && screenshots.length > 0) {
      for (const s of screenshots) {
        await env.DB.prepare('DELETE FROM comments WHERE screenshot_id = ?').bind(s.id).run();
      }
      await env.DB.prepare('DELETE FROM screenshots WHERE deleted_at IS NOT NULL AND deleted_at < ?').bind(thirtyDaysAgo).run();
    }

    return new Response(JSON.stringify({ success: true, deletedCount: screenshots?.length || 0 }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error cleaning up trash:', error);
    return new Response(JSON.stringify({ error: 'Failed to cleanup trash' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleGetPageSessions(request: Request, env: Env): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(
      `SELECT 
        page_url, 
        (SELECT page_title FROM screenshots s2 WHERE s2.page_url = screenshots.page_url AND s2.deleted_at IS NULL ORDER BY timestamp DESC LIMIT 1) as page_title,
        COUNT(*) as screenshot_count, 
        MAX(timestamp) as latest_timestamp 
       FROM screenshots 
       WHERE deleted_at IS NULL
       GROUP BY page_url 
       ORDER BY latest_timestamp DESC`
    ).all();

    return new Response(JSON.stringify({ sessions: results || [] }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching page sessions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch page sessions' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function handleCreateWorkspace(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as any;
    
    if (!body.name || !body.created_by) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const id = generateId();
    const now = Date.now();

    await env.DB.prepare(
      'INSERT INTO workspaces (id, name, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(id, body.name, body.created_by, now, now)
      .run();

    const workspace = {
      id,
      name: body.name,
      created_by: body.created_by,
      created_at: now,
      updated_at: now,
    };

    return new Response(JSON.stringify(workspace), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return new Response(JSON.stringify({ error: 'Failed to create workspace' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleGetWorkspaces(request: Request, env: Env): Promise<Response> {
  try {
    // Ensure default workspace exists
    await env.DB.prepare(`
      INSERT OR IGNORE INTO workspaces (id, name, created_by, created_at, updated_at)
      VALUES ('default', 'Default Workspace', 'system', unixepoch(), unixepoch())
    `).run();

    const { results } = await env.DB.prepare(
      'SELECT * FROM workspaces ORDER BY created_at DESC'
    ).all();

    return new Response(JSON.stringify({ workspaces: results || [] }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch workspaces' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleGetWorkspace(request: Request, env: Env, workspaceId: string): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM workspaces WHERE id = ?'
    ).bind(workspaceId).all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Workspace not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify(results[0]), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch workspace' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleUpdateWorkspace(request: Request, env: Env, workspaceId: string): Promise<Response> {
  try {
    const body = await request.json() as any;
    
    if (!body.name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const now = Date.now();

    await env.DB.prepare(
      'UPDATE workspaces SET name = ?, updated_at = ? WHERE id = ?'
    )
      .bind(body.name, now, workspaceId)
      .run();

    const { results } = await env.DB.prepare(
      'SELECT * FROM workspaces WHERE id = ?'
    ).bind(workspaceId).all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'Workspace not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify(results[0]), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return new Response(JSON.stringify({ error: 'Failed to update workspace' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleDeleteWorkspace(request: Request, env: Env, workspaceId: string): Promise<Response> {
  try {
    // Delete all screenshots in this workspace (which will cascade delete comments and replies)
    await env.DB.prepare(
      'DELETE FROM screenshots WHERE workspace_id = ?'
    ).bind(workspaceId).run();

    // Delete the workspace
    await env.DB.prepare(
      'DELETE FROM workspaces WHERE id = ?'
    ).bind(workspaceId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete workspace' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

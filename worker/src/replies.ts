import type { Env } from './types';

export interface Reply {
  id: string;
  comment_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  reply_text: string;
  created_at: number;
}

export interface CreateReplyRequest {
  comment_id: string;
  reply_text: string;
}

export async function handleGetReplies(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const commentId = url.searchParams.get('comment_id');

  if (!commentId) {
    return new Response(JSON.stringify({ error: 'comment_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const results = await env.DB.prepare(`
      SELECT 
        r.id,
        r.comment_id,
        r.user_id,
        r.reply_text,
        r.created_at,
        u.email as user_email,
        u.name as user_name
      FROM replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.comment_id = ?
      ORDER BY r.created_at ASC
    `)
      .bind(commentId)
      .all();

    const replies = results.results as unknown as Reply[];

    return new Response(JSON.stringify({ replies }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch replies' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

export async function handleCreateReply(request: Request, env: Env): Promise<Response> {
  const user = (request as any).user;
  
  try {
    const body = await request.json() as CreateReplyRequest;
    const { comment_id, reply_text } = body;

    if (!comment_id || !reply_text) {
      return new Response(JSON.stringify({ error: 'comment_id and reply_text are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Verify comment exists
    const comment = await env.DB.prepare('SELECT id FROM comments WHERE id = ?')
      .bind(comment_id)
      .first();

    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const replyId = crypto.randomUUID();
    const createdAt = Date.now();

    await env.DB.prepare(`
      INSERT INTO replies (id, comment_id, user_id, reply_text, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
      .bind(replyId, comment_id, user.userId, reply_text, createdAt)
      .run();

    const reply: Reply = {
      id: replyId,
      comment_id,
      user_id: user.userId,
      user_email: user.email,
      user_name: user.name,
      reply_text,
      created_at: createdAt,
    };

    return new Response(JSON.stringify(reply), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    return new Response(JSON.stringify({ error: 'Failed to create reply' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}

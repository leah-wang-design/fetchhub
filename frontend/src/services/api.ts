import type { Comment, Screenshot, CreateCommentRequest, CreateScreenshotRequest, PageSession, Reply, CreateReplyRequest, UpdateCommentRequest, UpdateReplyRequest, Workspace } from '../types';

const API_BASE = '/api';

export const api = {
  async getCurrentUser(): Promise<{ email: string; name: string; userId: string } | null> {
    try {
      const response = await fetch(`${API_BASE}/user`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      return null;
    }
  },

  async getPageSessions(): Promise<PageSession[]> {
    const response = await fetch(`${API_BASE}/sessions`);
    if (!response.ok) {
      throw new Error('Failed to fetch page sessions');
    }
    const data = await response.json();
    return data.sessions || [];
  },

  async getScreenshots(pageUrl?: string, workspaceId?: string): Promise<Screenshot[]> {
    const params = new URLSearchParams();
    if (pageUrl) params.append('url', pageUrl);
    if (workspaceId) params.append('workspace', workspaceId);
    
    const url = params.toString() 
      ? `${API_BASE}/screenshots?${params}`
      : `${API_BASE}/screenshots`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch screenshots');
    }
    const data = await response.json();
    return data.screenshots || [];
  },

  async createScreenshot(screenshot: CreateScreenshotRequest): Promise<Screenshot> {
    const response = await fetch(`${API_BASE}/screenshots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(screenshot),
    });
    if (!response.ok) {
      throw new Error('Failed to create screenshot');
    }
    return response.json();
  },

  async updateScreenshot(screenshotId: string, data: { workspace_id: string }): Promise<Screenshot> {
    const response = await fetch(`${API_BASE}/screenshots/${screenshotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update screenshot');
    }
    return response.json();
  },

  async getComments(screenshotId: string): Promise<Comment[]> {
    const response = await fetch(
      `${API_BASE}/comments?screenshot_id=${encodeURIComponent(screenshotId)}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    const data = await response.json();
    return data.comments || [];
  },

  async createComment(comment: CreateCommentRequest): Promise<Comment> {
    const response = await fetch(`${API_BASE}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    });
    if (!response.ok) throw new Error('Failed to create comment');
    return response.json();
  },

  async deleteComment(commentId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete comment');
    return response.json();
  },

  async updateComment(commentId: string, data: UpdateCommentRequest): Promise<Comment> {
    const response = await fetch(`${API_BASE}/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update comment');
    return response.json();
  },

  async toggleResolve(commentId: string): Promise<Comment> {
    const response = await fetch(`${API_BASE}/comments/${commentId}/resolve`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Failed to toggle resolve status');
    }
    return response.json();
  },

  async deleteScreenshot(screenshotId?: string, pageUrl?: string): Promise<void> {
    const params = new URLSearchParams();
    if (screenshotId) params.append('id', screenshotId);
    if (pageUrl) params.append('url', pageUrl);
    
    const response = await fetch(`${API_BASE}/screenshots?${params}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete screenshot');
    }
  },

  async restoreScreenshot(screenshotId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/screenshots/${screenshotId}/restore`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Failed to restore screenshot');
    }
  },

  async getDeletedScreenshots(): Promise<Screenshot[]> {
    const response = await fetch(`${API_BASE}/screenshots?deleted=true`);
    if (!response.ok) {
      throw new Error('Failed to fetch deleted screenshots');
    }
    const data = await response.json();
    return data.screenshots || [];
  },

  async cleanupTrash(): Promise<{ deletedCount: number }> {
    const response = await fetch(`${API_BASE}/trash/cleanup`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to cleanup trash');
    }
    return response.json();
  },

  async permanentlyDeleteScreenshot(screenshotId: string): Promise<void> {
    const params = new URLSearchParams();
    params.append('id', screenshotId);
    params.append('permanent', 'true');
    
    const response = await fetch(`${API_BASE}/screenshots?${params}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to permanently delete screenshot');
    }
  },

  async getReplies(commentId: string): Promise<Reply[]> {
    const response = await fetch(`${API_BASE}/replies?comment_id=${encodeURIComponent(commentId)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch replies');
    }
    const data = await response.json();
    return data.replies || [];
  },

  async createReply(data: CreateReplyRequest): Promise<Reply> {
    const response = await fetch(`${API_BASE}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create reply');
    return response.json();
  },

  async updateReply(replyId: string, data: UpdateReplyRequest): Promise<Reply> {
    const response = await fetch(`${API_BASE}/replies/${replyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update reply');
    return response.json();
  },

  async deleteReply(replyId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/replies/${replyId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete reply');
    return response.json();
  },

  async getWorkspaces(): Promise<Workspace[]> {
    const response = await fetch(`${API_BASE}/workspaces`);
    if (!response.ok) {
      throw new Error('Failed to fetch workspaces');
    }
    const data = await response.json();
    return data.workspaces || [];
  },

  async createWorkspace(name: string, created_by: string): Promise<Workspace> {
    const response = await fetch(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, created_by }),
    });
    if (!response.ok) throw new Error('Failed to create workspace');
    return response.json();
  },

  async updateWorkspace(id: string, name: string): Promise<Workspace> {
    const response = await fetch(`${API_BASE}/workspaces/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to update workspace');
    return response.json();
  },

  async deleteWorkspace(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/workspaces/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete workspace');
    return response.json();
  },
};

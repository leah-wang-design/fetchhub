export interface Comment {
  id: string;
  screenshot_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  commenter_name: string;
  comment_text: string;
  timestamp: number;
  resolved: number;
  user_id?: string;
  created_at?: string;
}

export interface Workspace {
  id: string;
  name: string;
  created_by: string;
  created_at: number;
  updated_at: number;
}

export interface Screenshot {
  id: string;
  page_url: string;
  page_title: string | null;
  image_data: string;
  width: number;
  height: number;
  created_by: string;
  timestamp: number;
  workspace_id: string;
  created_at?: string;
  deleted_at?: number;
}

export interface CreateCommentRequest {
  screenshot_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  commenter_name: string;
  comment_text: string;
}

export interface CreateScreenshotRequest {
  page_url: string;
  page_title: string | null;
  image_data: string;
  width: number;
  height: number;
  created_by: string;
}

export interface PageSession {
  page_url: string;
  page_title: string | null;
  screenshot_count: number;
  latest_timestamp: number;
  workspace_id?: string;
}

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

export interface UpdateReplyRequest {
  reply_text: string;
}

export interface UpdateCommentRequest {
  comment_text: string;
}

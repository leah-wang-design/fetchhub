import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, PencilLine, X, MessageSquare, Ellipsis, ChevronDown, Search, Plus } from 'lucide-react';
import type { Screenshot, Comment, Workspace } from '../types';
import { api } from '../services/api';
import { typography } from '../styles/typography';
import { buttonStyles } from '../styles/buttonStyles';
import { useModal } from '../hooks/useModal';

export default function WorkspaceDetailsPage() {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { confirm, alert, toast, ModalComponent } = useModal();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [screenshotComments, setScreenshotComments] = useState<Record<string, Comment[]>>({});
  const [pageSessions, setPageSessions] = useState<Array<{ page_url: string; page_title: string; screenshot_count: number; comment_count: number; latest_timestamp: number }>>([]);
  const [openPageMenuId, setOpenPageMenuId] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<{ page_url: string; page_title: string; screenshot_count: number; comment_count: number; latest_timestamp: number } | null>(null);
  const [moveToWorkspaceModalOpen, setMoveToWorkspaceModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string>('');
  const [isCreatingNewWorkspace, setIsCreatingNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isTargetWorkspaceDropdownOpen, setIsTargetWorkspaceDropdownOpen] = useState(false);
  const [workspaceSearchTerm, setWorkspaceSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [viewType, setViewType] = useState<'page' | 'screenshot' | 'comment'>('page');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWorkspaceData();
  }, [workspaceId]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openPageMenuId) {
        setOpenPageMenuId(null);
      }
    };

    if (openPageMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openPageMenuId]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (isViewDropdownOpen) {
        setIsViewDropdownOpen(false);
      }
    };

    if (isViewDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isViewDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openCommentMenuId) {
        setOpenCommentMenuId(null);
      }
    };

    if (openCommentMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openCommentMenuId]);

  const loadWorkspaceData = async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);
      
      // Load workspace details and all workspaces
      const allWorkspaces = await api.getWorkspaces();
      setWorkspaces(allWorkspaces);
      const currentWorkspace = allWorkspaces.find(w => w.id === workspaceId);
      setWorkspace(currentWorkspace || null);

      if (currentWorkspace) {
        document.title = `${currentWorkspace.name} - Fetch Hub`;
      }

      // Load all screenshots for this workspace
      const allScreenshots = await api.getScreenshots(undefined, workspaceId);
      setScreenshots(allScreenshots);

      // Load comments for each screenshot
      const commentsMap: Record<string, Comment[]> = {};
      for (const screenshot of allScreenshots) {
        try {
          const comments = await api.getComments(screenshot.id);
          commentsMap[screenshot.id] = comments;
        } catch (error) {
          console.error(`Failed to load comments for screenshot ${screenshot.id}:`, error);
          commentsMap[screenshot.id] = [];
        }
      }
      setScreenshotComments(commentsMap);

      // Group screenshots by page_url
      const sessionMap = new Map<string, { page_url: string; page_title: string; screenshot_count: number; comment_count: number; latest_timestamp: number }>();
      for (const screenshot of allScreenshots) {
        const comments = commentsMap[screenshot.id] || [];
        const existing = sessionMap.get(screenshot.page_url);
        if (existing) {
          existing.screenshot_count++;
          existing.comment_count += comments.length;
          if (screenshot.timestamp > existing.latest_timestamp) {
            existing.latest_timestamp = screenshot.timestamp;
            existing.page_title = screenshot.page_title || screenshot.page_url;
          }
        } else {
          sessionMap.set(screenshot.page_url, {
            page_url: screenshot.page_url,
            page_title: screenshot.page_title || screenshot.page_url,
            screenshot_count: 1,
            comment_count: comments.length,
            latest_timestamp: screenshot.timestamp,
          });
        }
      }
      
      const sessions = Array.from(sessionMap.values());
      sessions.sort((a, b) => b.latest_timestamp - a.latest_timestamp);
      setPageSessions(sessions);
    } catch (error) {
      console.error('Failed to load workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleEditWorkspace = () => {
    if (!workspace) return;
    setWorkspaceName(workspace.name);
    setIsEditModalOpen(true);
  };

  const handleUpdateWorkspace = async () => {
    if (!workspace || !workspaceName.trim()) {
      await alert('Please enter a workspace name.');
      return;
    }

    try {
      const updated = await api.updateWorkspace(workspace.id, workspaceName.trim());
      setWorkspace(updated);
      setWorkspaceName('');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update workspace:', error);
      await alert('Failed to update workspace.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400">Loading workspace...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Workspace not found</p>
        <button
          onClick={() => navigate('/workspaces')}
          className={buttonStyles.primary}
        >
          Back to All workspaces
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-cream dark:bg-gray-900">
        <div className="bg-cream dark:bg-gray-900 dark:border-gray-700 px-8 py-4 ">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/workspaces')}
                className={`flex items-center gap-2 ${buttonStyles.navTabInactive}`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Workspaces
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-stone-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className={typography.h4}>{workspace.name}</h3>
                  {workspace.id !== 'default' && (
                    <button
                      onClick={handleEditWorkspace}
                      className="p-1 text-gray-500 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <PencilLine className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsViewDropdownOpen(!isViewDropdownOpen);
                    }}
                    className={`flex items-center gap-1 pl-2 pr-1 py-1 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors ${
                      isViewDropdownOpen ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>{viewType === 'page' ? 'By page' : viewType === 'screenshot' ? 'By screenshot' : 'By comment'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {isViewDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsViewDropdownOpen(false)}
                      />
                      <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[140px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewType('page');
                            setIsViewDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            viewType === 'page' 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          By page
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewType('screenshot');
                            setIsViewDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            viewType === 'screenshot' 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          By screenshot
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewType('comment');
                            setIsViewDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors rounded-b-lg ${
                            viewType === 'comment' 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          By comment
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={viewType === 'comment' ? 'Search by page name, URL, or username...' : 'Search page names or URLs...'}
                    className="w-full pl-8 pr-3 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
              ) : viewType === 'page' ? (
                pageSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className={typography.bodySmall}>No screenshots yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
              {pageSessions.filter(session => {
                if (!searchTerm) return true;
                const term = searchTerm.toLowerCase();
                return (
                  session.page_url.toLowerCase().includes(term) ||
                  (session.page_title && session.page_title.toLowerCase().includes(term))
                );
              }).map((session) => (
                <button
                  key={session.page_url}
                  onClick={() => navigate(`/gallery?url=${encodeURIComponent(session.page_url)}&workspace=${workspaceId}&from=workspace`)}
                  className="w-full text-left p-4 bg-stone-50 dark:bg-gray-750 rounded-lg hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className={`${typography.label} truncate mb-1`}>
                        {session.page_title || session.page_url}
                      </h4>
                      <p className={`${typography.bodyTiny} text-gray-400 dark:text-gray-400 truncate mb-2`}>
                        {session.page_url}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {session.screenshot_count} {session.screenshot_count === 1 ? 'screenshot' : 'screenshots'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {session.comment_count} {session.comment_count === 1 ? 'comment' : 'comments'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`${typography.bodyTiny} text-gray-500 dark:text-gray-400`}>
                        {formatTimeAgo(session.latest_timestamp)}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenPageMenuId(openPageMenuId === session.page_url ? null : session.page_url);
                          }}
                          className={`p-1 hover:bg-stone-200 dark:hover:bg-gray-600 rounded transition-colors ${
                            openPageMenuId === session.page_url ? 'bg-stone-200 dark:bg-gray-600' : ''
                          }`}
                        >
                          <Ellipsis className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        {openPageMenuId === session.page_url && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenPageMenuId(null);
                                navigate(`/gallery?url=${encodeURIComponent(session.page_url)}&workspace=${workspaceId}&from=workspace`);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              View page
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenPageMenuId(null);
                                setSelectedSession(session);
                                setMoveToWorkspaceModalOpen(true);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              Move page
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                setOpenPageMenuId(null);
                                const confirmed = await confirm('Are you sure you want to delete this page?', 'All screenshots and comments will be moved to trash and can be restored within 30 days.', 'Move to trash', 'primary');
                                if (confirmed) {
                                  try {
                                    const pageScreenshots = await api.getScreenshots(session.page_url, workspaceId);
                                    for (const screenshot of pageScreenshots) {
                                      await api.deleteScreenshot(screenshot.id);
                                    }
                                    await loadWorkspaceData();
                                  } catch (error) {
                                    console.error('Failed to move screenshots to trash:', error);
                                    await alert('Failed to move screenshots to trash. Please try again.');
                                  }
                                }
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              Delete page
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
                </div>
              )
            ) : viewType === 'screenshot' ? (
              screenshots.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className={typography.bodySmall}>No screenshots yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {screenshots.filter(screenshot => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return (
                      screenshot.page_url.toLowerCase().includes(term) ||
                      (screenshot.page_title && screenshot.page_title.toLowerCase().includes(term))
                    );
                  }).map((screenshot) => {
                    const comments = screenshotComments[screenshot.id] || [];
                    return (
                      <div key={screenshot.id} className="relative">
                        <button
                          onClick={() => navigate(`/gallery?url=${encodeURIComponent(screenshot.page_url)}&workspace=${workspaceId}&screenshotId=${screenshot.id}&from=workspace`)}
                          className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:shadow-lg text-left overflow-visible"
                        >
                          <div className="aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden rounded-t-lg">
                            <img
                              src={screenshot.image_data}
                              alt={screenshot.page_title || 'Screenshot'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className={`${typography.h5} mb-2 truncate`}>
                                  {screenshot.page_title || 'Screenshot'}
                                </h3>
                              </div>
                              <div className="relative flex-shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenPageMenuId(openPageMenuId === screenshot.id ? null : screenshot.id);
                                  }}
                                  className={`p-1 hover:bg-stone-200 dark:hover:bg-gray-600 rounded transition-colors ${
                                    openPageMenuId === screenshot.id ? 'bg-stone-200 dark:bg-gray-600' : ''
                                  }`}
                                >
                                  <Ellipsis className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                </button>
                                {openPageMenuId === screenshot.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenPageMenuId(null);
                                        navigate(`/gallery?url=${encodeURIComponent(screenshot.page_url)}&workspace=${workspaceId}&screenshotId=${screenshot.id}&from=workspace`);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      View screenshot
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        setOpenPageMenuId(null);
                                        const confirmed = await confirm(
                                          'Are you sure you want to delete this screenshot?',
                                          'The screenshot and all its comments will be moved to trash and can be restored within 30 days.',
                                          'Move to trash',
                                          'primary'
                                        );
                                        if (confirmed) {
                                          try {
                                            await api.deleteScreenshot(screenshot.id);
                                            await loadWorkspaceData();
                                          } catch (error) {
                                            console.error('Failed to delete screenshot:', error);
                                            await alert('Failed to delete screenshot. Please try again.');
                                          }
                                        }
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      Delete screenshot
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className={`${typography.bodySmall} text-gray-600 dark:text-gray-400 truncate mb-2`}>
                              {screenshot.page_url}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className={`${typography.bodySmall} text-gray-500 dark:text-gray-400`}>
                                {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                              </span>
                              <span className={`${typography.bodyTiny} text-gray-500 dark:text-gray-400`}>
                                {formatTimeAgo(screenshot.timestamp)}
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              Object.values(screenshotComments).flat().length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className={typography.bodySmall}>No comments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {screenshots.flatMap(screenshot => {
                    const comments = screenshotComments[screenshot.id] || [];
                    return comments.map(comment => ({
                      ...comment,
                      screenshot
                    }));
                  }).filter(comment => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return (
                      comment.comment_text.toLowerCase().includes(term) ||
                      comment.screenshot.page_url.toLowerCase().includes(term) ||
                      (comment.screenshot.page_title && comment.screenshot.page_title.toLowerCase().includes(term)) ||
                      comment.commenter_name.toLowerCase().includes(term)
                    );
                  }).sort((a, b) => b.timestamp - a.timestamp).map((comment) => (
                    <button
                      key={comment.id}
                      onClick={() => navigate(`/gallery?url=${encodeURIComponent(comment.screenshot.page_url)}&workspace=${workspaceId}&screenshotId=${comment.screenshot.id}&commentId=${comment.id}&from=workspace`)}
                      className="w-full text-left p-4 bg-stone-50 dark:bg-gray-750 rounded-lg hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <img
                          src={comment.screenshot.image_data}
                          alt="Screenshot"
                          className="w-16 h-12 object-cover rounded border border-gray-200 dark:border-gray-700 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={`${typography.label} truncate mb-1`}>
                            {comment.screenshot.page_title || 'Screenshot'}
                          </h4>
                          <p className={`${typography.bodyTiny} text-gray-500 dark:text-gray-400`}>
                            @{comment.commenter_name}
                          </p>
                          <p className={`${typography.bodyTiny} line-clamp-2`}>
                            {comment.comment_text}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`${typography.bodyTiny} text-gray-500 dark:text-gray-400`}>
                            {formatTimeAgo(comment.timestamp)}
                          </span>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id);
                              }}
                              className={`p-1 hover:bg-stone-200 dark:hover:bg-gray-600 rounded transition-colors ${
                                openCommentMenuId === comment.id ? 'bg-stone-200 dark:bg-gray-600' : ''
                              }`}
                            >
                              <Ellipsis className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                            {openCommentMenuId === comment.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenCommentMenuId(null);
                                    navigate(`/gallery?url=${encodeURIComponent(comment.screenshot.page_url)}&workspace=${workspaceId}&screenshotId=${comment.screenshot.id}&commentId=${comment.id}&from=workspace`);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  View comment
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setOpenCommentMenuId(null);
                                    
                                    // Check if this is the last comment for the screenshot
                                    const allComments = await api.getComments(comment.screenshot.id);
                                    const isLastComment = allComments.length === 1;
                                    
                                    const confirmed = isLastComment
                                      ? await confirm(
                                          'Are you sure you want to delete?',
                                          'This is the only feedback remaining for this screenshot. If you delete it, the screenshot will be permanently removed as well.',
                                          'Delete',
                                          'danger'
                                        )
                                      : await confirm(
                                          'Are you sure you want to delete this comment?',
                                          'This will also delete all replies and cannot be undone.',
                                          'Delete',
                                          'danger'
                                        );
                                    
                                    if (!confirmed) return;
                                    
                                    try {
                                      await api.deleteComment(comment.id);
                                      
                                      // If this was the last comment, also delete the screenshot
                                      if (isLastComment) {
                                        await api.deleteScreenshot(comment.screenshot.id);
                                      }
                                      
                                      await loadWorkspaceData();
                                    } catch (error) {
                                      console.error('Failed to delete comment:', error);
                                      await alert('Failed to delete comment. Please try again.');
                                    }
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  Delete comment
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            )}
            </div>
          </div>
        </div>
      </div>

      <ModalComponent />

      {/* Move to Workspace Modal */}
      {moveToWorkspaceModalOpen && selectedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setMoveToWorkspaceModalOpen(false);
            setSelectedSession(null);
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[480px] max-w-[90vw] p-6 animate-fadeIn relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setMoveToWorkspaceModalOpen(false);
                setSelectedSession(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
              title="Exit"
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>

            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white pr-8" style={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'" }}>
              Move to workspace
            </h3>
            <p className={`${typography.bodySmall} text-gray-600 dark:text-gray-400 mb-4`}>
              Move the selected page from {workspace?.name} to another workspace.
            </p>

            {!isCreatingNewWorkspace ? (
              <div className="mb-4 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={workspaceSearchTerm || (targetWorkspaceId ? workspaces.find(w => w.id === targetWorkspaceId)?.name || '' : '')}
                    onChange={(e) => {
                      setWorkspaceSearchTerm(e.target.value);
                      setIsTargetWorkspaceDropdownOpen(true);
                    }}
                    onFocus={() => setIsTargetWorkspaceDropdownOpen(true)}
                    onClick={() => setIsTargetWorkspaceDropdownOpen(true)}
                    placeholder="Select a workspace..."
                    className="w-full px-3 py-2 pr-8 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
                {isTargetWorkspaceDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsTargetWorkspaceDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          setIsCreatingNewWorkspace(true);
                          setTargetWorkspaceId('');
                          setWorkspaceSearchTerm('');
                          setIsTargetWorkspaceDropdownOpen(false);
                        }}
                        className="w-full text-left px-2 py-2 text-sm text-blue-500 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Create new workspace
                      </button>
                      {workspaces.filter(w => {
                        if (w.id === workspaceId) return false;
                        if (!workspaceSearchTerm) return true;
                        return w.name.toLowerCase().includes(workspaceSearchTerm.toLowerCase());
                      }).length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-400 text-center">
                          No workspaces found
                        </div>
                      ) : (
                        workspaces.filter(w => {
                          if (w.id === workspaceId) return false;
                          if (!workspaceSearchTerm) return true;
                          return w.name.toLowerCase().includes(workspaceSearchTerm.toLowerCase());
                        }).map(ws => (
                          <button
                            key={ws.id}
                            onClick={() => {
                              setTargetWorkspaceId(ws.id);
                              setWorkspaceSearchTerm('');
                              setIsTargetWorkspaceDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              targetWorkspaceId === ws.id
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {ws.name}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="mb-4">
                <label className={`${typography.bodySmall} text-gray-700 dark:text-gray-300 mb-1 block`}>
                  New workspace name
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Enter workspace name"
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsCreatingNewWorkspace(false);
                    setNewWorkspaceName('');
                  }}
                  className={`${typography.bodySmall} text-blue-500 dark:text-blue-400 hover:underline mt-2 flex items-center gap-1`}
                >
                  <ArrowLeft className="w-3 h-3" />
                  Select an existing workspace
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setMoveToWorkspaceModalOpen(false);
                  setSelectedSession(null);
                  setTargetWorkspaceId('');
                  setIsCreatingNewWorkspace(false);
                  setNewWorkspaceName('');
                }}
                className={buttonStyles.tertiarySmall}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    let destWorkspaceId = targetWorkspaceId;
                    let destWorkspaceName = '';
                    
                    // Create new workspace if needed
                    if (isCreatingNewWorkspace) {
                      if (!newWorkspaceName.trim()) {
                        await alert('Please enter a workspace name.');
                        return;
                      }
                      console.log('Creating new workspace:', newWorkspaceName.trim());
                      const user = await api.getCurrentUser();
                      const newWorkspace = await api.createWorkspace(newWorkspaceName.trim(), user?.email || 'unknown');
                      destWorkspaceId = newWorkspace.id;
                      destWorkspaceName = newWorkspace.name;
                      console.log('Created workspace:', newWorkspace);
                    } else if (!destWorkspaceId) {
                      await alert('Please select a workspace.');
                      return;
                    } else {
                      destWorkspaceName = workspaces.find(w => w.id === destWorkspaceId)?.name || 'workspace';
                    }
                    
                    // Get all screenshots for this page in current workspace
                    console.log('Fetching screenshots for page:', selectedSession.page_url, 'in workspace:', workspaceId);
                    const pageScreenshots = await api.getScreenshots(selectedSession.page_url, workspaceId);
                    console.log('Found screenshots:', pageScreenshots.length);
                    
                    if (pageScreenshots.length === 0) {
                      await alert('No screenshots found to move.');
                      return;
                    }
                    
                    // Update each screenshot to new workspace
                    console.log('Moving screenshots to workspace:', destWorkspaceId);
                    for (const screenshot of pageScreenshots) {
                      console.log('Updating screenshot:', screenshot.id);
                      await api.updateScreenshot(screenshot.id, { workspace_id: destWorkspaceId });
                    }
                    console.log('All screenshots moved successfully');
                    
                    // Show success message immediately
                    toast(`Successfully moved page to ${destWorkspaceName}.`, 'success');
                    
                    setMoveToWorkspaceModalOpen(false);
                    setSelectedSession(null);
                    setTargetWorkspaceId('');
                    setIsCreatingNewWorkspace(false);
                    setNewWorkspaceName('');
                    await loadWorkspaceData();
                  } catch (error) {
                    console.error('Detailed error moving screenshots:', error);
                    console.error('Error details:', {
                      message: error instanceof Error ? error.message : 'Unknown error',
                      stack: error instanceof Error ? error.stack : undefined
                    });
                    await alert(`Failed to move screenshots: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  }
                }}
                className={(isCreatingNewWorkspace ? !newWorkspaceName.trim() : !targetWorkspaceId) 
                  ? buttonStyles.primarySmallDisabled
                  : buttonStyles.primarySmall}
                disabled={isCreatingNewWorkspace ? !newWorkspaceName.trim() : !targetWorkspaceId}
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Workspace Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setIsEditModalOpen(false);
            setWorkspaceName('');
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[480px] max-w-[90vw] p-6 animate-fadeIn relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setWorkspaceName('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
              title="Exit"
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>

            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white pr-8" style={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'" }}>Edit workspace</h3>
            
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateWorkspace();
                if (e.key === 'Escape') {
                  setIsEditModalOpen(false);
                  setWorkspaceName('');
                }
              }}
              placeholder="Workspace name"
              className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-black dark:text-white"
              autoFocus
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setWorkspaceName('');
                }}
                className={buttonStyles.tertiarySmall}
              >
                Cancel
              </button>
              <button onClick={handleUpdateWorkspace} className={buttonStyles.primarySmall}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

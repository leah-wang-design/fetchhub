import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, ChevronDown, Clock, Image as ImageIcon, Ellipsis, ArrowLeft, X, Search, Plus } from 'lucide-react';
import type { Screenshot, Comment, PageSession, Workspace } from '../types';
import { api } from '../services/api';
import NavBar from '../components/NavBar';
import { typography } from '../styles/typography';
import { buttonStyles } from '../styles/buttonStyles';
import { useModal } from '../hooks/useModal';

export default function AllReviews() {
  const navigate = useNavigate();
  const { confirm, alert, toast, ModalComponent } = useModal();
  const [sessions, setSessions] = useState<PageSession[]>([]);
  const [recentComments, setRecentComments] = useState<Array<Comment & { screenshot: Screenshot }>>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'page' | 'date'>('page');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceMap, setWorkspaceMap] = useState<Record<string, Workspace>>({});
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [moveToWorkspaceModalOpen, setMoveToWorkspaceModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<PageSession | null>(null);
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string>('');
  const [isCreatingNewWorkspace, setIsCreatingNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isTargetWorkspaceDropdownOpen, setIsTargetWorkspaceDropdownOpen] = useState(false);
  const [workspaceSearchTerm, setWorkspaceSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadWorkspaces();
    loadSessions();
    loadRecentComments();
  }, []);

  useEffect(() => {
    loadSessions();
    loadRecentComments();
  }, [selectedWorkspaceId]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openSessionMenuId) {
        setOpenSessionMenuId(null);
      }
      if (openCommentMenuId) {
        setOpenCommentMenuId(null);
      }
    };

    if (openSessionMenuId || openCommentMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openSessionMenuId, openCommentMenuId]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (isTargetWorkspaceDropdownOpen) {
        setIsTargetWorkspaceDropdownOpen(false);
      }
    };

    if (isTargetWorkspaceDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isTargetWorkspaceDropdownOpen]);

  const loadWorkspaces = async () => {
    try {
      const data = await api.getWorkspaces();
      setWorkspaces(data);
      const map: Record<string, Workspace> = {};
      data.forEach(w => {
        map[w.id] = w;
      });
      setWorkspaceMap(map);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  };

  const loadSessions = async () => {
    try {
      // Get all screenshots filtered by workspace
      const screenshots = await api.getScreenshots(undefined, selectedWorkspaceId || undefined);
      
      // Group by page_url to create sessions
      const sessionMap = new Map<string, PageSession>();
      for (const screenshot of screenshots) {
        const existing = sessionMap.get(screenshot.page_url);
        if (existing) {
          existing.screenshot_count++;
          if (screenshot.timestamp > existing.latest_timestamp) {
            existing.latest_timestamp = screenshot.timestamp;
            existing.page_title = screenshot.page_title;
            existing.workspace_id = screenshot.workspace_id;
          }
        } else {
          sessionMap.set(screenshot.page_url, {
            page_url: screenshot.page_url,
            page_title: screenshot.page_title,
            screenshot_count: 1,
            latest_timestamp: screenshot.timestamp,
            workspace_id: screenshot.workspace_id,
          });
        }
      }
      
      const sessions = Array.from(sessionMap.values());
      sessions.sort((a, b) => b.latest_timestamp - a.latest_timestamp);
      setSessions(sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };


  const loadRecentComments = async () => {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const screenshots = await api.getScreenshots(undefined, selectedWorkspaceId || undefined);
      
      const allComments: Array<Comment & { screenshot: Screenshot }> = [];
      
      for (const screenshot of screenshots) {
        const comments = await api.getComments(screenshot.id);
        const recentComments = comments.filter(c => c.timestamp >= thirtyDaysAgo);
        allComments.push(...recentComments.map(c => ({ ...c, screenshot })));
      }
      
      allComments.sort((a, b) => b.timestamp - a.timestamp);
      setRecentComments(allComments);
    } catch (error) {
      console.error('Failed to load recent comments:', error);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="flex flex-col h-full bg-cream dark:bg-gray-900">
      <ModalComponent />
      <NavBar />
      <div className="flex-1 bg-cream dark:bg-gray-900 px-8 py-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-stone-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className={`${typography.h4}`}>
                Reviews from past 30 days
              </h3>
              <div className="relative">
                <button
                  onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                  className={`flex items-center gap-1 pl-2 pr-1 py-1 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors ${
                    isWorkspaceDropdownOpen ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{selectedWorkspaceId && workspaceMap[selectedWorkspaceId] ? workspaceMap[selectedWorkspaceId].name : 'All workspaces'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {isWorkspaceDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsWorkspaceDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[160px]">
                      <button
                        onClick={() => {
                          setSelectedWorkspaceId(null);
                          setIsWorkspaceDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          !selectedWorkspaceId
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        All workspaces
                      </button>
                      {workspaces.map(workspace => (
                        <button
                          key={workspace.id}
                          onClick={() => {
                            setSelectedWorkspaceId(workspace.id);
                            setIsWorkspaceDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            selectedWorkspaceId === workspace.id
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium' 
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {workspace.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="relative">
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={`flex items-center gap-1 pl-2 pr-1 py-1 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors ${
                    isFilterDropdownOpen ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{viewType === 'page' ? 'By page' : 'By comment'}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {isFilterDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsFilterDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[120px]">
                      <button
                        onClick={() => {
                          setViewType('page');
                          setIsFilterDropdownOpen(false);
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
                        onClick={() => {
                          setViewType('date');
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors rounded-b-lg ${
                          viewType === 'date' 
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
                  placeholder={viewType === 'date' ? 'Search by page name, URL, or username...' : 'Search page names or URLs...'}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
            ) : viewType === 'page' ? (
              sessions.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className={typography.bodySmall}>No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.filter(session => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return (
                      session.page_url.toLowerCase().includes(term) ||
                      (session.page_title && session.page_title.toLowerCase().includes(term))
                    );
                  }).map((session) => (
                    <button
                      key={session.page_url}
                      onClick={() => {
                        const workspaceParam = session.workspace_id || 'default';
                        navigate(`/gallery?url=${encodeURIComponent(session.page_url)}&workspace=${workspaceParam}&from=reviews`);
                      }}
                      className="w-full text-left p-4 bg-stone-50 dark:bg-gray-750 rounded-lg hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-5">
                        <div className="flex-1 min-w-0">
                          <h4 className={`${typography.label} truncate`}>
                            {session.page_title || session.page_url}
                          </h4>
                          <p className={`${typography.bodyTiny} text-gray-400 dark:text-gray-400 truncate`}>
                            {session.page_url}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {session.workspace_id && workspaceMap[session.workspace_id] && (
                            <span className={`${typography.bodyTiny} text-gray-500 dark:text-gray-400`}>
                              {workspaceMap[session.workspace_id].name}
                            </span>
                          )}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenSessionMenuId(openSessionMenuId === session.page_url ? null : session.page_url);
                              }}
                              className={`p-1 hover:bg-stone-200 dark:hover:bg-gray-600 rounded transition-colors ${
                                openSessionMenuId === session.page_url ? 'bg-stone-200 dark:bg-gray-600' : ''
                              }`}
                            >
                              <Ellipsis className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                            {openSessionMenuId === session.page_url && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenSessionMenuId(null);
                                    const workspaceParam = session.workspace_id || 'default';
                                    navigate(`/gallery?url=${encodeURIComponent(session.page_url)}&workspace=${workspaceParam}&from=reviews`);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  View page
                                </button>
                                {session.workspace_id && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenSessionMenuId(null);
                                        navigate(`/workspaces/${session.workspace_id}`);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      View workspace
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenSessionMenuId(null);
                                        setSelectedSession(session);
                                        setMoveToWorkspaceModalOpen(true);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      Move page
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setOpenSessionMenuId(null);
                                    const confirmed = await confirm('Are you sure you want to delete this page?', 'All screenshots and comments will be moved to trash and can be restored within 30 days.', 'Move to trash', 'primary');
                                    if (confirmed) {
                                      try {
                                        const screenshots = await api.getScreenshots(session.page_url, session.workspace_id);
                                        for (const screenshot of screenshots) {
                                          await api.deleteScreenshot(screenshot.id);
                                        }
                                        await loadSessions();
                                        await loadRecentComments();
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
                      <div className={`flex items-center gap-3 ${typography.bodyExtraSmall} mt-1`}>
                        <div className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          <span>{session.screenshot_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(session.latest_timestamp)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : (
              recentComments.filter(comment => {
                if (!searchTerm) return true;
                const term = searchTerm.toLowerCase();
                return (
                  comment.comment_text.toLowerCase().includes(term) ||
                  comment.screenshot.page_url.toLowerCase().includes(term) ||
                  (comment.screenshot.page_title && comment.screenshot.page_title.toLowerCase().includes(term)) ||
                  comment.commenter_name.toLowerCase().includes(term)
                );
              }).length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className={typography.bodySmall}>No recent comments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentComments.filter(comment => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return (
                      comment.comment_text.toLowerCase().includes(term) ||
                      comment.screenshot.page_url.toLowerCase().includes(term) ||
                      (comment.screenshot.page_title && comment.screenshot.page_title.toLowerCase().includes(term)) ||
                      comment.commenter_name.toLowerCase().includes(term)
                    );
                  }).map((comment) => (
                    <button
                      key={comment.id}
                      onClick={() => {
                        const workspaceParam = comment.screenshot.workspace_id || 'default';
                        navigate(`/gallery?url=${encodeURIComponent(comment.screenshot.page_url)}&workspace=${workspaceParam}&from=reviews`);
                      }}
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
                          {comment.screenshot.workspace_id && workspaceMap[comment.screenshot.workspace_id] && (
                            <span className={`${typography.bodyTiny} text-gray-500 dark:text-gray-400`}>
                              {workspaceMap[comment.screenshot.workspace_id].name}
                            </span>
                          )}
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
                                    const workspaceParam = comment.screenshot.workspace_id || 'default';
                                    navigate(`/gallery?url=${encodeURIComponent(comment.screenshot.page_url)}&workspace=${workspaceParam}&screenshotId=${comment.screenshot.id}&from=reviews`);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  View comment
                                </button>
                                {comment.screenshot.workspace_id && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenCommentMenuId(null);
                                        navigate(`/workspaces/${comment.screenshot.workspace_id}`);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                      View workspace
                                    </button>
                                    
                                  </>
                                )}
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
                                      
                                      await loadRecentComments();
                                      await loadSessions();
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

      {/* Move to Workspace Modal */}
      {moveToWorkspaceModalOpen && selectedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setMoveToWorkspaceModalOpen(false);
            setSelectedSession(null);
            setTargetWorkspaceId('');
            setIsCreatingNewWorkspace(false);
            setNewWorkspaceName('');
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
                setTargetWorkspaceId('');
                setIsCreatingNewWorkspace(false);
                setNewWorkspaceName('');
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
              Move the selected page from {selectedWorkspaceId && workspaceMap[selectedWorkspaceId] ? workspaceMap[selectedWorkspaceId].name : 'current workspace'} to another workspace.
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
                        if (w.id === selectedWorkspaceId) return false;
                        if (!workspaceSearchTerm) return true;
                        return w.name.toLowerCase().includes(workspaceSearchTerm.toLowerCase());
                      }).length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-400 text-center">
                          No workspaces found
                        </div>
                      ) : (
                        workspaces.filter(w => {
                          if (w.id === selectedWorkspaceId) return false;
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
                  Back to select workspace
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
                      const user = await api.getCurrentUser();
                      const newWorkspace = await api.createWorkspace(newWorkspaceName.trim(), user?.email || 'unknown');
                      destWorkspaceId = newWorkspace.id;
                      destWorkspaceName = newWorkspace.name;
                    } else if (!destWorkspaceId) {
                      await alert('Please select a workspace.');
                      return;
                    } else {
                      destWorkspaceName = workspaces.find(w => w.id === destWorkspaceId)?.name || 'workspace';
                    }
                    
                    // Get all screenshots for this page in current workspace
                    const pageScreenshots = await api.getScreenshots(selectedSession.page_url, selectedWorkspaceId || undefined);
                    
                    if (pageScreenshots.length === 0) {
                      await alert('No screenshots found to move.');
                      return;
                    }
                    
                    // Update each screenshot to new workspace
                    for (const screenshot of pageScreenshots) {
                      await api.updateScreenshot(screenshot.id, { workspace_id: destWorkspaceId });
                    }
                    
                    // Show success message immediately
                    toast(`Successfully moved page to ${destWorkspaceName}.`, 'success');
                    
                    setMoveToWorkspaceModalOpen(false);
                    setSelectedSession(null);
                    setTargetWorkspaceId('');
                    setIsCreatingNewWorkspace(false);
                    setNewWorkspaceName('');
                    await loadSessions();
                    await loadRecentComments();
                  } catch (error) {
                    console.error('Failed to move screenshots:', error);
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
    </div>
  );
}

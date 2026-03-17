import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Image as ImageIcon, MessageSquare, Trash2, Ellipsis, CheckCircle, Heart, Undo2, RotateCcw, ChevronDown, ChevronUp, Reply, Folder, X, Plus } from 'lucide-react';
import html2canvas from 'html2canvas';
import type { Screenshot, Comment, Reply as ReplyType, Workspace } from '../types';
import { api } from '../services/api';
import { typography } from '../styles/typography';
import { buttonStyles } from '../styles/buttonStyles';
import { badgeStyles } from '../styles/badgeStyles';
import { useModal } from '../hooks/useModal';

export default function ScreenshotGallery() {
  const navigate = useNavigate();
  const { confirm, alert, toast, ModalComponent } = useModal();
  const [searchParams] = useSearchParams();
  const pageUrl = searchParams.get('url') || '';
  const screenshotId = searchParams.get('screenshotId');
  const commentId = searchParams.get('commentId');
  const workspaceId = searchParams.get('workspace') || 'default'; // Always filter by workspace, default to 'default'
  const fromPage = searchParams.get('from');
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [screenshotComments, setScreenshotComments] = useState<Record<string, Comment[]>>({});
  const [commentReplies, setCommentReplies] = useState<Record<string, ReplyType[]>>({});
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');
  const [currentUser, setCurrentUser] = useState<{ userId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const [openReplyMenuId, setOpenReplyMenuId] = useState<string | null>(null);
  const [showResolvedOnly, setShowResolvedOnly] = useState<Record<string, boolean>>({});
  const [workspaceMap, setWorkspaceMap] = useState<Record<string, Workspace>>({});
  const [openWorkspaceMenuId, setOpenWorkspaceMenuId] = useState<string | null>(null);
  const [moveToWorkspaceModalOpen, setMoveToWorkspaceModalOpen] = useState(false);
  const [targetWorkspaceId, setTargetWorkspaceId] = useState<string>('');
  const [isCreatingNewWorkspace, setIsCreatingNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isTargetWorkspaceDropdownOpen, setIsTargetWorkspaceDropdownOpen] = useState(false);
  const [workspaceSearchTerm, setWorkspaceSearchTerm] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const screenshotRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const commentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    loadCurrentUser();
    loadWorkspaces();
    loadScreenshots();
  }, [pageUrl, screenshotId, workspaceId]);

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

  // Scroll to and highlight comment when commentId is in URL
  useEffect(() => {
    if (commentId && !loading && screenshots.length > 0) {
      // Find the comment in the loaded data
      let targetComment: Comment | null = null;
      let targetScreenshotId: string | null = null;
      
      for (const screenshot of screenshots) {
        const comments = screenshotComments[screenshot.id] || [];
        const found = comments.find(c => c.id === commentId);
        if (found) {
          targetComment = found;
          targetScreenshotId = screenshot.id;
          break;
        }
      }
      
      // If comment is resolved, switch to resolved view
      if (targetComment && targetScreenshotId && targetComment.resolved) {
        setShowResolvedOnly(prev => ({ ...prev, [targetScreenshotId]: true }));
      }
      
      // Small delay to ensure DOM is ready and view has switched
      const timer = setTimeout(() => {
        setSelectedCommentId(commentId);
        const commentEl = commentRefs.current[commentId];
        if (commentEl) {
          commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [commentId, loading, screenshots, screenshotComments]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openWorkspaceMenuId) {
        setOpenWorkspaceMenuId(null);
      }
    };

    if (openWorkspaceMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openWorkspaceMenuId]);


  const loadCurrentUser = async () => {
    try {
      const user = await api.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

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

  const loadScreenshots = async () => {
    try {
      // Always load active screenshots for the page, filtered by workspace
      // screenshotId is only used for scrolling to a specific screenshot, not for filtering
      const data = await api.getScreenshots(pageUrl, workspaceId);
      setScreenshots(data);
      
      // Update page title
      if (data.length > 0 && data[0].page_title) {
        document.title = `${data[0].page_title} - Fetch Hub`;
      } else if (pageUrl) {
        document.title = `${pageUrl} - Fetch Hub`;
      }
      
      // Load comments for each screenshot
      const commentsMap: Record<string, Comment[]> = {};
      const repliesMap: Record<string, ReplyType[]> = {};
      for (const screenshot of data) {
        try {
          const comments = await api.getComments(screenshot.id);
          commentsMap[screenshot.id] = comments;
          
          // Load replies for each comment
          for (const comment of comments) {
            try {
              const replies = await api.getReplies(comment.id);
              repliesMap[comment.id] = replies;
            } catch (error) {
              console.error(`Failed to load replies for comment ${comment.id}:`, error);
              repliesMap[comment.id] = [];
            }
          }
        } catch (error) {
          console.error(`Failed to load comments for screenshot ${screenshot.id}:`, error);
          commentsMap[screenshot.id] = [];
        }
      }
      setScreenshotComments(commentsMap);
      setCommentReplies(repliesMap);
      
      // Set replies expanded by default for comments that have replies
      const expandedMap: Record<string, boolean> = {};
      for (const commentId in repliesMap) {
        if (repliesMap[commentId].length > 0) {
          expandedMap[commentId] = true;
        }
      }
      setExpandedReplies(expandedMap);
    } catch (error) {
      console.error('Failed to load screenshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (screenshotId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to move this screenshot to trash?',
      'This will be stored in trash for 30 days.',
      'Move',
      'primary'
    );
    if (!confirmed) return;
    
    try {
      await api.deleteScreenshot(screenshotId);
      await loadScreenshots();
    } catch (error) {
      console.error('Failed to delete screenshot:', error);
      await alert('Failed to delete screenshot.');
    }
  };

  const handleRestore = async (screenshotId: string) => {
    try {
      await api.restoreScreenshot(screenshotId);
      navigate('/');
    } catch (error) {
      console.error('Failed to restore screenshot:', error);
      alert('Failed to restore screenshot');
    }
  };

  const handleToggleResolve = async (commentId: string, screenshotId: string) => {
    try {
      await api.toggleResolve(commentId);
      
      // Reload and check if we need to switch back to active view
      const data = await api.getScreenshots(pageUrl);
      setScreenshots(data);
      
      const commentsMap: Record<string, Comment[]> = {};
      for (const screenshot of data) {
        try {
          const comments = await api.getComments(screenshot.id);
          commentsMap[screenshot.id] = comments;
        } catch (error) {
          console.error(`Failed to load comments for screenshot ${screenshot.id}:`, error);
          commentsMap[screenshot.id] = [];
        }
      }
      setScreenshotComments(commentsMap);
      
      // Check resolved count from fresh data and switch view if needed
      const comments = commentsMap[screenshotId] || [];
      const resolvedCount = comments.filter(c => c.resolved).length;
      if (resolvedCount === 0 && showResolvedOnly[screenshotId]) {
        setShowResolvedOnly(prev => ({ ...prev, [screenshotId]: false }));
      }
    } catch (error) {
      console.error('Failed to toggle resolve status:', error);
      alert('Failed to update comment status');
    }
  };

  const handleCreateReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    
    try {
      const newReply = await api.createReply({
        comment_id: commentId,
        reply_text: replyText.trim(),
      });
      
      // Update local state
      setCommentReplies(prev => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), newReply],
      }));
      
      // Clear form
      setReplyText('');
      setReplyingTo(null);
      
      // Keep replies expanded after posting
      setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
    } catch (error) {
      console.error('Failed to create reply:', error);
      await alert('Failed to create reply.');
    }
  };

  const handleUpdateComment = async (commentId: string, screenshotId: string) => {
    if (!editText.trim()) return;
    
    try {
      const updatedComment = await api.updateComment(commentId, {
        comment_text: editText.trim(),
      });
      
      // Update local state
      setScreenshotComments(prev => ({
        ...prev,
        [screenshotId]: prev[screenshotId].map(c => 
          c.id === commentId ? { ...c, comment_text: updatedComment.comment_text } : c
        ),
      }));
      
      // Clear form
      setEditText('');
      setEditingCommentId(null);
    } catch (error) {
      console.error('Failed to update comment:', error);
      await alert('Failed to update comment.');
    }
  };

  const handleUpdateReply = async (replyId: string, commentId: string) => {
    if (!editReplyText.trim()) return;
    
    try {
      const updatedReply = await api.updateReply(replyId, {
        reply_text: editReplyText.trim(),
      });
      
      // Update local state
      setCommentReplies(prev => ({
        ...prev,
        [commentId]: prev[commentId].map(r => 
          r.id === replyId ? { ...r, reply_text: updatedReply.reply_text } : r
        ),
      }));
      
      // Clear form
      setEditReplyText('');
      setEditingReplyId(null);
    } catch (error) {
      console.error('Failed to update reply:', error);
      await alert('Failed to update reply.');
    }
  };

  const handleDeleteComment = async (commentId: string, screenshotId: string) => {
    const isLastComment = screenshotComments[screenshotId]?.length === 1;
    
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
      await api.deleteComment(commentId);
      
      // If this was the last comment, also delete the screenshot
      if (isLastComment) {
        await api.deleteScreenshot(screenshotId);
        
        // Remove screenshot from local state
        setScreenshots(prev => prev.filter(s => s.id !== screenshotId));
        
        // Remove all related state
        setScreenshotComments(prev => {
          const newComments = { ...prev };
          delete newComments[screenshotId];
          return newComments;
        });
      } else {
        // Update local state - remove comment and its replies
        setScreenshotComments(prev => ({
          ...prev,
          [screenshotId]: prev[screenshotId].filter(c => c.id !== commentId),
        }));
      }
      
      setCommentReplies(prev => {
        const newReplies = { ...prev };
        delete newReplies[commentId];
        return newReplies;
      });
      
      if (selectedCommentId === commentId) {
        setSelectedCommentId(null);
      }
      
      setOpenCommentMenuId(null);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      await alert('Failed to delete comment.');
    }
  };

  const handleDeleteReply = async (replyId: string, commentId: string) => {
    const confirmed = await confirm('Delete Reply', 'This cannot be undone.', 'Delete', 'danger');
    if (!confirmed) return;

    try {
      await api.deleteReply(replyId);
      
      // Update local state - remove reply from list
      setCommentReplies(prev => ({
        ...prev,
        [commentId]: prev[commentId].filter(r => r.id !== replyId),
      }));
      
      setOpenReplyMenuId(null);
    } catch (error) {
      console.error('Failed to delete reply:', error);
      await alert('Failed to delete reply.');
    }
  };

  const handleDownloadScreenshot = async (screenshot: Screenshot) => {
    const element = screenshotRefs.current[screenshot.id];
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });
      
      const link = document.createElement('a');
      const filename = (screenshot.page_title || 'screenshot').replace(/[^a-z0-9]/gi, '-').toLowerCase();
      link.download = `${filename}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to download screenshot:', error);
      alert('Failed to download screenshot image');
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleBackNavigation = () => {
    // Explicit navigation based on where user came from
    if (fromPage === 'home') {
      navigate('/');
      return;
    }
    
    if (fromPage === 'trash') {
      navigate('/trash');
      return;
    }
    
    if (fromPage === 'reviews') {
      navigate('/reviews');
      return;
    }
    
    if (fromPage === 'workspace' && workspaceId && workspaceId !== 'default') {
      navigate(`/workspaces/${workspaceId}`);
      return;
    }
    
    // Fallback: context-based navigation when no 'from' parameter
    const hasDeletedScreenshots = screenshots.some(s => s.deleted_at);
    
    if (hasDeletedScreenshots) {
      navigate('/trash');
    } else if (workspaceId && workspaceId !== 'default') {
      navigate(`/workspaces/${workspaceId}`);
    } else {
      navigate('/');
    }
  };

  const getBackButtonLabel = () => {
    // Match the navigation logic priority
    if (fromPage === 'home') {
      return 'Back to Home';
    }
    
    if (fromPage === 'trash') {
      return 'Back to Trash';
    }
    
    if (fromPage === 'reviews') {
      return 'Back to All Reviews';
    }
    
    if (fromPage === 'workspace' && workspaceId && workspaceId !== 'default' && workspaceMap[workspaceId]) {
      return `Back to ${workspaceMap[workspaceId].name}`;
    }
    
    // Fallback: context-based labels
    const hasDeletedScreenshots = screenshots.some(s => s.deleted_at);
    if (hasDeletedScreenshots) {
      return 'Back to Trash';
    }
    
    if (workspaceId && workspaceId !== 'default' && workspaceMap[workspaceId]) {
      return `Back to ${workspaceMap[workspaceId].name}`;
    }
    
    return 'Back to Home';
  };

  return (
    <div className="flex flex-col h-full">
      <ModalComponent />
      <div className="bg-cream dark:bg-gray-900 dark:border-gray-700 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={handleBackNavigation}
              className={`flex items-center gap-2 ${buttonStyles.navTabInactive}`}
            >
              <ArrowLeft className="w-4 h-4" />
              {getBackButtonLabel()}
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <a 
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${typography.body} truncate max-w-2xl hover:underline`}
            >
              {pageUrl}
            </a>
          </div>
          {workspaceMap[workspaceId] && (
            <div className="flex items-center gap-2">
              <div className={badgeStyles.workspaceContainer}>
                <Folder className={badgeStyles.workspaceIcon} />
                <span className={badgeStyles.workspaceText}>{workspaceMap[workspaceId].name}</span>
              </div>
              <div className="relative flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenWorkspaceMenuId(openWorkspaceMenuId === workspaceId ? null : workspaceId);
                  }}
                  className={`p-1 hover:bg-stone-200 dark:hover:bg-gray-600 rounded transition-colors flex items-center ${
                    openWorkspaceMenuId === workspaceId ? 'bg-stone-200 dark:bg-gray-600' : ''
                  }`}
                >
                  <Ellipsis className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                {openWorkspaceMenuId === workspaceId && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenWorkspaceMenuId(null);
                        navigate(`/workspaces/${workspaceId}`);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      View workspace
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenWorkspaceMenuId(null);
                        setMoveToWorkspaceModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Move page
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setOpenWorkspaceMenuId(null);
                        const confirmed = await confirm('Are you sure you want to move all screenshots to trash?', 'All screenshots and comments for this page will be moved to trash and can be restored within 30 days.', 'Move to trash', 'primary');
                        if (confirmed) {
                          try {
                            for (const screenshot of screenshots) {
                              await api.deleteScreenshot(screenshot.id);
                            }
                            navigate('/');
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
          )}
        </div>
      </div>

      <div className="flex-1 bg-cream dark:bg-gray-900 p-8 overflow-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading screenshots...</div>
        ) : screenshots.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center max-w-7xl mx-auto">
            <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className={`${typography.h3} mb-2`}>No screenshots yet</h3>
            <p className={typography.bodySmall}>No screenshots have been captured for this page yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 max-w-7xl mx-auto">
            {screenshots.map((screenshot) => {
              const comments = screenshotComments[screenshot.id] || [];
              return (
                <div
                  key={screenshot.id}
                  ref={(el) => (screenshotRefs.current[screenshot.id] = el)}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden "
                >
                  <div className="px-5 pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className={`${typography.h5} truncate min-w-0 flex-1`}>
                        {screenshot.page_title || 'Screenshot'}
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === screenshot.id ? null : screenshot.id)}
                            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 rounded-lg transition-colors ${
                              openMenuId === screenshot.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                            }`}
                            title="More options"
                          >
                            <Ellipsis className="w-4 h-4 text-gray-700" />
                          </button>
                          {openMenuId === screenshot.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 min-w-[160px]">
                                <button
                                  onClick={() => {
                                    handleDownloadScreenshot(screenshot);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download</span>
                                </button>
                                {screenshot.deleted_at ? (
                                  <button
                                    onClick={() => {
                                      handleRestore(screenshot.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-b-lg"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                    <span>Restore</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      handleDelete(screenshot.id);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-b-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 max-h-[calc(100vh-10rem)]" onClick={() => setSelectedCommentId(null)}>
                    {/* Screenshot */}
                    <div className="flex-1 self-start min-h-0 max-h-[calc(100vh-12rem)] border border-gray-200 dark:border-gray-700 rounded-lg overflow-y-auto">
                      <div className="relative">
                        <img
                          src={screenshot.image_data}
                          alt={screenshot.page_title || 'Screenshot'}
                          className="w-full"
                        />
                        {/* Comment regions overlay */}
                        <svg className="absolute inset-0 w-full h-full">
                          {comments.map((comment, idx) => (
                            <g 
                              key={comment.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCommentId(comment.id);
                                const commentEl = commentRefs.current[comment.id];
                                if (commentEl) {
                                  commentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              className="cursor-pointer"
                            >
                              <rect
                                x={`${comment.x}%`}
                                y={`${comment.y}%`}
                                width={`${comment.width}%`}
                                height={`${comment.height}%`}
                                fill={selectedCommentId === comment.id ? "rgba(236, 72, 153, 0.3)" : "rgba(236, 72, 153, 0.15)"}
                                stroke="#ec4899"
                                strokeWidth={selectedCommentId === comment.id ? "3" : "2"}
                              />
                              <text
                                x={`${comment.x + 1}%`}
                                y={`${comment.y + 2}%`}
                                fill="#ec4899"
                                fontSize="16"
                                fontWeight="bold"
                              >
                                {idx + 1}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>
                    
                    {/* Comments list */}
                    <div id={`comments-${screenshot.id}`} className="w-96 flex-shrink-0 self-stretch flex flex-col space-y-3 overflow-visible border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex-shrink-0 flex items-center justify-between">
                        <h4 className={typography.bodySmall}>Comments</h4>
                        <div className="flex items-center gap-3 text-xs">
                          <button
                            onClick={() => setShowResolvedOnly(prev => ({ ...prev, [screenshot.id]: false }))}
                            className={`flex items-center gap-1 transition-colors ${
                              !showResolvedOnly[screenshot.id]
                                ? 'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400'
                                : 'text-gray-400 hover:text-green-600 dark:hover:text-green-500'
                            }`}
                            title="Show active comments"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{comments.filter(c => !c.resolved).length}</span>
                          </button>
                          <button
                            onClick={() => setShowResolvedOnly(prev => ({ ...prev, [screenshot.id]: true }))}
                            disabled={comments.filter(c => c.resolved).length === 0}
                            className={`flex items-center gap-1 transition-colors ${
                              comments.filter(c => c.resolved).length === 0
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : showResolvedOnly[screenshot.id]
                                ? 'text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400'
                                : 'text-gray-400 hover:text-green-600 dark:hover:text-green-500'
                            }`}
                            title={comments.filter(c => c.resolved).length === 0 ? "You don't have any resolved comment." : "Show resolved comments only"}
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>{comments.filter(c => c.resolved).length}</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {(showResolvedOnly[screenshot.id] ? comments.filter(c => c.resolved) : comments.filter(c => !c.resolved)).length > 0 ? (
                          <div className="space-y-3">
                            {(showResolvedOnly[screenshot.id] ? comments.filter(c => c.resolved) : comments.filter(c => !c.resolved)).map((comment, idx) => (
                              <div 
                                key={comment.id} 
                                ref={(el) => (commentRefs.current[comment.id] = el)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCommentId(comment.id);
                                }}
                                className={`pt-2 px-3 pb-3 rounded-lg border transition-all cursor-pointer ${
                                  comment.resolved
                                    ? selectedCommentId === comment.id
                                      ? 'opacity-60 bg-pink-50 dark:bg-pink-900/20 border-pink-500 dark:border-pink-500'
                                      : 'opacity-60 bg-stone-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                    : selectedCommentId === comment.id 
                                    ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-500 dark:border-pink-500' 
                                    : 'bg-stone-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}>
                                <div className="flex items-start gap-2">
                                  <div className="h-5 flex items-center text-xs font-bold text-black dark:text-white flex-shrink-0">
                                    {showResolvedOnly[screenshot.id] ? idx + 1 : comments.indexOf(comment) + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="h-5 flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className={`${typography.label} truncate`} title={comment.commenter_name}>
                                          {comment.commenter_name}
                                        </div>
                                        <div className={typography.caption}>
                                          {formatTimeAgo(comment.timestamp)}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {editingCommentId !== comment.id && currentUser && comment.user_id === currentUser.userId && (
                                          <div className="relative">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id);
                                              }}
                                              className="transition-colors text-gray-400 hover:text-gray-600 active:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 dark:active:text-gray-200"
                                              title="More options"
                                            >
                                              <Ellipsis className="w-3 h-3" />
                                            </button>
                                            {openCommentMenuId === comment.id && (
                                              <>
                                                <div 
                                                  className="fixed inset-0 z-10" 
                                                  onClick={() => setOpenCommentMenuId(null)}
                                                />
                                                <div className="absolute right-0 top-6 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-[120px]">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingCommentId(comment.id);
                                                    setEditText(comment.comment_text);
                                                    setReplyingTo(null);
                                                    setReplyText('');
                                                    setOpenCommentMenuId(null);
                                                  }}
                                                  className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                  Edit
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteComment(comment.id, screenshot.id);
                                                  }}
                                                  className="w-full px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                              </>
                                            )}
                                          </div>
                                        )}
                                        {comment.resolved ? (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleResolve(comment.id, screenshot.id);
                                            }}
                                            className={buttonStyles.tertiaryExtraSmall}
                                            title="Mark as active"
                                          >
                                            <Undo2 className="w-2.5 h-2.5" />
                                            Undo
                                          </button>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleResolve(comment.id, screenshot.id);
                                            }}
                                            className="transition-colors text-gray-400 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-500"
                                            title="Mark as resolved"
                                          >
                                            <CheckCircle className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {editingCommentId === comment.id ? (
                                      <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                                        <textarea
                                          value={editText}
                                          onChange={(e) => setEditText(e.target.value)}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                          rows={3}
                                          autoFocus
                                        />
                                        <div className="flex gap-2 mt-1">
                                          <button
                                            onClick={() => handleUpdateComment(comment.id, screenshot.id)}
                                            className={buttonStyles.primaryExtraSmall}
                                            disabled={!editText.trim()}
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => {
                                              setEditingCommentId(null);
                                              setEditText('');
                                            }}
                                            className={buttonStyles.tertiaryExtraSmall}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className={`${typography.bodySmall} break-words`}>
                                        {comment.comment_text}
                                      </div>
                                    )}
                                    
                                    {/* Reply actions and count */}
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                          setReplyText('');
                                        }}
                                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400 transition-colors"
                                      >
                                        <Reply className="w-3 h-3" />
                                        Reply
                                      </button>
                                      
                                      {(commentReplies[comment.id]?.length || 0) > 0 && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedReplies(prev => ({ ...prev, [comment.id]: !prev[comment.id] }));
                                          }}
                                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-400 transition-colors"
                                        >
                                          {expandedReplies[comment.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                          {commentReplies[comment.id].length} {commentReplies[comment.id].length === 1 ? 'reply' : 'replies'}
                                        </button>
                                      )}
                                    </div>
                                    
                                    {/* Reply form */}
                                    {replyingTo === comment.id && (
                                      <div className="mt-1 pt-2" onClick={(e) => e.stopPropagation()}>
                                        <textarea
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          placeholder={`Reply to ${comment.commenter_name}...`}
                                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[2rem]"
                                          rows={2}
                                          autoFocus
                                        />
                                        <div className="flex gap-2 mt-1">
                                          <button
                                            onClick={() => handleCreateReply(comment.id)}
                                            className={buttonStyles.primaryExtraSmall}
                                            disabled={!replyText.trim()}
                                          >
                                            Post
                                          </button>
                                          <button
                                            onClick={() => {
                                              setReplyingTo(null);
                                              setReplyText('');
                                            }}
                                            className={buttonStyles.tertiaryExtraSmall}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Replies list */}
                                    {expandedReplies[comment.id] && commentReplies[comment.id] && commentReplies[comment.id].length > 0 && (
                                      <div className="mt-2 pt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                                        {commentReplies[comment.id].map(reply => (
                                          <div key={reply.id} className="pl-3 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700 before:rounded-full">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                              <div className="flex items-center gap-2">
                                                <div className={typography.label}>
                                                  {reply.user_name}
                                                </div>
                                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                                  replying to {comment.commenter_name}
                                                </div>
                                                <div className={typography.caption}>
                                                  {formatTimeAgo(reply.created_at)}
                                                </div>
                                              </div>
                                              {editingReplyId !== reply.id && currentUser && reply.user_id === currentUser.userId && (
                                                <div className="relative">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setOpenReplyMenuId(openReplyMenuId === reply.id ? null : reply.id);
                                                    }}
                                                    className="transition-colors text-gray-400 hover:text-gray-600 active:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 dark:active:text-gray-200"
                                                    title="More options"
                                                  >
                                                    <Ellipsis className="w-3 h-3" />
                                                  </button>
                                                  {openReplyMenuId === reply.id && (
                                                    <>
                                                      <div 
                                                        className="fixed inset-0 z-10" 
                                                        onClick={() => setOpenReplyMenuId(null)}
                                                      />
                                                      <div className="absolute right-0 top-6 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden min-w-[120px]">
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setEditingReplyId(reply.id);
                                                          setEditReplyText(reply.reply_text);
                                                          setOpenReplyMenuId(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                      >
                                                        Edit
                                                      </button>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleDeleteReply(reply.id, comment.id);
                                                        }}
                                                        className="w-full px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                      >
                                                        Delete
                                                      </button>
                                                    </div>
                                                    </>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            {editingReplyId === reply.id ? (
                                              <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                                                <textarea
                                                  value={editReplyText}
                                                  onChange={(e) => setEditReplyText(e.target.value)}
                                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[2rem]"
                                                  rows={2}
                                                  autoFocus
                                                />
                                                <div className="flex gap-2 mt-1">
                                                  <button
                                                    onClick={() => handleUpdateReply(reply.id, comment.id)}
                                                    className={buttonStyles.primaryExtraSmall}
                                                    disabled={!editReplyText.trim()}
                                                  >
                                                    Save
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      setEditingReplyId(null);
                                                      setEditReplyText('');
                                                    }}
                                                    className={buttonStyles.tertiaryExtraSmall}
                                                  >
                                                    Cancel
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="text-sm text-gray-700 dark:text-gray-300 break-words">
                                                {reply.reply_text}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center bg-stone-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 space-y-2">
                            <Heart className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              All clear! Check the Resolved tab for past discussions.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Move to Workspace Modal */}
      {moveToWorkspaceModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setMoveToWorkspaceModalOpen(false);
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
              Move the selected page from {workspaceMap[workspaceId]?.name || 'current workspace'} to another workspace.
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
                <label className={`${typography.bodySmall} text-gray-700 dark:text-gray-300 mb-2 block`}>
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
                    const pageScreenshots = await api.getScreenshots(pageUrl, workspaceId);
                    
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
                    setTargetWorkspaceId('');
                    setIsCreatingNewWorkspace(false);
                    setNewWorkspaceName('');
                    
                    // Navigate to workspace
                    navigate(`/workspaces/${destWorkspaceId}`);
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

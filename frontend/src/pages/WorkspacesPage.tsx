import { useEffect, useState } from 'react';
import { UsersRound, Plus, X, Ellipsis, Info } from 'lucide-react';
import type { Workspace } from '../types';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import { buttonStyles } from '../styles/buttonStyles';
import { typography } from '../styles/typography';
import { useModal } from '../hooks/useModal';

export default function WorkspacesPage() {
  const navigate = useNavigate();
  const { confirm, alert, ModalComponent } = useModal();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Workspaces - Fetch Hub';
    loadCurrentUser();
    loadWorkspaces();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const loadCurrentUser = async () => {
    try {
      const user = await api.getCurrentUser();
      if (user) {
        setCurrentUser({ userId: user.userId, email: user.email });
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadWorkspaces = async () => {
    try {
      const data = await api.getWorkspaces();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      await alert('Please enter a workspace name.');
      return;
    }

    if (!currentUser) {
      await alert('You must be logged in to create a workspace.');
      return;
    }

    try {
      const workspace = await api.createWorkspace(workspaceName.trim(), currentUser.email);
      setWorkspaces([workspace, ...workspaces]);
      setWorkspaceName('');
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      await alert('Failed to create workspace.');
    }
  };

  const handleUpdateWorkspace = async () => {
    if (!editingWorkspace || !workspaceName.trim()) {
      await alert('Please enter a workspace name.');
      return;
    }

    try {
      const updated = await api.updateWorkspace(editingWorkspace.id, workspaceName.trim());
      setWorkspaces(workspaces.map(w => w.id === editingWorkspace.id ? updated : w));
      setWorkspaceName('');
      setEditingWorkspace(null);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update workspace:', error);
      await alert('Failed to update workspace.');
    }
  };

  const handleDeleteWorkspace = async (id: string, name: string) => {
    if (id === 'default') {
      await alert('Cannot delete the default workspace.');
      return;
    }

    const confirmed = await confirm(
      'Delete Workspace',
      `Are you sure you want to delete "${name}"? This will permanently delete all screenshots and comments in this workspace.`,
      'Delete',
      'danger'
    );

    if (!confirmed) return;

    try {
      await api.deleteWorkspace(id);
      setWorkspaces(workspaces.filter(w => w.id !== id));
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      await alert('Failed to delete workspace.');
    }
  };

  const startEditing = (workspace: Workspace) => {
    setEditingWorkspace(workspace);
    setWorkspaceName(workspace.name);
    setIsEditModalOpen(true);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col h-full bg-cream dark:bg-gray-900">
      <ModalComponent />
      <NavBar />
      <div className="flex-1 bg-cream dark:bg-gray-900 px-8 py-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-stone-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={typography.h4}>Workspaces</h3>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className={`${buttonStyles.primarySmall} flex items-center px-4 py-2 text-sm`}
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading workspaces...
              </div>
            ) : (
              <div className="space-y-3">
                {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => navigate(`/workspaces/${workspace.id}`)}
                      className="w-full text-left p-4 bg-stone-50 dark:bg-gray-750 rounded-lg hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <UsersRound className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                            <h3 className={typography.label}>{workspace.name}</h3>
                            {workspace.id === 'default' && (
                              <div className="relative group">
                                <Info className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity pointer-events-none z-20">
                                  This is a required system workspace. You can customize the name, but it cannot be removed.
                                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                                </div>
                              </div>
                            )}
                          </div>
                          {workspace.id !== 'default' && (
                            <p className={`${typography.bodyTiny} text-gray-500 dark:text-gray-400`}>
                              Created {formatDate(workspace.created_at)} by {workspace.created_by}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === workspace.id ? null : workspace.id);
                              }}
                              className={`p-1 hover:bg-stone-200 dark:hover:bg-gray-600 rounded transition-colors ${
                                openMenuId === workspace.id ? 'bg-stone-200 dark:bg-gray-600' : ''
                              }`}
                            >
                              <Ellipsis className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                            {openMenuId === workspace.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    startEditing(workspace);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                  Edit
                                </button>
                                {workspace.id !== 'default' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      handleDeleteWorkspace(workspace.id, workspace.name);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => {
            setIsCreateModalOpen(false);
            setWorkspaceName('');
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[480px] max-w-[90vw] p-6 animate-fadeIn relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setWorkspaceName('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
              title="Exit"
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>

            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white pr-8" style={{ fontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'" }}>Create a workspace</h3>
            
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateWorkspace();
                if (e.key === 'Escape') {
                  setIsCreateModalOpen(false);
                  setWorkspaceName('');
                }
              }}
              placeholder="Workspace name"
              className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              autoFocus
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setWorkspaceName('');
                }}
                className={buttonStyles.tertiarySmall}
              >
                Cancel
              </button>
              <button onClick={handleCreateWorkspace} className={buttonStyles.primarySmall}>
                Create
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
            setEditingWorkspace(null);
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
                setEditingWorkspace(null);
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
                  setEditingWorkspace(null);
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
                  setEditingWorkspace(null);
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
    </div>
  );
}

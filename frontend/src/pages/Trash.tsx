import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import type { Screenshot } from '../types';
import { api } from '../services/api';
import NavBar from '../components/NavBar';
import { buttonStyles } from '../styles/buttonStyles';
import { typography } from '../styles/typography';
import { useModal } from '../hooks/useModal';

export default function Trash() {
  const navigate = useNavigate();
  const { confirm, alert, ModalComponent } = useModal();
  const [deletedScreenshots, setDeletedScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeletedScreenshots();
  }, []);

  const loadDeletedScreenshots = async () => {
    try {
      const data = await api.getDeletedScreenshots();
      setDeletedScreenshots(data);
    } catch (error) {
      console.error('Failed to load deleted screenshots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (screenshotId: string) => {
    const confirmed = await confirm(
      'Are you sure you want to restore this screenshot?',
      'It will be moved back to the collections of all your review.',
      'Restore',
      'primary'
    );
    if (!confirmed) return;
    
    try {
      await api.restoreScreenshot(screenshotId);
      await loadDeletedScreenshots();
    } catch (error) {
      console.error('Failed to restore screenshot:', error);
      await alert('Failed to restore screenshot.');
    }
  };

  const handlePermanentDelete = async (e: React.MouseEvent, screenshotId: string) => {
    e.stopPropagation();
    
    const confirmed = await confirm(
      'Are you sure you want to permanently delete this screenshot?',
      'This action cannot be undone.',
      'Delete',
      'danger'
    );
    if (!confirmed) return;
    
    try {
      await api.permanentlyDeleteScreenshot(screenshotId);
      await loadDeletedScreenshots();
    } catch (error) {
      console.error('Failed to permanently delete screenshot:', error);
      await alert('Failed to permanently delete screenshot.');
    }
  };

  const getDaysInTrash = (deletedAt?: number) => {
    if (!deletedAt) return 0;
    return Math.floor((Date.now() - deletedAt) / (24 * 60 * 60 * 1000));
  };

  return (
    <div className="flex flex-col h-full bg-cream dark:bg-gray-900">
      <ModalComponent />
      <NavBar />
      <div className="flex-1 bg-cream dark:bg-gray-900 px-8 py-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-stone-200 dark:border-gray-700 p-6">
            <h3 className={`${typography.h4} mb-3`}>
              Trash Bin
            </h3>
            
            <div className="mb-4 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span>Items in trash are automatically deleted after 30 days</span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
            ) : deletedScreenshots.length === 0 ? (
              <div className="text-center py-8">
                <Trash2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className={typography.bodySmall}>Trash is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deletedScreenshots.map((screenshot) => {
                  const daysInTrash = getDaysInTrash(screenshot.deleted_at);
                  const daysRemaining = Math.max(0, 30 - daysInTrash);

                  return (
                    <button
                      key={screenshot.id}
                      onClick={() => navigate(`/gallery?url=${encodeURIComponent(screenshot.page_url)}&screenshotId=${screenshot.id}&from=trash`)}
                      className="w-full text-left p-4 bg-stone-50 dark:bg-gray-750 rounded-lg hover:bg-stone-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={screenshot.image_data}
                          alt="Screenshot"
                          className="w-16 h-12 object-cover rounded border border-gray-200 dark:border-gray-700 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className={`${typography.label} truncate mb-1`}>
                            {screenshot.page_title || 'Screenshot'}
                          </h4>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span className={`${typography.bodyTiny} text-amber-600 dark:text-amber-400`}>
                              {daysRemaining > 0
                                ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} until permanent deletion`
                                : 'Will be deleted soon'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(screenshot.id);
                            }}
                            className={buttonStyles.tertiaryExtraSmall}
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            Restore
                          </button>
                          <button
                            onClick={(e) => handlePermanentDelete(e, screenshot.id)}
                            className={buttonStyles.dangerExtraSmall}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

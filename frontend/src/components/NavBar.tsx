import { Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { buttonStyles } from '../styles/buttonStyles';

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const getActiveTab = () => {
    if (location.pathname === '/') return 'home';
    if (location.pathname === '/reviews') return 'reviews';
    if (location.pathname === '/workspaces') return 'workspaces';
    if (location.pathname === '/trash') return 'trash';
    if (location.pathname === '/about') return 'about';
    return null;
  };
  
  const activeTab = getActiveTab();

  return (
    <nav className="bg-cream dark:bg-gray-900 border-gray-200 dark:border-gray-700 px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate('/')}
            className={activeTab === 'home' ? buttonStyles.navTabActive : buttonStyles.navTabInactive}
          >
            Home
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={() => navigate('/reviews')}
            className={activeTab === 'reviews' ? buttonStyles.navTabActive : buttonStyles.navTabInactive}
          >
            Reviews
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={() => navigate('/workspaces')}
            className={activeTab === 'workspaces' ? buttonStyles.navTabActive : buttonStyles.navTabInactive}
          >
            Workspaces
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={() => navigate('/trash')}
            className={activeTab === 'trash' ? buttonStyles.navTabActive : buttonStyles.navTabInactive}
          >
            Trash
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/about')}
            className="p-1 rounded-lg dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="About"
          >
            <img src="/dog.png" alt="About" className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-1 rounded-lg dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
        </div>
      </div>
    </nav>
  );
}

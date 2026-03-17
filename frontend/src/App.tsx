import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePageNew';
import ScreenshotGallery from './components/ScreenshotGallery';
import AllReviews from './pages/AllReviews';
import Trash from './pages/Trash';
import About from './pages/About';
import WorkspacesPage from './pages/WorkspacesPage';
import WorkspaceDetailsPage from './pages/WorkspaceDetailsPage';

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/reviews" element={<AllReviews />} />
          <Route path="/workspaces" element={<WorkspacesPage />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspaceDetailsPage />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/about" element={<About />} />
          <Route path="/gallery" element={<ScreenshotGallery />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

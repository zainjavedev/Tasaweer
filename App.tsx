import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Page } from './types';
import RestorationPage from './pages/RestorationPage';
import ObjectReplacementPage from './pages/ObjectReplacementPage';
import TextToImagePage from './pages/TextToImagePage';
import MyImagesPage from './pages/MyImagesPage';
import HomePage from './pages/HomePage';
import CameraFunPage from './pages/CameraFunPage';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage goTo={setCurrentPage} />;
      case 'restoration':
        return <RestorationPage />;
      case 'replace':
        return <ObjectReplacementPage />;
      case 'text2image':
        return <TextToImagePage />;
      case 'myimages':
        return <MyImagesPage />;
      case 'camera':
        return <CameraFunPage />;
      default:
        return <RestorationPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-200">
      <Header />
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="container mx-auto px-4 py-8">
        {renderPage()}
      </main>
      <footer className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
        <p>Powered by Gemini API. Built for Professionals.</p>
      </footer>
    </div>
  );
};

export default App;

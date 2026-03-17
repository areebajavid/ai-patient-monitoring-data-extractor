import React, { useState } from 'react';
import UploadPage from './components/UploadPage';
import NursesOrderPage from './components/NursesOrderPage';

function App() {
  const [currentPage, setCurrentPage] = useState('monitoring');

  return (
    <div>
      {currentPage === 'monitoring' ? (
        <UploadPage onNavigateToNurses={() => setCurrentPage('nurses')} />
      ) : (
        <NursesOrderPage onNavigateBack={() => setCurrentPage('monitoring')} />
      )}
    </div>
  );
}

export default App;
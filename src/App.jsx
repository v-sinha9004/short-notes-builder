import React from 'react';
import Sidebar from './components/Sidebar';
import EditorArea from './components/EditorArea';
import { NoteProvider } from './contexts/NoteContext';

function App() {
  return (
    <NoteProvider>
      <div className="app-container">
        <Sidebar />
        <EditorArea />
      </div>
    </NoteProvider>
  );
}

export default App;

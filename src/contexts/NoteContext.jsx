import React, { createContext, useContext, useState, useEffect } from 'react';
import { noteService } from '../services/NoteService';

const NoteContext = createContext();

export const useNoteContext = () => {
  return useContext(NoteContext);
};

export const NoteProvider = ({ children }) => {
  const [notebooks, setNotebooks] = useState([]);
  const [sections, setSections] = useState([]);
  const [pages, setPages] = useState([]);

  const [selectedNotebookId, setSelectedNotebookId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedPageId, setSelectedPageId] = useState(null);

  // Load initial data
  useEffect(() => {
    noteService.getNotebooks().then(loadedNotebooks => {
      setNotebooks(loadedNotebooks);
      if (loadedNotebooks.length > 0) {
        setSelectedNotebookId(loadedNotebooks[0].id);
      }
    });
  }, []);

  // When notebook changes, load its sections
  useEffect(() => {
    if (selectedNotebookId) {
      noteService.getSections(selectedNotebookId).then(loadedSections => {
        setSections(loadedSections);
        if (loadedSections.length > 0) {
          setSelectedSectionId(loadedSections[0].id);
        } else {
          setSelectedSectionId(null);
        }
      });
    } else {
      setSections([]);
      setSelectedSectionId(null);
    }
  }, [selectedNotebookId]);

  // When section changes, load its pages
  useEffect(() => {
    if (selectedSectionId) {
      noteService.getPages(selectedSectionId).then(loadedPages => {
        setPages([...loadedPages]);
        if (loadedPages.length > 0) {
          if (!loadedPages.find(p => p.id === selectedPageId)) {
            setSelectedPageId(loadedPages[0].id);
          }
        } else {
          setSelectedPageId(null);
        }
      });
    } else {
      setPages([]);
      setSelectedPageId(null);
    }
  }, [selectedSectionId]);

  const addNotebook = async (title) => {
    const nb = await noteService.addNotebook(title);
    const nbs = await noteService.getNotebooks();
    setNotebooks(nbs);
    setSelectedNotebookId(nb.id);
  };

  const addSection = async (title) => {
    if (!selectedNotebookId) return;
    const sec = await noteService.addSection(selectedNotebookId, title);
    const secs = await noteService.getSections(selectedNotebookId);
    setSections(secs);
    setSelectedSectionId(sec.id);
  };

  const addPage = async (title) => {
    if (!selectedSectionId) return;
    const p = await noteService.addPage(selectedSectionId, title);
    const pgs = await noteService.getPages(selectedSectionId);
    setPages(pgs);
    setSelectedPageId(p.id);
  };

  const updatePageContent = async (content) => {
    if (!selectedSectionId || !selectedPageId) return;
    const updated = await noteService.updatePageContent(selectedPageId, content);
    setPages(prev => prev.map(p => p.id === selectedPageId ? updated : p));
  };

  const updatePageRevision = async (revisionContent) => {
    if (!selectedSectionId || !selectedPageId) return;
    const updated = await noteService.updatePageRevision(selectedPageId, revisionContent);
    setPages(prev => prev.map(p => p.id === selectedPageId ? updated : p));
  };

  const value = {
    notebooks,
    sections,
    pages,
    selectedNotebookId,
    setSelectedNotebookId,
    selectedSectionId,
    setSelectedSectionId,
    selectedPageId,
    setSelectedPageId,
    addNotebook,
    addSection,
    addPage,
    updatePageContent,
    updatePageRevision,
    activePage: pages.find(p => p.id === selectedPageId) || null
  };

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
};

import React, { useState, useRef, useEffect } from 'react';
import { Book, ChevronDown, Plus, ListFilter } from 'lucide-react';
import { useNoteContext } from '../contexts/NoteContext';

const sectionColors = [
  'var(--tab-blue)',
  'var(--tab-green)',
  'var(--tab-blue)', 
  'var(--tab-gray)',
  'var(--tab-yellow)',
  'var(--tab-red)',
  'var(--tab-purple)',
  'var(--tab-pink)',
  'var(--tab-teal)',
  'var(--tab-orange)',
  'var(--tab-brown)'
];

const getSectionColor = (index) => sectionColors[index % sectionColors.length];

export default function Sidebar() {
  const { 
    notebooks, sections, pages, 
    selectedNotebookId, setSelectedNotebookId, 
    selectedSectionId, setSelectedSectionId, 
    selectedPageId, setSelectedPageId,
    addNotebook, addSection, addPage
  } = useNoteContext();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isAddingNotebook, setIsAddingNotebook] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const [isAddingPage, setIsAddingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');

  const activeNotebook = notebooks.find(nb => nb.id === selectedNotebookId);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleAddNotebook = (e) => {
    e.preventDefault();
    if (newNotebookTitle.trim()) {
      addNotebook(newNotebookTitle);
      setNewNotebookTitle('');
      setIsAddingNotebook(false);
      setIsDropdownOpen(false);
    }
  };

  const handleAddSection = (e) => {
    e.preventDefault();
    if (newSectionTitle.trim()) {
      addSection(newSectionTitle);
      setNewSectionTitle('');
      setIsAddingSection(false);
    }
  };

  const handleAddPage = (e) => {
    e.preventDefault();
    if (newPageTitle.trim()) {
      addPage(newPageTitle);
      setNewPageTitle('');
      setIsAddingPage(false);
    }
  };

  const handleNotebookSelect = (id) => {
    setSelectedNotebookId(id);
    setIsDropdownOpen(false);
  };

  return (
    <div className="sidebar">
      {/* Sidebar Header - Acts as Notebook Selector */}
      <div 
        className="sidebar-header" 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        ref={dropdownRef}
      >
        <Book size={20} color="var(--accent-primary)" />
        <div className="sidebar-header-title">
          {activeNotebook ? activeNotebook.title : 'Select Notebook'}
          <ChevronDown size={16} color="var(--text-secondary)" />
        </div>

        {/* Notebook Dropdown overlay */}
        {isDropdownOpen && (
          <div className="notebook-dropdown" onClick={e => e.stopPropagation()}>
            <div className="dropdown-header">
              Environment<br/>
              Sync status is up to date
            </div>
            <div className="dropdown-content">
              {notebooks.map((nb, i) => (
                <div 
                  key={nb.id} 
                  className={`notebook-item ${selectedNotebookId === nb.id ? 'active' : ''}`}
                  onClick={() => handleNotebookSelect(nb.id)}
                >
                  <Book size={20} color={getSectionColor(i)} />
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{nb.title}</span>
                </div>
              ))}
            </div>
            <div className="dropdown-footer">
              {isAddingNotebook ? (
                <form onSubmit={handleAddNotebook}>
                  <input 
                    autoFocus
                    type="text"
                    value={newNotebookTitle}
                    onChange={(e) => setNewNotebookTitle(e.target.value)}
                    placeholder="Notebook name..."
                    onBlur={() => setIsAddingNotebook(false)}
                    className="inline-input"
                  />
                </form>
              ) : (
                <button className="btn btn-ghost" onClick={() => setIsAddingNotebook(true)}>
                  <span style={{ color: 'var(--accent-primary)' }}>Add notebook</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-body">
        {/* Sections Column */}
        <div className="sidebar-column sections-column">
          <div className="column-content">
            {sections.map((sec, i) => (
              <div 
                key={sec.id} 
                className={`nav-item section-item ${selectedSectionId === sec.id ? 'active' : ''}`}
                onClick={() => setSelectedSectionId(sec.id)}
              >
                <div className="section-color-bar" style={{ backgroundColor: getSectionColor(i) }}></div>
                <span className="nav-item-text">{sec.title}</span>
              </div>
            ))}
            {sections.length === 0 && !isAddingSection && (
              <div style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>No sections</div>
            )}
          </div>
          <div className="column-footer">
            {isAddingSection ? (
              <form onSubmit={handleAddSection} style={{ width: '100%' }}>
                <input 
                  autoFocus
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="Section name..."
                  onBlur={() => setIsAddingSection(false)}
                  className="inline-input"
                />
              </form>
            ) : (
              <button className="btn btn-ghost" onClick={() => setIsAddingSection(true)} disabled={!selectedNotebookId}>
                <span style={{ color: 'var(--accent-primary)' }}>Add section</span>
              </button>
            )}
          </div>
        </div>

        {/* Pages Column */}
        <div className="sidebar-column pages-column">
          <div className="column-header">
            <button className="btn-icon">
              <ListFilter size={18} />
            </button>
          </div>
          <div className="column-content">
            {pages.map(page => (
              <div 
                key={page.id} 
                className={`nav-item ${selectedPageId === page.id ? 'active' : ''}`}
                onClick={() => setSelectedPageId(page.id)}
              >
                <span className="nav-item-text" style={{ paddingLeft: '8px' }}>{page.title}</span>
              </div>
            ))}
            {pages.length === 0 && !isAddingPage && (
              <div style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>No pages</div>
            )}
          </div>
          <div className="column-footer">
            {isAddingPage ? (
              <form onSubmit={handleAddPage} style={{ width: '100%' }}>
                <input 
                  autoFocus
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Page title..."
                  onBlur={() => setIsAddingPage(false)}
                  className="inline-input"
                />
              </form>
            ) : (
              <button className="btn btn-ghost" onClick={() => setIsAddingPage(true)} disabled={!selectedSectionId}>
                <span style={{ color: 'var(--accent-primary)' }}>Add page</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

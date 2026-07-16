import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // Quill stylesheet
import { marked } from 'marked';
import { useReactToPrint } from 'react-to-print';
import { Sparkles, FileText, Save, Download, Check } from 'lucide-react';
import { useNoteContext } from '../contexts/NoteContext';

export default function EditorArea() {
  const { activePage, updatePageContent, updatePageRevision } = useNoteContext();
  const [viewMode, setViewMode] = useState('original'); // 'original' or 'revision'
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Premium');
  const [selectedModel, setSelectedModel] = useState('gpt-5.4');
  const [errorMsg, setErrorMsg] = useState('');

  const PAID_MODELS = [
    'gpt-5.5', 'chatgpt-4o-latest'
  ];
  const PREMIUM_MODELS = [
    'gpt-5.4', 'gpt-5.2', 'gpt-5.1', 'gpt-5.1-codex', 'gpt-5', 'gpt-5-codex', 'gpt-5-chat-latest', 'gpt-4.1', 'gpt-4o', 'o1', 'o3'
  ];
  const FAST_MODELS = [
    'gpt-5.4-mini', 'gpt-5.4-nano', 'gpt-5.1-codex-mini', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4o-mini', 'o1-mini', 'o3-mini', 'o4-mini', 'codex-mini-latest'
  ];

  const currentModels = selectedCategory === 'Paid' ? PAID_MODELS : (selectedCategory === 'Premium' ? PREMIUM_MODELS : FAST_MODELS);

  // Reset model when category changes
  useEffect(() => {
    setSelectedModel(selectedCategory === 'Paid' ? PAID_MODELS[0] : (selectedCategory === 'Premium' ? PREMIUM_MODELS[0] : FAST_MODELS[0]));
  }, [selectedCategory]);
  
  // They both use Quill now, so they hold HTML strings
  const [localContent, setLocalContent] = useState('');
  const [localRevision, setLocalRevision] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [savedRevision, setSavedRevision] = useState('');

  const normalizeHTML = (html) => {
    if (!html) return '';
    const trimmed = html.trim();
    if (trimmed === '<p><br></p>') return '';
    return trimmed;
  };

  const hasUnsavedNotes = normalizeHTML(localContent) !== normalizeHTML(savedContent);
  const hasUnsavedRevision = normalizeHTML(localRevision) !== normalizeHTML(savedRevision);

  const revisionRef = useRef();
  
  const handlePrint = useReactToPrint({
    contentRef: revisionRef,
    documentTitle: activePage ? `${activePage.title} - Revision Notes` : 'Revision Notes'
  });

  useEffect(() => {
    if (activePage) {
      // Original notes are usually plain text. Convert newlines to HTML so Quill renders them properly.
      const rawContent = activePage.content || '';
      const contentIsHtml = /<[a-z][\s\S]*>/i.test(rawContent);
      const parsedContent = contentIsHtml ? rawContent : rawContent.replace(/\n/g, '<br>');
      setLocalContent(parsedContent);
      setSavedContent(parsedContent);

      // Revision notes were previously Markdown. If it lacks HTML tags, parse it to HTML for Quill.
      const rawRev = activePage.revisionContent || '';
      const revIsHtml = /<[a-z][\s\S]*>/i.test(rawRev);
      
      let parsedRev = rawRev;
      if (rawRev && !revIsHtml) {
        parsedRev = marked.parse(rawRev);
      }
      setLocalRevision(parsedRev);
      setSavedRevision(parsedRev);
    } else {
      setLocalContent('');
      setLocalRevision('');
      setSavedContent('');
      setSavedRevision('');
    }
  }, [activePage?.id]);

  useEffect(() => {
    if (activePage && !activePage.revisionContent && !localRevision && viewMode === 'revision') {
      setViewMode('original');
    }
  }, [activePage?.id, activePage?.revisionContent, localRevision, viewMode]);

  const handleSaveNotes = async () => {
    if (!activePage) return;
    setIsSaving(true);
    try {
      await updatePageContent(localContent);
      setSavedContent(localContent);
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRevision = async () => {
    if (!activePage) return;
    setIsSaving(true);
    try {
      await updatePageRevision(localRevision);
      setSavedRevision(localRevision);
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to save revision");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!activePage) return;
    setErrorMsg('');
    setIsGenerating(true);
    try {
      // We must extract text from Quill HTML to send to AI
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = localContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';

      const res = await fetch('http://localhost:3001/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: plainText, modelStr: selectedModel })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate revision sheet.');
      }
      
      // Parse AI markdown to HTML so Quill can render it natively
      const htmlResponse = marked.parse(data.revisionContent);
      setLocalRevision(htmlResponse);
      setViewMode('revision');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate revision sheet.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Restrict Quill toolbar to strictly BOLD only
  const modules = {
    toolbar: [
      ['bold'] 
    ],
  };

  if (!activePage) {
    return (
      <div className="main-area" style={{alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'}}>
        <FileText size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
        <p>Select or create a page to start writing notes</p>
      </div>
    );
  }

  return (
    <div className="main-area">
      <div className="editor-toolbar" style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff'
      }}>
        
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-app)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button 
            className={`btn ${viewMode === 'original' ? 'active' : ''}`}
            onClick={() => setViewMode('original')}
            style={{ 
              backgroundColor: viewMode === 'original' ? 'white' : 'transparent',
              boxShadow: viewMode === 'original' ? 'var(--shadow-sm)' : 'none',
              color: viewMode === 'original' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            Original Notes
          </button>
          <button 
            className={`btn ${viewMode === 'revision' ? 'active' : ''}`}
            onClick={() => setViewMode('revision')}
            disabled={!localRevision && !isGenerating}
            style={{ 
              backgroundColor: viewMode === 'revision' ? 'white' : 'transparent',
              boxShadow: viewMode === 'revision' ? 'var(--shadow-sm)' : 'none',
              color: viewMode === 'revision' ? 'var(--text-primary)' : 'var(--text-secondary)',
              opacity: (!localRevision && !isGenerating) ? 0.5 : 1
            }}
          >
            Revision Sheet
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {viewMode === 'original' ? (
             <button 
               className="btn" 
               onClick={handleSaveNotes}
               disabled={isSaving || !hasUnsavedNotes}
               style={{ 
                 border: `1px solid ${hasUnsavedNotes ? '#f59e0b' : 'var(--border-color)'}`, 
                 backgroundColor: hasUnsavedNotes ? '#fffbeb' : 'white',
                 color: hasUnsavedNotes ? '#b45309' : 'var(--text-secondary)'
               }}
             >
               {hasUnsavedNotes ? <Save size={16} /> : <Check size={16} color="#10b981" />}
               {isSaving ? 'Saving...' : hasUnsavedNotes ? 'Save Notes' : 'Saved'}
             </button>
          ) : (
            <>
             <button 
               className="btn" 
               onClick={handlePrint}
               style={{ border: '1px solid var(--border-color)', backgroundColor: 'white' }}
             >
               <Download size={16} color="var(--text-secondary)" />
               Export PDF
             </button>
             <button 
               className="btn" 
               onClick={handleSaveRevision}
               disabled={isSaving || !hasUnsavedRevision}
               style={{ 
                 border: `1px solid ${hasUnsavedRevision ? '#f59e0b' : 'var(--border-color)'}`, 
                 backgroundColor: hasUnsavedRevision ? '#fffbeb' : 'white',
                 color: hasUnsavedRevision ? '#b45309' : 'var(--text-secondary)'
               }}
             >
               {hasUnsavedRevision ? <Save size={16} /> : <Check size={16} color="#10b981" />}
               {isSaving ? 'Saving...' : hasUnsavedRevision ? 'Save Revision' : 'Saved'}
             </button>
            </>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'white',
                fontFamily: 'inherit',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Paid">Paid</option>
              <option value="Premium">Premium</option>
              <option value="Fast">Fast</option>
            </select>
            
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'white',
                fontFamily: 'inherit',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '150px'
              }}
            >
              {currentModels.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              padding: '4px 8px',
              backgroundColor: selectedCategory === 'Paid' ? '#fee2e2' : 'var(--bg-app)',
              color: selectedCategory === 'Paid' ? '#991b1b' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)'
            }}>
              {selectedCategory === 'Paid' ? 'Paid' : 'Free'}
            </span>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={handleGenerate}
            disabled={isGenerating || localContent.replace(/<[^>]*>?/gm, '').trim().length === 0}
          >
            <Sparkles size={16} />
            {isGenerating ? 'Generating...' : 'Generate Revision Sheet'}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 24px', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '14px', borderBottom: '1px solid #fecaca' }}>
          {errorMsg}
        </div>
      )}

      <div className="editor-content" style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 40px', maxWidth: '900px', margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          <h1 style={{ marginBottom: '24px', color: 'var(--text-primary)', fontSize: '28px', borderBottom: '1px solid transparent', outline: 'none' }}>
            {activePage.title}
          </h1>
          
          <style>{`
             .ql-toolbar { border: none !important; border-bottom: 1px solid var(--border-color) !important; padding: 8px 0 !important; }
             .ql-container { border: none !important; font-size: 16px; font-family: inherit; }
             .ql-editor { padding: 20px 0; min-height: 300px; color: var(--text-primary); line-height: 1.6; }
          `}</style>

          {viewMode === 'original' ? (
            <ReactQuill 
              theme="snow"
              value={localContent}
              onChange={setLocalContent}
              modules={modules}
              placeholder="Start writing your notes here..."
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {isGenerating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', paddingTop: '20px' }}>
                  <Sparkles size={20} />
                  Generating high-yield points from your notes...
                </div>
              ) : (
                <>
                  <div style={{ display: 'none' }}>
                     <div ref={revisionRef} className="print-container">
                        <style>{`
                          @media print {
                            @page { size: A4; margin: 10mm; }
                            body { 
                              -webkit-print-color-adjust: exact; 
                              print-color-adjust: exact; 
                              font-family: sans-serif;
                            }
                          }
                          .print-container {
                            color: #000;
                            background-color: #fff;
                          }
                          .print-container .ql-editor {
                            padding: 0;
                            min-height: auto;
                            color: #000;
                            font-size: 9pt;
                            line-height: 1.2;
                          }
                          .print-container .ql-editor p, 
                          .print-container .ql-editor ul, 
                          .print-container .ql-editor ol {
                            margin-bottom: 4px;
                          }
                          .print-container .ql-editor li {
                            margin-bottom: 2px !important;
                          }
                          .print-container .ql-editor h1 { font-size: 12pt; margin-top: 6px; margin-bottom: 4px; }
                          .print-container .ql-editor h2 { font-size: 11pt; margin-top: 6px; margin-bottom: 4px; }
                          .print-container .ql-editor h3 { font-size: 10pt; margin-top: 6px; margin-bottom: 4px; }
                        `}</style>
                        <h1 style={{borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '8px', fontSize: '14pt'}}>{activePage.title} - Revision Notes</h1>
                        {/* Print Quill's output exactly as HTML */}
                        <div className="ql-snow">
                           <div className="ql-editor" dangerouslySetInnerHTML={{ __html: localRevision }} />
                        </div>
                     </div>
                  </div>
                  <ReactQuill 
                    theme="snow"
                    value={localRevision}
                    onChange={setLocalRevision}
                    modules={modules}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

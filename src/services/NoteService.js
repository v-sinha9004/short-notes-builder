const API_BASE = 'http://localhost:3001/api';

export class ApiNoteService {
  async getNotebooks() {
    const res = await fetch(`${API_BASE}/notebooks`);
    return res.json();
  }
  async addNotebook(title) {
    const res = await fetch(`${API_BASE}/notebooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    return res.json();
  }
  
  async getSections(notebookId) {
    if (!notebookId) return [];
    const res = await fetch(`${API_BASE}/sections/${notebookId}`);
    return res.json();
  }
  async addSection(notebookId, title) {
    const res = await fetch(`${API_BASE}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notebookId, title })
    });
    return res.json();
  }
  
  async getPages(sectionId) {
    if (!sectionId) return [];
    const res = await fetch(`${API_BASE}/pages/${sectionId}`);
    return res.json();
  }
  async addPage(sectionId, title) {
    const res = await fetch(`${API_BASE}/pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionId, title })
    });
    return res.json();
  }
  async updatePageContent(pageId, content) {
    const res = await fetch(`${API_BASE}/pages/${pageId}/content`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    return res.json();
  }
  async updatePageRevision(pageId, revisionContent) {
    const res = await fetch(`${API_BASE}/pages/${pageId}/revision`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionContent })
    });
    return res.json();
  }
}

export const noteService = new ApiNoteService();

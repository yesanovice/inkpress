class InkPress {
    constructor() {
        this.notes = [];
        this.currentNoteId = null;
        this.theme = localStorage.getItem('inkpress-theme') || 'light';
        
        // DOM Elements
        this.notesListEl = document.getElementById('notesList');
        this.searchInput = document.getElementById('searchInput');
        this.noteTitle = document.getElementById('noteTitle');
        this.noteContent = document.getElementById('noteContent');
        this.noteDate = document.getElementById('noteDate');
        this.wordCount = document.getElementById('wordCount');
        this.emptyState = document.getElementById('emptyState');
        this.editorView = document.getElementById('editorView');
        this.newNoteBtn = document.getElementById('newNoteBtn');
        this.saveNoteBtn = document.getElementById('saveNoteBtn');
        this.deleteNoteBtn = document.getElementById('deleteNoteBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.toast = document.getElementById('toast');
        
        // Initialize
        this.init();
    }
    
    init() {
        // Load notes from localStorage
        this.loadNotes();
        
        // Set theme
        this.setTheme(this.theme);
        
        // Event listeners
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.saveNoteBtn.addEventListener('click', () => this.saveNote());
        this.deleteNoteBtn.addEventListener('click', () => this.deleteNote());
        this.searchInput.addEventListener('input', (e) => this.searchNotes(e.target.value));
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Content editable events
        this.noteContent.addEventListener('input', () => this.updateWordCount());
        
        // Render notes list
        this.renderNotesList();
        
        // Check for service worker support
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful');
                    })
                    .catch(err => {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }
    }
    
    loadNotes() {
        const savedNotes = localStorage.getItem('inkpress-notes');
        if (savedNotes) {
            this.notes = JSON.parse(savedNotes);
        }
    }
    
    saveNotes() {
        localStorage.setItem('inkpress-notes', JSON.stringify(this.notes));
    }
    
    createNewNote() {
        const newNote = {
            id: Date.now().toString(),
            title: 'Untitled Note',
            content: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.notes.unshift(newNote);
        this.saveNotes();
        this.renderNotesList();
        this.openNote(newNote.id);
    }
    
    saveNote() {
        if (!this.currentNoteId) return;
        
        const noteIndex = this.notes.findIndex(note => note.id === this.currentNoteId);
        if (noteIndex !== -1) {
            this.notes[noteIndex].title = this.noteTitle.value;
            this.notes[noteIndex].content = this.noteContent.innerHTML;
            this.notes[noteIndex].updatedAt = new Date().toISOString();
            
            this.saveNotes();
            this.renderNotesList();
            this.showToast('Note saved');
        }
    }
    
    deleteNote() {
        if (!this.currentNoteId) return;
        
        if (confirm('Are you sure you want to delete this note?')) {
            const noteIndex = this.notes.findIndex(note => note.id === this.currentNoteId);
            if (noteIndex !== -1) {
                this.notes.splice(noteIndex, 1);
                this.saveNotes();
                this.renderNotesList();
                this.showToast('Note deleted');
                this.closeEditor();
            }
        }
    }
    
    openNote(noteId) {
        const note = this.notes.find(note => note.id === noteId);
        if (note) {
            this.currentNoteId = note.id;
            this.noteTitle.value = note.title;
            this.noteContent.innerHTML = note.content;
            
            const createdAt = new Date(note.createdAt);
            const updatedAt = new Date(note.updatedAt);
            
            this.noteDate.textContent = `Created: ${createdAt.toLocaleString()} | Updated: ${updatedAt.toLocaleString()}`;
            
            this.emptyState.style.display = 'none';
            this.editorView.style.display = 'flex';
            
            this.updateWordCount();
            
            // Highlight the selected note in the list
            document.querySelectorAll('.note-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.id === note.id) {
                    item.classList.add('active');
                }
            });
            
            // Focus the title field
            this.noteTitle.focus();
        }
    }
    
    closeEditor() {
        this.currentNoteId = null;
        this.emptyState.style.display = 'flex';
        this.editorView.style.display = 'none';
        
        // Remove active class from all notes
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
        });
    }
    
    renderNotesList() {
        this.notesListEl.innerHTML = '';
        
        if (this.notes.length === 0) {
            this.notesListEl.innerHTML = '<p class="empty-notes">No notes yet. Create one!</p>';
            return;
        }
        
        this.notes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-item';
            noteEl.dataset.id = note.id;
            
            const date = new Date(note.updatedAt);
            const previewText = note.content.replace(/<[^>]*>/g, '').substring(0, 50);
            
            noteEl.innerHTML = `
                <h3>${note.title || 'Untitled Note'}</h3>
                <p>${previewText}${previewText.length === 50 ? '...' : ''}</p>
                <div class="note-date">${date.toLocaleString()}</div>
            `;
            
            noteEl.addEventListener('click', () => this.openNote(note.id));
            
            this.notesListEl.appendChild(noteEl);
        });
    }
    
    searchNotes(query) {
        const filteredNotes = this.notes.filter(note => {
            const searchContent = `${note.title} ${note.content.replace(/<[^>]*>/g, '')}`.toLowerCase();
            return searchContent.includes(query.toLowerCase());
        });
        
        this.notesListEl.innerHTML = '';
        
        if (filteredNotes.length === 0) {
            this.notesListEl.innerHTML = '<p class="empty-notes">No matching notes found</p>';
            return;
        }
        
        filteredNotes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-item';
            noteEl.dataset.id = note.id;
            
            const date = new Date(note.updatedAt);
            const previewText = note.content.replace(/<[^>]*>/g, '').substring(0, 50);
            
            noteEl.innerHTML = `
                <h3>${note.title || 'Untitled Note'}</h3>
                <p>${previewText}${previewText.length === 50 ? '...' : ''}</p>
                <div class="note-date">${date.toLocaleString()}</div>
            `;
            
            noteEl.addEventListener('click', () => this.openNote(note.id));
            
            this.notesListEl.appendChild(noteEl);
        });
    }
    
    updateWordCount() {
        const text = this.noteContent.textContent || '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        this.wordCount.textContent = `${words} words`;
    }
    
    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('inkpress-theme', theme);
        this.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    
    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new InkPress();
    
    // Add toolbar button functionality
    document.querySelectorAll('.toolbar-btn').forEach(button => {
        if (button.dataset.command) {
            button.addEventListener('click', () => {
                document.execCommand(button.dataset.command, false, null);
                document.getElementById('noteContent').focus();
            });
        }
    });
    
    // Handle mobile sidebar toggle
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    
    if (window.innerWidth <= 768) {
        document.querySelector('.app-header h1').addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
    
    // Update layout on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    });
});

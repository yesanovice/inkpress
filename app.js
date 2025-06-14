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
        this.insertImageBtn = document.getElementById('insertImageBtn');
        this.imageUpload = document.getElementById('imageUpload');
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
        this.insertImageBtn.addEventListener('click', () => this.imageUpload.click());
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        
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
    
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            this.showToast('Please select an image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '4px';
            img.style.margin = '0.5rem 0';
            
            // Create container with delete button
            const container = document.createElement('div');
            container.style.position = 'relative';
            container.style.display = 'inline-block';
            container.style.width = '100%';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '×';
            deleteBtn.style.position = 'absolute';
            deleteBtn.style.top = '5px';
            deleteBtn.style.right = '5px';
            deleteBtn.style.background = 'var(--danger-color)';
            deleteBtn.style.color = 'white';
            deleteBtn.style.border = 'none';
            deleteBtn.style.borderRadius = '50%';
            deleteBtn.style.width = '24px';
            deleteBtn.style.height = '24px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.fontSize = '16px';
            deleteBtn.style.lineHeight = '24px';
            deleteBtn.style.textAlign = 'center';
            deleteBtn.style.padding = '0';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                container.remove();
            });
            
            container.appendChild(img);
            container.appendChild(deleteBtn);
            
            // Mobile-friendly insertion
            if (this.isMobile()) {
                // For mobile, always append to the end
                this.noteContent.appendChild(container);
            } else {
                // For desktop, insert at cursor position
                this.insertAtCursor(container);
            }
            
            // Focus the editor and scroll to the new image
            this.noteContent.focus();
            container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            this.imageUpload.value = ''; // Reset file input
            this.showToast('Image added');
        };
        reader.readAsDataURL(file);
    }
    
    isMobile() {
        return window.innerWidth <= 768;
    }
    
    insertAtCursor(node) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(node);
            
            // Move cursor after the inserted image
            const newRange = document.createRange();
            newRange.setStartAfter(node);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } else {
            // If no selection or collapsed, append to the end
            this.noteContent.appendChild(node);
        }
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

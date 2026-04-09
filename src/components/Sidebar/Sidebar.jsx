// ========================================
// Sidebar — Document Management
// ========================================
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Search, FileText, Star, Trash2, MoreHorizontal,
  Edit3, StarOff, Trash, RotateCcw, LogOut, ChevronLeft,
  Clock, X, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { signOut } from '../../services/auth';
import {
  createDocument, getAllDocuments, getFavoriteDocuments,
  getDeletedDocuments, searchDocuments, softDeleteDocument,
  restoreDocument, permanentlyDeleteDocument, toggleFavorite,
  renameDocument, emptyTrash,
} from '../../services/storage';
import './Sidebar.css';

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function truncate(str, len = 60) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export default function Sidebar({ onNewDocument }) {
  const {
    user, documents, currentDoc, sidebarOpen,
    setDocuments, setCurrentDoc, setSidebarOpen,
    addDocument, updateDocument, removeDocument, addToast,
  } = useApp();

  const [tab, setTab] = useState('all'); // 'all' | 'favorites' | 'trash'
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState(null); // { docId, x, y }
  const [renaming, setRenaming] = useState(null); // docId being renamed
  const [renameValue, setRenameValue] = useState('');
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const contextRef = useRef(null);
  const renameRef = useRef(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Focus rename input
  useEffect(() => {
    if (renaming && renameRef.current) {
      renameRef.current.focus();
      renameRef.current.select();
    }
  }, [renaming]);

  // Load documents by tab
  const loadDocs = useCallback(async () => {
    try {
      let docs;
      if (searchQuery.trim()) {
        docs = await searchDocuments(searchQuery);
      } else if (tab === 'favorites') {
        docs = await getFavoriteDocuments();
      } else if (tab === 'trash') {
        docs = await getDeletedDocuments();
      } else {
        docs = await getAllDocuments();
      }
      setDocuments(docs);
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  }, [tab, searchQuery, setDocuments]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // Create new document
  const handleNewDoc = async () => {
    if (onNewDocument) {
      onNewDocument();
      return;
    }
    
    try {
      const doc = await createDocument('Untitled', '<p></p>');
      addDocument(doc);
      setCurrentDoc(doc);
      setTab('all');
      setSearchQuery('');
      addToast({ type: 'success', message: 'New document created' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to create document' });
    }
  };

  // Open document
  const handleOpenDoc = (doc) => {
    if (tab === 'trash') return; // Can't open trashed documents
    setCurrentDoc(doc);
  };

  // Context menu
  const handleContextMenu = (e, docId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ docId, x: e.clientX, y: e.clientY });
  };

  // Rename
  const handleStartRename = (doc) => {
    setRenaming(doc.id);
    setRenameValue(doc.title);
    setContextMenu(null);
  };

  const handleFinishRename = async () => {
    if (renaming && renameValue.trim()) {
      try {
        const updated = await renameDocument(renaming, renameValue.trim());
        updateDocument(updated);
        if (currentDoc?.id === renaming) {
          setCurrentDoc(updated);
        }
      } catch (err) {
        console.error('Rename error:', err);
      }
    }
    setRenaming(null);
  };

  // Favorite
  const handleToggleFavorite = async (docId) => {
    try {
      const updated = await toggleFavorite(docId);
      updateDocument(updated);
      if (currentDoc?.id === docId) {
        setCurrentDoc(updated);
      }
      setContextMenu(null);
    } catch (err) {
      console.error('Favorite error:', err);
    }
  };

  // Delete
  const handleDelete = async (docId) => {
    try {
      await softDeleteDocument(docId);
      removeDocument(docId);
      addToast({ type: 'info', message: 'Moved to trash' });
      setContextMenu(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Restore
  const handleRestore = async (docId) => {
    try {
      await restoreDocument(docId);
      loadDocs();
      addToast({ type: 'success', message: 'Document restored' });
    } catch (err) {
      console.error('Restore error:', err);
    }
  };

  // Permanently delete
  const handlePermanentDelete = async (docId) => {
    try {
      await permanentlyDeleteDocument(docId);
      loadDocs();
      addToast({ type: 'info', message: 'Permanently deleted' });
    } catch (err) {
      console.error('Permanent delete error:', err);
    }
  };

  // Empty trash
  const handleEmptyTrash = async () => {
    try {
      await emptyTrash();
      loadDocs();
      setConfirmEmpty(false);
      addToast({ type: 'info', message: 'Trash emptied' });
    } catch (err) {
      console.error('Empty trash error:', err);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const displayDocs = documents;

  return (
    <div className={`sidebar ${sidebarOpen ? 'sidebar--open' : 'sidebar--closed'}`}>
      {/* Header */}
      <div className="sidebar__header">
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">
              {user?.displayName || 'User'}
            </span>
            <span className="sidebar__user-email">
              {user?.email}
            </span>
          </div>
        </div>
        <div className="sidebar__header-actions">
          <button
            className="sidebar__icon-btn"
            onClick={handleSignOut}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
          <button
            className="sidebar__icon-btn"
            onClick={() => setSidebarOpen(false)}
            title="Close sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* New Document */}
      <button className="sidebar__new-btn" onClick={handleNewDoc}>
        <Plus size={18} />
        New Document
      </button>

      {/* Search */}
      <div className="sidebar__search">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="sidebar__search-clear" onClick={() => setSearchQuery('')}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="sidebar__tabs">
        <button
          className={`sidebar__tab ${tab === 'all' ? 'sidebar__tab--active' : ''}`}
          onClick={() => setTab('all')}
        >
          <FileText size={14} />
          All
        </button>
        <button
          className={`sidebar__tab ${tab === 'favorites' ? 'sidebar__tab--active' : ''}`}
          onClick={() => setTab('favorites')}
        >
          <Star size={14} />
          Favorites
        </button>
        <button
          className={`sidebar__tab ${tab === 'trash' ? 'sidebar__tab--active' : ''}`}
          onClick={() => setTab('trash')}
        >
          <Trash2 size={14} />
          Trash
        </button>
      </div>

      {/* Document List */}
      <div className="sidebar__list">
        {displayDocs.length === 0 ? (
          <div className="sidebar__empty">
            {tab === 'trash' ? (
              <>
                <Trash2 size={32} />
                <p>Trash is empty</p>
              </>
            ) : searchQuery ? (
              <>
                <Search size={32} />
                <p>No documents found</p>
              </>
            ) : tab === 'favorites' ? (
              <>
                <Star size={32} />
                <p>No favorites yet</p>
                <span>Right-click a document to add to favorites</span>
              </>
            ) : (
              <>
                <FileText size={32} />
                <p>No documents yet</p>
                <span>Click "New Document" to get started</span>
              </>
            )}
          </div>
        ) : (
          displayDocs.map((doc) => (
            <div
              key={doc.id}
              className={`sidebar__doc ${currentDoc?.id === doc.id ? 'sidebar__doc--active' : ''} ${tab === 'trash' ? 'sidebar__doc--trashed' : ''}`}
              onClick={() => handleOpenDoc(doc)}
              onContextMenu={(e) => handleContextMenu(e, doc.id)}
            >
              <div className="sidebar__doc-icon">
                <FileText size={16} />
                {doc.isFavorite && !doc.isDeleted && <Star size={8} className="sidebar__doc-star" />}
              </div>
              <div className="sidebar__doc-info">
                {renaming === doc.id ? (
                  <input
                    ref={renameRef}
                    className="sidebar__rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename();
                      if (e.key === 'Escape') setRenaming(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="sidebar__doc-title">{doc.title || 'Untitled'}</span>
                )}
                <span className="sidebar__doc-meta">
                  <Clock size={10} />
                  {timeAgo(doc.updatedAt)}
                  {doc.wordCount > 0 && ` · ${doc.wordCount} words`}
                </span>
              </div>
              {tab === 'trash' ? (
                <div className="sidebar__doc-actions">
                  <button
                    className="sidebar__icon-btn sidebar__icon-btn--small"
                    onClick={(e) => { e.stopPropagation(); handleRestore(doc.id); }}
                    title="Restore"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    className="sidebar__icon-btn sidebar__icon-btn--small sidebar__icon-btn--danger"
                    onClick={(e) => { e.stopPropagation(); handlePermanentDelete(doc.id); }}
                    title="Delete forever"
                  >
                    <Trash size={13} />
                  </button>
                </div>
              ) : (
                <button
                  className="sidebar__icon-btn sidebar__icon-btn--small sidebar__doc-more"
                  onClick={(e) => { e.stopPropagation(); handleContextMenu(e, doc.id); }}
                  title="More options"
                >
                  <MoreHorizontal size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Empty Trash button */}
      {tab === 'trash' && displayDocs.length > 0 && (
        <div className="sidebar__trash-actions">
          {confirmEmpty ? (
            <div className="sidebar__confirm">
              <AlertTriangle size={14} />
              <span>Delete all permanently?</span>
              <button onClick={handleEmptyTrash} className="sidebar__confirm-yes">Yes</button>
              <button onClick={() => setConfirmEmpty(false)} className="sidebar__confirm-no">No</button>
            </div>
          ) : (
            <button className="sidebar__empty-trash-btn" onClick={() => setConfirmEmpty(true)}>
              <Trash2 size={14} />
              Empty Trash
            </button>
          )}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextRef}
          className="sidebar__context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => handleStartRename(documents.find(d => d.id === contextMenu.docId))}>
            <Edit3 size={14} />
            Rename
          </button>
          <button onClick={() => handleToggleFavorite(contextMenu.docId)}>
            {documents.find(d => d.id === contextMenu.docId)?.isFavorite ? (
              <><StarOff size={14} /> Unfavorite</>
            ) : (
              <><Star size={14} /> Favorite</>
            )}
          </button>
          <div className="sidebar__context-divider" />
          <button
            className="sidebar__context-danger"
            onClick={() => handleDelete(contextMenu.docId)}
          >
            <Trash size={14} />
            Move to Trash
          </button>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { uploadToR2 } from '../services/r2Storage';
import './UploadModal.css';

const ACCEPTED_TYPES = {
  'application/pdf': { label: 'PDF', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: '📄' },
  'image/jpeg': { label: 'JPG', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '🖼️' },
  'image/jpg': { label: 'JPG', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: '🖼️' },
  'image/png': { label: 'PNG', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: '🖼️' },
  'image/gif': { label: 'GIF', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', icon: '🎞️' },
  'image/webp': { label: 'WEBP', color: '#06b6d4', bg: 'rgba(6,182,212,0.15)', icon: '🖼️' },
};

const MAX_SIZE_MB = 25;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadModal({ isOpen, onClose }) {
  const { user, userData } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [progresses, setProgresses] = useState({});
  const inputRef = useRef(null);

  const reset = () => {
    setFiles([]);
    setTitle('');
    setSubject('');
    setDescription('');
    setUploading(false);
    setUploadDone(false);
    setUploadError('');
    setProgresses({});
  };

  const handleClose = () => {
    if (!uploading) {
      reset();
      onClose();
    }
  };

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES[file.type]) {
      return `"${file.name}" is not a supported file type. Only PDF and images are allowed.`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `"${file.name}" exceeds the ${MAX_SIZE_MB}MB limit (${formatBytes(file.size)}).`;
    }
    return null;
  };

  const addFiles = useCallback((incoming) => {
    const newFiles = [];
    let error = '';
    for (const f of incoming) {
      const err = validateFile(f);
      if (err) { error = err; break; }
      if (files.length + newFiles.length >= 5) {
        error = 'You can upload up to 5 files at once.';
        break;
      }
      // Avoid duplicate names
      if (!files.find(existing => existing.name === f.name)) {
        newFiles.push(f);
      }
    }
    if (error) {
      setUploadError(error);
    } else {
      setUploadError('');
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, [files]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const onDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const onDragLeave = () => setDragActive(false);

  const removeFile = (name) => {
    setFiles(prev => prev.filter(f => f.name !== name));
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!files.length) { setUploadError('Please select at least one file.'); return; }
    if (!title.trim()) { setUploadError('Please enter a title for this upload.'); return; }

    setUploading(true);
    setUploadError('');

    try {
      const uploadedFiles = [];

      await Promise.all(files.map(async (file) => {
        if (file.type === 'application/pdf') {
          // Use Cloudflare R2 for PDFs
          try {
            const r2Result = await uploadToR2(file, (pct) => {
              setProgresses(prev => ({ ...prev, [file.name]: pct }));
            });
            uploadedFiles.push({
              name: file.name,
              type: 'PDF',
              size: file.size,
              url: r2Result.url,
              storagePath: r2Result.key,
              provider: 'r2'
            });
          } catch (err) {
            throw new Error(`R2 upload failed for ${file.name}: ${err.message}`);
          }
        } else {
          // Use Firebase for images/other types
          await new Promise((resolve, reject) => {
            const storageRef = ref(
              storage,
              `uploads/${user.uid}/${Date.now()}_${file.name}`
            );
            const task = uploadBytesResumable(storageRef, file);

            task.on('state_changed',
              (snapshot) => {
                const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setProgresses(prev => ({ ...prev, [file.name]: pct }));
              },
              reject,
              async () => {
                const url = await getDownloadURL(task.snapshot.ref);
                uploadedFiles.push({
                  name: file.name,
                  type: ACCEPTED_TYPES[file.type]?.label || 'FILE',
                  size: file.size,
                  url,
                  storagePath: task.snapshot.ref.fullPath,
                  provider: 'firebase'
                });
                resolve();
              }
            );
          });
        }
      }));

      // Save metadata to Firestore
      await addDoc(collection(db, 'uploads'), {
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        files: uploadedFiles,
        authorId: user.uid,
        authorName: user.displayName || userData?.username || 'Anonymous',
        authorUsername: userData?.username || '',
        createdAt: serverTimestamp(),
      });

      setUploadDone(true);
    } catch (err) {
      console.error(err);
      setUploadError('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const getFileInfo = (file) => ACCEPTED_TYPES[file.type] || { label: 'FILE', color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: '📎' };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="upload-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="upload-modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="upload-modal__header">
              <div className="upload-modal__header-left">
                <div className="upload-modal__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div>
                  <h2 className="upload-modal__title">New Upload</h2>
                  <p className="upload-modal__subtitle">Share PDFs & images with your community</p>
                </div>
              </div>
              <button className="upload-modal__close" onClick={handleClose} disabled={uploading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="upload-modal__body">
              {uploadDone ? (
                /* ── Success State ── */
                <motion.div
                  className="upload-success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <div className="upload-success__icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <h3>Upload Complete!</h3>
                  <p>{files.length} file{files.length !== 1 ? 's' : ''} uploaded successfully</p>
                  <div className="upload-success__files">
                    {files.map(f => (
                      <span key={f.name} className="upload-success__file-tag">{f.name}</span>
                    ))}
                  </div>
                  <button className="upload-btn upload-btn--primary" onClick={() => { reset(); onClose(); }}>
                    Done
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* ── Dropzone ── */}
                  <div
                    className={`upload-dropzone ${dragActive ? 'upload-dropzone--active' : ''} ${files.length > 0 ? 'upload-dropzone--has-files' : ''}`}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onClick={() => !uploading && inputRef.current?.click()}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => addFiles(Array.from(e.target.files))}
                      disabled={uploading}
                    />

                    {files.length === 0 ? (
                      <motion.div
                        className="upload-dropzone__content"
                        animate={dragActive ? { scale: 1.04 } : { scale: 1 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="upload-dropzone__icon-wrap">
                          <svg className="upload-dropzone__cloud" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 16 12 12 8 16"/>
                            <line x1="12" y1="12" x2="12" y2="21"/>
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                          </svg>
                        </div>
                        <p className="upload-dropzone__main">
                          {dragActive ? 'Drop it!' : 'Drag & drop files here'}
                        </p>
                        <p className="upload-dropzone__sub">or <span>browse to upload</span></p>
                        <div className="upload-dropzone__tags">
                          <span className="upload-type-badge upload-type-badge--pdf">PDF</span>
                          <span className="upload-type-badge upload-type-badge--img">JPG</span>
                          <span className="upload-type-badge upload-type-badge--img">PNG</span>
                          <span className="upload-type-badge upload-type-badge--img">WEBP</span>
                          <span className="upload-type-badge upload-type-badge--img">GIF</span>
                        </div>
                        <p className="upload-dropzone__limit">Max {MAX_SIZE_MB}MB per file · Up to 5 files</p>
                      </motion.div>
                    ) : (
                      <div className="upload-file-list" onClick={(e) => e.stopPropagation()}>
                        <AnimatePresence>
                          {files.map((file) => {
                            const info = getFileInfo(file);
                            const prog = progresses[file.name];
                            return (
                              <motion.div
                                key={file.name}
                                className="upload-file-item"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 12 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="upload-file-item__icon" style={{ background: info.bg, color: info.color }}>
                                  {info.icon}
                                </div>
                                <div className="upload-file-item__info">
                                  <p className="upload-file-item__name">{file.name}</p>
                                  <p className="upload-file-item__meta">
                                    <span className="upload-file-item__badge" style={{ background: info.bg, color: info.color }}>{info.label}</span>
                                    {formatBytes(file.size)}
                                  </p>
                                  {uploading && prog !== undefined && (
                                    <div className="upload-progress-bar">
                                      <div className="upload-progress-bar__fill" style={{ width: `${prog}%` }} />
                                    </div>
                                  )}
                                </div>
                                {!uploading && (
                                  <button className="upload-file-item__remove" onClick={() => removeFile(file.name)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                      <line x1="18" y1="6" x2="6" y2="18"/>
                                      <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                  </button>
                                )}
                                {uploading && prog === 100 && (
                                  <div className="upload-file-item__done">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>

                        {!uploading && files.length < 5 && (
                          <button
                            className="upload-add-more"
                            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"/>
                              <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Add more files
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Metadata Fields ── */}
                  <div className="upload-fields">
                    <div className="upload-field">
                      <label className="upload-field__label" htmlFor="upload-title">
                        Title <span className="upload-field__required">*</span>
                      </label>
                      <input
                        id="upload-title"
                        type="text"
                        className="upload-field__input"
                        placeholder="e.g. Calculus Midterm Notes"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={uploading}
                        maxLength={120}
                      />
                    </div>
                    <div className="upload-field">
                      <label className="upload-field__label" htmlFor="upload-subject">Subject</label>
                      <input
                        id="upload-subject"
                        type="text"
                        className="upload-field__input"
                        placeholder="e.g. Mathematics, Computer Science..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={uploading}
                        maxLength={60}
                      />
                    </div>
                    <div className="upload-field">
                      <label className="upload-field__label" htmlFor="upload-desc">Description</label>
                      <textarea
                        id="upload-desc"
                        className="upload-field__input upload-field__textarea"
                        placeholder="Brief description of this material..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={uploading}
                        maxLength={300}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* ── Error Message ── */}
                  <AnimatePresence>
                    {uploadError && (
                      <motion.div
                        className="upload-error"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="12"/>
                          <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {uploadError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Actions ── */}
                  <div className="upload-actions">
                    <button className="upload-btn upload-btn--secondary" onClick={handleClose} disabled={uploading}>
                      Cancel
                    </button>
                    <button
                      className="upload-btn upload-btn--primary"
                      onClick={handleUpload}
                      disabled={uploading || files.length === 0}
                    >
                      {uploading ? (
                        <>
                          <span className="upload-spinner" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                          Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : ''}
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

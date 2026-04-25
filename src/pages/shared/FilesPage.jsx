import { useState, useEffect } from "react";
import FileCard from "../../components/shared/FileCard";
import FileUploader from "../../components/shared/FileUploader";
import useFiles from "../../hooks/useFiles";
import { useAuth } from "../../hooks/useAuth";
import { projectAPI } from "../../utils/api";

const Toast = ({ message, type, onClose }) => (
  <div style={{
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    padding: '12px 20px', borderRadius: 10, minWidth: 260,
    background: type === 'success' ? '#d4edda' : '#f8d7da',
    color: type === 'success' ? '#155724' : '#721c24',
    border: `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
    boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 14, fontWeight: 500,
  }}>
    <span>{type === 'success' ? '✅' : '❌'} &nbsp;{message}</span>
    <button onClick={onClose} style={{
      background: 'none', border: 'none', cursor: 'pointer',
      fontSize: 18, lineHeight: 1, marginLeft: 12, color: 'inherit',
    }}>×</button>
  </div>
);

export default function FilesPage() {
  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [openFolders, setOpenFolders] = useState({});

  const {
    files, loading, uploading,
    uploadFile, deleteFile, downloadFile,
  } = useFiles(selectedProject);

  useEffect(() => {
    projectAPI.getAll().then(data => {
      const list = data.projects || data || [];
      setProjects(list);
      if (list.length > 0) {
        setSelectedProject(list[0]._id);
        // Open the first folder by default
        setOpenFolders({ [list[0]._id]: true });
      }
    }).catch(() => {});
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpload = async (file) => {
    if (!selectedProject) {
      showToast('Please select a project folder first.', 'error');
      return;
    }
    try {
      await uploadFile(file, selectedProject);
      showToast(`"${file.name}" uploaded successfully!`);
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await deleteFile(fileId);
      showToast('File deleted successfully.');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const toggleFolder = (projectId) => {
    setSelectedProject(projectId);
    setOpenFolders(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const selectedProjectObj = projects.find(p => p._id === selectedProject);

  return (
    <div className="animate-fadeUp" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>📁 File Management</h1>
        <p style={{ color: '#777', fontSize: 14 }}>Files are organized by project folders</p>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* ── Left Sidebar: Folder Tree ── */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title" style={{ fontSize: 14 }}>📂 Project Folders</div>
            </div>
            <div style={{ padding: '8px 0' }}>
              {projects.length === 0 ? (
                <p style={{ color: '#888', fontSize: 13, padding: '8px 16px' }}>No projects found.</p>
              ) : (
                projects.map(p => (
                  <div key={p._id}>
                    {/* Folder Row */}
                    <div
                      onClick={() => toggleFolder(p._id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 16px', cursor: 'pointer',
                        background: selectedProject === p._id ? '#e8f5f0' : 'transparent',
                        borderLeft: selectedProject === p._id ? '3px solid #1D9E75' : '3px solid transparent',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (selectedProject !== p._id)
                          e.currentTarget.style.background = '#f5f5f5';
                      }}
                      onMouseLeave={e => {
                        if (selectedProject !== p._id)
                          e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span style={{ fontSize: 13, transition: 'transform 0.2s', display: 'inline-block',
                        transform: openFolders[p._id] ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                      <span style={{ fontSize: 15 }}>
                        {p.icon || '📁'}
                      </span>
                      <span style={{
                        fontSize: 13, fontWeight: selectedProject === p._id ? 600 : 400,
                        color: selectedProject === p._id ? '#1D9E75' : '#333',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {p.name}
                      </span>
                    </div>

                    {/* Expanded: show file count */}
                    {openFolders[p._id] && selectedProject === p._id && (
                      <div style={{
                        padding: '4px 16px 4px 44px',
                        fontSize: 12, color: '#888',
                      }}>
                        {loading ? 'Loading...' : `${files.length} file${files.length !== 1 ? 's' : ''}`}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Folder Content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Folder Header Banner */}
          {selectedProjectObj && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              marginBottom: 18, padding: '14px 20px',
              background: '#e8f5f0', borderRadius: 12,
              border: '1px solid #b2dfce',
            }}>
              <span style={{ fontSize: 28 }}>{selectedProjectObj.icon || '📁'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: '#1D9E75' }}>
                  {selectedProjectObj.name}
                </div>
                {selectedProjectObj.fullName && (
                  <div style={{ fontSize: 12, color: '#555' }}>{selectedProjectObj.fullName}</div>
                )}
              </div>
            </div>
          )}

          {/* Upload */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">📤 Upload to {selectedProjectObj?.name || 'Project'}</div>
            </div>
            <div style={{ padding: '14px 24px' }}>
              {selectedProject ? (
                <FileUploader onUpload={handleUpload} loading={uploading} />
              ) : (
                <p style={{ color: '#888', fontSize: 14 }}>Select a project folder to upload files.</p>
              )}
            </div>
          </div>

          {/* File List */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>
              Files ({loading ? '...' : files.length})
            </h2>
          </div>

          {!selectedProject ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>Select a folder</h3>
                <p style={{ color: '#888' }}>Choose a project folder from the left to view its files.</p>
              </div>
            </div>
          ) : loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : files.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <h3>No files yet</h3>
                <p style={{ color: '#888' }}>Upload a file to this project folder above.</p>
              </div>
            </div>
          ) : (
            <div>
              {files.map(f => (
                <FileCard
                  key={f._id}
                  file={f}
                  userRole={user?.role}
                  userId={user?._id}
                  onDelete={handleDelete}
                  onDownload={downloadFile}
                  showProjectInfo={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
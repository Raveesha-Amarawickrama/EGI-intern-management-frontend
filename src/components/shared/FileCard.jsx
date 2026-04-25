import React from 'react';

const FILE_ICONS = {
  pdf: '📄', doc: '📝', docx: '📝',
  xls: '📊', xlsx: '📊', ppt: '📊', pptx: '📊',
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
  zip: '🗜️', txt: '📝',
};

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileCard = ({
  file,
  userRole,
  userId,
  onDelete,
  onDownload,
  showProjectInfo = false,
}) => {
  const icon = FILE_ICONS[file.fileType] || '📎';
  const canDelete =
    userRole === 'supervisor' ||
    (file.uploadedBy && String(file.uploadedBy._id) === String(userId));

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 12,
        padding: '14px 18px',
        marginBottom: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Icon */}
        <div style={{
          fontSize: 28,
          width: 48, height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#f5f5f5', borderRadius: 10, flexShrink: 0,
        }}>
          {icon}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600, fontSize: 14, color: '#1a1a1a',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {file.originalName}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>
            {formatSize(file.fileSize)} &nbsp;·&nbsp;
            Uploaded by <strong>{file.uploadedBy?.name || 'Unknown'}</strong>
            {file.uploaderRole && (
              <span style={{
                marginLeft: 6, fontSize: 11, padding: '1px 7px',
                background: '#e8f5e9', color: '#2e7d32', borderRadius: 20,
              }}>
                {file.uploaderRole}
              </span>
            )}
            &nbsp;·&nbsp; {new Date(file.createdAt).toLocaleDateString()}
          </div>
          {showProjectInfo && file.projectId && (
            <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
              📁 {typeof file.projectId === 'object' ? file.projectId.name : file.projectId}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => onDownload(file._id, file.originalName)}
            title="Download"
            style={{
              fontSize: 12, padding: '6px 14px', borderRadius: 7,
              border: '1px solid #ddd', background: '#f9f9f9',
              cursor: 'pointer', fontWeight: 500, color: '#333',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.target.style.background = '#e8e8e8'; }}
            onMouseLeave={e => { e.target.style.background = '#f9f9f9'; }}
          >
            ⬇ Download
          </button>

          {canDelete && (
            <button
              onClick={() => onDelete(file._id)}
              title="Delete"
              style={{
                fontSize: 12, padding: '6px 14px', borderRadius: 7,
                border: '1px solid #f5c6cb', background: '#fff5f5',
                color: '#c0392b', cursor: 'pointer', fontWeight: 500,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.target.style.background = '#f8d7da'; }}
              onMouseLeave={e => { e.target.style.background = '#fff5f5'; }}
            >
              🗑 Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCard;
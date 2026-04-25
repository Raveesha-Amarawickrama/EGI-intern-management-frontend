import React, { useRef, useState } from 'react';

const ACCEPTED = "pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,zip,txt";

const FileUploader = ({ onUpload, loading }) => {
  const inputRef = useRef();
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files) => {
    Array.from(files).forEach(f => onUpload(f));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onClick={() => !loading && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      style={{
        border: `2px dashed ${dragOver ? '#1D9E75' : '#ccc'}`,
        borderRadius: 10,
        padding: '32px 20px',
        textAlign: 'center',
        cursor: loading ? 'not-allowed' : 'pointer',
        background: dragOver ? '#e1f5ee' : '#fafafa',
        transition: 'all 0.2s',
        opacity: loading ? 0.7 : 1,
      }}
    >
      <div style={{ fontSize: 36 }}>📁</div>
      <p style={{ margin: '10px 0 4px', fontWeight: 600, color: '#333', fontSize: 15 }}>
        {loading ? 'Uploading...' : 'Click or drag files here to upload'}
      </p>
      <p style={{ fontSize: 12, color: '#888' }}>
        PDF, DOC, XLS, PPT, Images, ZIP — max 10MB
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED.split(',').map(e => `.${e}`).join(',')}
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={loading}
      />
    </div>
  );
};

export default FileUploader;
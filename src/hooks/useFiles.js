import { useState, useEffect, useCallback } from 'react';
import { fileAPI } from '../utils/api';

const useFiles = (projectId = null) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFiles = useCallback(async () => {
    if (!projectId) { setFiles([]); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fileAPI.getByProject(projectId);
      setFiles(data.files || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const uploadFile = async (file, pid = projectId) => {
    setUploading(true);
    try {
      const data = await fileAPI.upload(file, pid);
      setFiles(prev => [data.file, ...prev]);
      return data.file;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await fileAPI.delete(fileId);
      setFiles(prev => prev.filter(f => f._id !== fileId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const downloadFile = async (fileId, originalName) => {
    try {
      await fileAPI.download(fileId, originalName);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    files, loading, uploading, error,
    uploadFile, deleteFile, downloadFile,
    refetch: fetchFiles,
  };
};

export default useFiles;
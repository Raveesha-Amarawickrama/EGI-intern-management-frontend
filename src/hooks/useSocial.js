// hooks/useSocial.js
import { useState, useEffect, useCallback } from "react";
import api from "../utils/api"; // your existing api util

export const useSocial = () => {
  const [contents, setContents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  const fetchContents = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/social${params ? `?${params}` : ""}`);
      setContents(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch content");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/social/dashboard");
      setStats(res.data.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const createContent = async (data) => {
    const res = await api.post("/social", data);
    await fetchContents();
    await fetchStats();
    return res.data.data;
  };

  const markAsPosted = async (id, postUrl = "") => {
    const res = await api.patch(`/social/${id}/mark-posted`, { postUrl });
    setContents((prev) =>
      prev.map((c) => (c._id === id ? res.data.data : c))
    );
    await fetchStats();
    return res.data.data;
  };

  const submitPerformance = async (id, metrics) => {
    const res = await api.patch(`/social/${id}/performance`, metrics);
    setContents((prev) =>
      prev.map((c) => (c._id === id ? res.data.data : c))
    );
    await fetchStats();
    return res.data.data;
  };

  const deleteContent = async (id) => {
    await api.delete(`/social/${id}`);
    setContents((prev) => prev.filter((c) => c._id !== id));
    await fetchStats();
  };

  const updateContent = async (id, data) => {
    const res = await api.put(`/social/${id}`, data);
    setContents((prev) =>
      prev.map((c) => (c._id === id ? res.data.data : c))
    );
    return res.data.data;
  };

  useEffect(() => {
    fetchContents();
    fetchStats();
  }, [fetchContents, fetchStats]);

  return {
    contents,
    stats,
    loading,
    error,
    pagination,
    fetchContents,
    fetchStats,
    createContent,
    markAsPosted,
    submitPerformance,
    deleteContent,
    updateContent,
  };
};
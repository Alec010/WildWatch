import { useCallback, useEffect, useState } from 'react';
import { storage } from '../../../../lib/storage';
import { config } from '../../../../lib/config';
import { type NotificationItemDto, type NotificationResponseDto } from '../../notifications/models/NotificationModels';

export const useNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItemDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => { storage.getToken().then(setToken).catch(() => setToken(null)); }, []);

  const fetchPage = useCallback(async (reset: boolean = false) => {
    if (!token) return;
    try {
      if (reset) {
        setIsLoading(true);
        setError(null);
      }
      const currentPage: number = reset ? 0 : page;
      const res = await fetch(`${config.API.BASE_URL}/activity-logs?page=${currentPage}&size=20`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);
      const data: NotificationResponseDto = await res.json();
      setItems(prev => (reset ? data.content : [...prev, ...data.content]));
      setHasMore(data.content.length === 20);
      setPage(currentPage + 1);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, page]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    setHasMore(true);
    setPage(0);
    await fetchPage(true);
  }, [fetchPage]);

  const markAsRead = useCallback(async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${config.API.BASE_URL}/activity-logs/${id}/read`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) setItems(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {}
  }, [token]);

  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${config.API.BASE_URL}/activity-logs/read-all`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) setItems(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {}
  }, [token]);

  useEffect(() => { if (token) fetchPage(true); }, [token]);

  return { items, isLoading, isRefreshing, error, hasMore, fetchPage, refresh, markAsRead, markAllAsRead } as const;
};



import {
  Close as CloseIcon,
  DoneAll as MarkReadIcon,
  NotificationsActive as NotifActiveIcon,
  Notifications as NotifIcon,
} from '@mui/icons-material';
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
  entity_type: string | null
}

const POLL_INTERVAL = 30000;

const typeLabel: Record<string, string> = {
  eligibility_change: 'Elegibilidad',
  new_certificate: 'Certificado',
  override_applied: 'Override',
  override_expired: 'Expirado',
  diploma_issued: 'Diploma',
  exam_graded: 'Examen',
};

const typeColor: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  eligibility_change: 'success',
  new_certificate: 'info',
  override_applied: 'warning',
  override_expired: 'error',
  diploma_issued: 'success',
  exam_graded: 'info',
};

export function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const token = localStorage.getItem('token') || '';

  const fetchUnreadCount = useCallback(async () => {
    if (!token) { return; }
    try {
      const data = await api.get<{ count: number }>('/notifications/unread-count', token);
      setUnreadCount(data.count);
    }
    catch {
      // silent — bell just stays at last known count
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) { return; }
    setLoading(true);
    try {
      const data = await api.get<{ data: NotificationItem[], pagination: { total: number, unread_count: number } }>(
        '/notifications?limit=50',
        token,
      );
      setNotifications(data.data || []);
      setUnreadCount(data.pagination?.unread_count ?? 0);
    }
    catch {
      // silent
    }
    finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchUnreadCount();
    const interval = setInterval(() => { void fetchUnreadCount(); }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleOpen = () => {
    setOpen(true);
    void fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      const data = await api.put<{ success: boolean, count: number }>('/notifications/read-all', {}, token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      setToast(`Se marcaron ${data.count} como leídas`);
    }
    catch {
      // silent
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`, {}, token);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    catch {
      // silent
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) { return 'Ahora'; }
    if (diffMin < 60) { return `Hace ${diffMin}min`; }
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) { return `Hace ${diffH}h`; }
    return d.toLocaleDateString();
  };

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton color="inherit" onClick={handleOpen} data-testid="notif-bell">
          <Badge
            badgeContent={unreadCount}
            color="error"
            invisible={unreadCount === 0}
            overlap="circular"
          >
            {unreadCount > 0 ? <NotifActiveIcon /> : <NotifIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: 400, maxWidth: '90vw' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
          <Typography variant="h6">Notificaciones</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {unreadCount > 0 && (
              <Button size="small" startIcon={<MarkReadIcon />} onClick={() => { void handleMarkAllRead(); }}>
                Todas leídas
              </Button>
            )}
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Divider />
        {loading
          ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                Cargando...
              </Typography>
            )
          : notifications.length === 0
            ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
                  No hay notificaciones
                </Typography>
              )
            : (
                <List sx={{ overflow: 'auto', flex: 1 }}>
                  {notifications.map(n => (
                    <ListItemButton
                      key={n.id}
                      onClick={() => { if (!n.read) { void handleMarkRead(n.id); } }}
                      sx={{
                        opacity: n.read ? 0.7 : 1,
                        borderLeft: n.read ? 'none' : '3px solid',
                        borderColor: n.read ? 'transparent' : 'primary.main',
                        py: 2,
                      }}
                      data-testid={`notif-item-${n.id}`}
                    >
                      <ListItemText
                        primary={(
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={typeLabel[n.type] || n.type}
                              size="small"
                              color={typeColor[n.type] || 'default'}
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                            {!n.read && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'primary.main',
                                }}
                              />
                            )}
                          </Box>
                        )}
                        secondary={(
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.primary" gutterBottom>
                              {n.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {n.body}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                              {formatTime(n.created_at)}
                            </Typography>
                          </Box>
                        )}
                      />
                      {!n.read && (
                        <Tooltip title="Marcar leída">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleMarkRead(n.id);
                            }}
                          >
                            <MarkReadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItemButton>
                  ))}
                </List>
              )}
      </Drawer>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
}

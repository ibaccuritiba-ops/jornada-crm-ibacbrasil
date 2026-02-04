// Hook para gerenciar notificações
import { useState, useCallback } from 'react';
import { Notification } from '../types';

interface UseNotificationsReturn {
    notifications: Notification[];
    setNotifications: (notifications: Notification[]) => void;
    approveNotification: (id: string) => void;
    rejectNotification: (id: string) => void;
}

export const useNotifications = (): UseNotificationsReturn => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const approveNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const rejectNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return {
        notifications,
        setNotifications,
        approveNotification,
        rejectNotification
    };
};

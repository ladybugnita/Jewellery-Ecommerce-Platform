import React, { useState, useEffect } from 'react';
import { userAPI, adminAPI } from '../services/api';
import { FaBell, FaCheck, FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Notifications.css';

const Notifications = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'ADMIN' || userRole === 'STAFF';
  const api = isAdmin ? adminAPI : userAPI;

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.getNotifications();
      let notifs = response.data.data || [];
      notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      if (typeof api.getUnreadNotificationCount === 'function') {
        const response = await api.getUnreadNotificationCount();
        setUnreadCount(response.data.data || 0);
      } else {
        console.warn('getUnreadNotificationCount is not a function');
        if (notifications.length > 0) {
          const unread = notifications.filter(n => n.read === false || n.isRead === false).length;
          setUnreadCount(unread);
        }
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead(notificationId);
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      fetchNotifications();
      fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    handleMarkAsRead(notification.id);
    
    if (notification.type === 'LOAN_REQUEST') {
      if (isAdmin) {
        navigate('/admin/loans', { state: { highlightLoanId: notification.referenceId } });
      }
    } else if (notification.type === 'LOAN_APPROVED' || notification.type === 'LOAN_REJECTED') {
      navigate('/user/my-loans');
    }
    
    setShowDropdown(false);
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'LOAN_REQUEST':
      case 'LOAN_REQUESTED': return <FaMoneyBillWave className="notif-icon request" />;
      case 'LOAN_APPROVED': return <FaCheck className="notif-icon approved" />;
      case 'LOAN_REJECTED': return <FaTimes className="notif-icon rejected" />;
      default: return <FaBell className="notif-icon default" />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return t('common.just_now', 'Just now');
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('common.just_now', 'Just now');
    if (diffMins < 60) return t('common.minutes_ago', { count: diffMins, defaultValue: '{{count}} min ago' });
    if (diffHours < 24) return t('common.hours_ago', { count: diffHours, defaultValue: '{{count}} hour ago' });
    return t('common.days_ago', { count: diffDays, defaultValue: '{{count}} day ago' });
  };

  const getNotificationMessage = (notif) => {
    const messageKey = `notifications.messages.${notif.type}`;
    return t(messageKey, { 
      defaultValue: notif.message, 
      ...(notif.data || {}) 
    });
  };

  const getNotificationTitle = (notif) => {
    return t(`notifications.types.${notif.type}`, notif.title);
  };

  return (
    <div className="notifications-container">
      <div className="notification-icon" onClick={() => setShowDropdown(!showDropdown)}>
        <FaBell />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </div>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>{t('notifications.title', 'Notifications')}</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={handleMarkAllAsRead}>
                {t('notifications.mark_all_read', 'Mark all as read')}
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">{t('common.loading')}</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">{t('notifications.empty', 'No notifications')}</div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notification-item ${(!notif.read && !notif.isRead) ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notification-icon-wrapper">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{getNotificationTitle(notif)}</div>
                    <div className="notification-message">{getNotificationMessage(notif)}</div>
                    <div className="notification-time">{formatTime(notif.createdAt)}</div>
                  </div>
                  {(!notif.read && !notif.isRead) && <span className="unread-dot"></span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
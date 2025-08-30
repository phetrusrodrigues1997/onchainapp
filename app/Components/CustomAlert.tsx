'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  autoClose?: boolean;
  duration?: number;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  autoClose = false,
  duration = 3000
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, duration, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          bg: 'bg-purple-100',
          border: 'border-purple-200',
          icon: <AlertCircle className="w-6 h-6 text-purple-700" />,
          titleColor: 'text-purple-800',
          messageColor: 'text-purple-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
          titleColor: 'text-yellow-800',
          messageColor: 'text-yellow-700'
        };
      default: // info
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <Info className="w-6 h-6 text-blue-600" />,
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Alert Container */}
      <div className={`relative bg-white rounded-2xl shadow-2xl border ${styles.border} max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200`}>
        {/* Header with colored accent */}
        <div className={`${styles.bg} px-6 py-4 border-b ${styles.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {styles.icon}
              {title && (
                <h3 className={`text-lg font-semibold ${styles.titleColor}`}>
                  {title}
                </h3>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          <p className={`text-sm leading-relaxed ${styles.messageColor}`}>
            {message}
          </p>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors font-medium text-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook for easy alert management
export const useCustomAlert = () => {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    autoClose?: boolean;
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const showAlert = (
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'info',
    title?: string,
    autoClose: boolean = false
  ) => {
    setAlertState({
      isOpen: true,
      message,
      type,
      title,
      autoClose
    });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    alertState,
    showAlert,
    closeAlert
  };
};
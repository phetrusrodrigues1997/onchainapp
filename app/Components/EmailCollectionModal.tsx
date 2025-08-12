'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mail } from 'lucide-react';

interface EmailCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  sourcePage: 'PredictionPot' | 'AI' | 'PrivatePot' | 'CreatePot';
}

export const EmailCollectionModal: React.FC<EmailCollectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sourcePage
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(email);
      // Modal will be closed by parent component
    } catch (error) {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={!isSubmitting ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-none shadow-2xl max-w-md w-full border-2 border-black animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-light text-black">Stay Updated</h2>
          </div>
          {!isSubmitting && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black transition-colors p-1"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6 leading-relaxed">
            Get notified about new features, market updates, and exclusive opportunities on PrediWin.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email address"
                className="w-full p-4 border-2 border-gray-200 rounded-none focus:border-black focus:outline-none text-black placeholder-gray-400 transition-colors"
                disabled={isSubmitting}
                autoComplete="email"
              />
              {error && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-600 rounded-full" />
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light"
              >
                Maybe Later
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-black text-white hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-light flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
          </form>

          <p className="text-xs text-gray-400 mt-4 text-center">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

// Hook for managing email collection state
export const useEmailCollection = (walletAddress?: string) => {
  const [showModal, setShowModal] = useState(false);
  const [isEmailCollected, setIsEmailCollected] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // One week in milliseconds
const DISMISSAL_DURATION = 3 * 24 * 60 * 60 * 1000;

  // Get dismissal key for localStorage
  const getDismissalKey = (address: string) => `email-modal-dismissed-${address.toLowerCase()}`;

  // Check if dismissal has expired
  const isDismissalExpired = useCallback((dismissalData: string): boolean => {
    // If email was collected, it's permanently dismissed
    if (dismissalData === 'email-collected') {
      return false; // Never expires
    }
    
    const dismissedAt = parseInt(dismissalData);
    if (isNaN(dismissedAt)) {
      return true; // Invalid timestamp, treat as expired
    }
    
    const now = Date.now();
    return (now - dismissedAt) > DISMISSAL_DURATION;
  }, [DISMISSAL_DURATION]);

  // Load dismissal state from localStorage on mount
  useEffect(() => {
    if (walletAddress) {
      const dismissalKey = getDismissalKey(walletAddress);
      const dismissalData = localStorage.getItem(dismissalKey);
      
      if (dismissalData) {
        if (dismissalData === 'email-collected') {
          // Email was collected, permanently dismissed
          setIsDismissed(true);
          setIsEmailCollected(true);
        } else if (isDismissalExpired(dismissalData)) {
          // Dismissal has expired, remove it and allow modal to show
          localStorage.removeItem(dismissalKey);
          setIsDismissed(false);
        } else {
          // Dismissal is still active for 1 week
          setIsDismissed(true);
        }
      } else {
        setIsDismissed(false);
      }
    }
  }, [walletAddress, isDismissalExpired]);

  const showEmailModal = () => {
    // Only show modal if email hasn't been collected AND modal hasn't been dismissed (or dismissal expired)
    if (!isEmailCollected && !isDismissed) {
      setShowModal(true);
    }
  };

  const hideEmailModal = () => {
    setShowModal(false);
    // Mark as dismissed and save timestamp to localStorage
    setIsDismissed(true);
    
    if (walletAddress) {
      const dismissalKey = getDismissalKey(walletAddress);
      const dismissalTimestamp = Date.now().toString();
      localStorage.setItem(dismissalKey, dismissalTimestamp);
    }
  };

  const markEmailCollected = () => {
    setIsEmailCollected(true);
    setShowModal(false);
    // When email is collected, mark as permanently dismissed (no timestamp needed)
    setIsDismissed(true);
    
    if (walletAddress) {
      const dismissalKey = getDismissalKey(walletAddress);
      // Use a special value to indicate email was collected (permanent dismissal)
      localStorage.setItem(dismissalKey, 'email-collected');
    }
  };

  const resetDismissal = () => {
    setIsDismissed(false);
    
    if (walletAddress) {
      const dismissalKey = getDismissalKey(walletAddress);
      localStorage.removeItem(dismissalKey);
    }
  };

  return {
    showModal,
    isEmailCollected,
    isDismissed,
    showEmailModal,
    hideEmailModal,
    markEmailCollected,
    setIsEmailCollected,
    resetDismissal
  };
};
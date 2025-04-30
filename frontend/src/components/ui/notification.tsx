"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Calendar, Info } from 'lucide-react';
import { Button } from './button';

interface NotificationProps {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: (id: string) => void;
}

export function Notification({
  id,
  title,
  message,
  type,
  action,
  onDismiss
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(id), 300); // Wait for exit animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <Bell className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800 p-4 w-full max-w-sm"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-white">{title}</p>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
              {action && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-xs"
                    onClick={action.onClick}
                  >
                    <Calendar className="h-3 w-3" />
                    {action.label}
                  </Button>
                </div>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className="bg-white dark:bg-neutral-900 rounded-md inline-flex text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 focus:outline-none"
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => onDismiss(id), 300);
                }}
              >
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function NotificationContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {children}
    </div>
  );
}

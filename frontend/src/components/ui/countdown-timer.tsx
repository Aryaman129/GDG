"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './card';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date;
  title: string;
  description: string;
}

export function CountdownTimer({ targetDate, title, description }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setIsExpired(true);
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        };
      }
      
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };
    
    // Initial calculation
    setTimeLeft(calculateTimeLeft());
    
    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    
    // Clean up
    return () => clearInterval(timer);
  }, [targetDate]);
  
  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds }
  ];

  return (
    <Card className="border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
          </div>
        </div>
        
        {isExpired ? (
          <div className="text-center py-3 bg-neutral-100 dark:bg-neutral-800 rounded-md">
            <p className="text-neutral-600 dark:text-neutral-400">This session has started</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            {timeUnits.map((unit, index) => (
              <div key={unit.label} className="flex flex-col">
                <motion.div 
                  className="bg-neutral-100 dark:bg-neutral-800 rounded-md py-2 px-1 mb-1 text-xl font-bold text-neutral-900 dark:text-white"
                  key={`${unit.label}-${unit.value}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {String(unit.value).padStart(2, '0')}
                </motion.div>
                <span className="text-xs text-neutral-500 dark:text-neutral-500">{unit.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

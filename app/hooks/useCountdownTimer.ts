import { useState, useEffect } from 'react';
import { getTimeUntilMidnight } from '../Database/config';

export const useCountdownTimer = () => {
  const [timeUntilMidnight, setTimeUntilMidnight] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      setTimeUntilMidnight(getTimeUntilMidnight());
    };

    updateCountdown(); // Initial calculation
    
    const interval = setInterval(() => {
      updateCountdown();
    }, 1000); // Update every second for live timer
    
    return () => clearInterval(interval);
  }, []);

  return timeUntilMidnight;
};
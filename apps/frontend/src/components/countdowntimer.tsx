import {useState, useEffect} from "react";

interface CountdownTimerProps {
  endTime: string; // ISO string
  onExpired?: () => void;
}

export function CountdownTimer({endTime, onExpired}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining === 0 && onExpired) {
        onExpired();
      }
      
      return remaining;
    };

    // Calcul initial
    calculateTimeRemaining();

    // Miàj chaque seconde
    const interval = setInterval(() => {
      calculateTimeRemaining();
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onExpired]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Terminé";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days}j ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return <span>{formatTime(timeRemaining)}</span>;
}

// Version simplifiée sans secondes pour les listes
interface SimpleTimerProps {timeRemainingSeconds: number;}

export function SimpleTimer({timeRemainingSeconds}: SimpleTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeRemainingSeconds);

  useEffect(() => {
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Terminé";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}j ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return <span>{formatTime(timeRemaining)}</span>;
}
import { useEffect, useState } from 'react';

export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Custom hook that provides window size and listens to resize events.
 * Centralizes all window resize logic to prevent duplication and sync issues.
 * 
 * @returns {WindowSize} Object with current window width and height
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Handler to call on window resize
    const handleResize = () => {
      // Only update if we're in a browser environment
      if (typeof window !== 'undefined') {
        const newSize = {
          width: window.innerWidth,
          height: window.innerHeight,
        };
        console.log('🪟 useWindowSize: Window resize detected', newSize);
        setWindowSize(newSize);
      }
    };

    // Set size immediately on mount
    console.log('🪟 useWindowSize: Initial setup');
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    console.log('🪟 useWindowSize: Event listener added');

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('resize', handleResize);
      console.log('🪟 useWindowSize: Event listener removed');
    };
  }, []); // Empty dependency array ensures this only runs once

  return windowSize;
} 
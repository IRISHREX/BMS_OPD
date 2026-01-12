import { useState, useEffect } from 'react';

export const useToolbar = () => {
  const [showToolbar, setShowToolbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const controlToolbar = () => {
    if (typeof window !== 'undefined') {
      if (window.scrollY > lastScrollY) {
        // if scroll down hide the toolbar
        setShowToolbar(false);
      } else {
        // if scroll up show the toolbar
        setShowToolbar(true);
      }
      // remember current page location to use in the next move
      setLastScrollY(window.scrollY);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlToolbar);

      // cleanup function
      return () => {
        window.removeEventListener('scroll', controlToolbar);
      };
    }
  }, [lastScrollY]);

  return { showToolbar };
};

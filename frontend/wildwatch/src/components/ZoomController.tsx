'use client';

import { useEffect } from 'react';

export default function ZoomController() {
  useEffect(() => {
    // Check if we're on a desktop screen and apply zoom
    const applyZoom = () => {
      if (window.innerWidth >= 1024) {
        // Apply CSS zoom if supported
        const html = document.documentElement;
        html.style.zoom = '0.75';
        
        // Fallback for browsers that don't support CSS zoom
        if (html.style.zoom === '') {
          // Use transform scale as fallback
          html.style.transform = 'scale(0.75)';
          html.style.transformOrigin = 'top left';
          html.style.width = '133.33%';
          html.style.height = '133.33%';
          html.style.overflow = 'hidden';
        }
      }
    };

    // Apply zoom on load
    applyZoom();

    // Reapply zoom on resize
    window.addEventListener('resize', applyZoom);

    return () => {
      window.removeEventListener('resize', applyZoom);
    };
  }, []);

  return null;
}

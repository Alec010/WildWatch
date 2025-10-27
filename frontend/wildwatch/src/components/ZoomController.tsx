'use client';

import { useEffect } from 'react';

export default function ZoomController() {
  useEffect(() => {
    // Check if we're on a desktop screen and apply zoom
    const applyZoom = () => {
      if (window.innerWidth >= 1024) {
        const html = document.documentElement;
        const body = document.body;
        
        // Apply CSS zoom
        html.style.zoom = '0.75';
        
        // Fix viewport height issues
        html.style.height = '100vh';
        html.style.overflow = 'hidden';
        body.style.height = '100vh';
        body.style.overflow = 'auto';
        
        // Ensure proper scaling
        body.style.transform = 'scale(1)';
        body.style.transformOrigin = 'top left';
      } else {
        // Reset zoom on mobile
        const html = document.documentElement;
        const body = document.body;
        html.style.zoom = '1';
        html.style.height = 'auto';
        html.style.overflow = 'auto';
        body.style.height = 'auto';
        body.style.overflow = 'auto';
        body.style.transform = 'none';
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

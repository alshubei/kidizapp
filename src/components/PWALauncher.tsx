import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Component to handle PWA launches and ensure proper routing
 * Redirects to home if app is launched as PWA from a non-home URL
 */
export const PWALauncher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if app is running as PWA (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    // If launched as PWA and not on home page, redirect to home
    // This ensures the app always starts from home when launched as PWA
    if (isStandalone && location.pathname !== '/') {
      // Small delay to ensure proper initialization
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [navigate, location.pathname]);

  return null;
};


import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * RouteGuard - Ensures user starts at Home on fresh load
 * 
 * Redirects direct deep links to Home first, storing intended destination.
 * After language selection at Home, user can continue to intended screen.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a fresh page load (not a navigation within the app)
    const isInitialLoad = !sessionStorage.getItem('app-has-loaded');

    // If user directly loads a deep link on fresh load, redirect to Home
    if (isInitialLoad && location.pathname !== '/') {
      // Mark that we've loaded
      sessionStorage.setItem('app-has-loaded', 'true');
      
      // Store intended destination
      sessionStorage.setItem('intended-destination', location.pathname);
      
      // Redirect to Home
      navigate('/', { replace: true });
    } else if (!isInitialLoad && sessionStorage.getItem('intended-destination')) {
      // If user is now on Home and has an intended destination, they can navigate manually
      // We don't auto-navigate; let them choose
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}

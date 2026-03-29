export const useSubdomain = () => {
  const getSubdomain = (): 'admin' | 'customer' => {
    if (typeof window === 'undefined') return 'customer';
    
    const hostname = window.location.hostname;
    const isDev = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    
    if (isDev) {
      // Development: check query param
      const params = new URLSearchParams(window.location.search);
      return params.get('scope') === 'admin' ? 'admin' : 'customer';
    }
    
    // Production: check subdomain
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] === 'admin') {
      return 'admin';
    }
    
    return 'customer';
  };

  return { subdomain: getSubdomain() };
};

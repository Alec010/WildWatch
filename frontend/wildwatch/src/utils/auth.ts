export const checkAuth = async () => {
  console.log('Starting authentication check...');
  try {
    console.log('Making request to /api/auth/profile...');
    const response = await fetch('http://localhost:8080/api/auth/profile', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });

    console.log('Profile response status:', response.status);

    if (!response.ok) {
      console.log('Authentication failed - response not OK');
      throw new Error('Not authenticated');
    }

    const data = await response.json();
    console.log('Authentication successful, user data:', data);

    
    localStorage.setItem('user', JSON.stringify(data));
    
    return { isAuthenticated: true, user: data };
  } catch (error) {
    console.error('Authentication check failed:', error);
    return { isAuthenticated: false, user: null };
  }
};

export const getUserFromStorage = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error reading user from storage:', error);
    return null;
  }
}; 
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { auth } from '../firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  // Demo mode user for testing
  const createDemoUser = () => {
    const demoUser = {
      uid: "demo_user_authenticated",
      email: "demo@elysian.com",
      displayName: "Demo User",
      getIdToken: async () => {
        return btoa(JSON.stringify({
          user_id: "demo_user_authenticated",
          email: "demo@elysian.com",
          name: "Demo User",
          sub: "demo_user_authenticated"
        }));
      }
    };
    return demoUser;
  };

  // Get Firebase ID token for API calls
  const getAuthToken = async () => {
    if (currentUser) {
      try {
        const token = await currentUser.getIdToken();
        setAuthToken(token);
        return token;
      } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
      }
    }
    return null;
  };

  // Sign up function
  const signup = async (email, password, displayName) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with display name
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      
      toast.success(`Welcome to Elysian, ${displayName || 'learner'}! 🎉`);
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Sign in function
  const signin = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      toast.success(`Welcome back, ${user.displayName || 'learner'}! 🌟`);
      return user;
    } catch (error) {
      console.error('Signin error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Sign out function
  const logout = async () => {
    try {
      await signOut(auth);
      setAuthToken(null);
      toast.success('Successfully signed out. See you soon! 👋');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out. Please try again.');
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent! Check your inbox. 📧');
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) throw new Error('No user signed in');
    
    try {
      await updateProfile(currentUser, updates);
      toast.success('Profile updated successfully! ✨');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
      throw error;
    }
  };

  // Delete user account
  const deleteAccount = async () => {
    if (!currentUser) throw new Error('No user signed in');
    
    try {
      await deleteUser(currentUser);
      toast.success('Account deleted successfully.');
    } catch (error) {
      console.error('Account deletion error:', error);
      
      let errorMessage = 'Failed to delete account. Please try again.';
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign in again before deleting your account.';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        setCurrentUser(user);
        setLoading(false);
        
        if (user) {
          // Get initial auth token
          await getAuthToken();
          setDemoMode(false);
        } else {
          setAuthToken(null);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.log('Firebase not available, using demo mode');
      // If Firebase fails, use demo mode
      setDemoMode(true);
      setLoading(false);
      
      // Set demo user and token
      const demoUser = createDemoUser();
      setCurrentUser(demoUser);
      
      // Create demo token
      demoUser.getIdToken().then(token => {
        setAuthToken(token);
      });
    }
  }, []);

  // For demo purposes, if no user is authenticated after loading, create a demo user
  useEffect(() => {
    if (!loading && !currentUser && !demoMode) {
      console.log('No authentication detected, enabling demo mode');
      setDemoMode(true);
      
      const demoUser = createDemoUser();
      setCurrentUser(demoUser);
      
      demoUser.getIdToken().then(token => {
        setAuthToken(token);
      });
    }
  }, [loading, currentUser, demoMode]);

  // Refresh auth token periodically
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(async () => {
        await getAuthToken();
      }, 55 * 60 * 1000); // Refresh every 55 minutes

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const value = {
    currentUser,
    authToken,
    loading,
    demoMode,
    signup,
    signin,
    logout,
    resetPassword,
    updateUserProfile,
    deleteAccount,
    getAuthToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
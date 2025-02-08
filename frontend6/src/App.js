import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BookCatalog from './components/books/BookCatalog';
import BookScanner from './components/books/BookScanner';
import AdminDashboard from './components/admin/AdminDashboard';
import UserDashboard from './components/user/UserDashboard';
import IssuedBooks from './components/user/IssuedBooks';
import FineManagement from './components/user/FineManagement';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    error: {
      main: '#f44336',
    },
    success: {
      main: '#4caf50',
    },
  },
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser._id) {
          setIsAuthenticated(true);
          setUser(parsedUser);
        } else {
          // Invalid user data, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Invalid JSON, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Route for authenticated users (both admin and regular users)
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  // Route only for admin users
  const AdminRoute = ({ children }) => {
    return isAuthenticated && user?.role === 'admin' ? (
      children
    ) : (
      <Navigate to="/" />
    );
  };

  // Route only for regular users
  const UserRoute = ({ children }) => {
    return isAuthenticated && user?.role === 'user' ? (
      children
    ) : (
      <Navigate to="/" />
    );
  };

  return (
    <>
      <Router>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastContainer position="top-right" autoClose={3000} />
          <Layout user={user} setAuth={setIsAuthenticated} onLogout={handleLogout}>
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  !isAuthenticated ? (
                    <Login setAuth={setIsAuthenticated} setUser={setUser} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  !isAuthenticated ? (
                    <Register setAuth={setIsAuthenticated} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />

              {/* Common Routes */}
              <Route
                path="/"
                element={
                  isAuthenticated ? (
                    user?.role === 'admin' ? (
                      <Navigate to="/admin" />
                    ) : (
                      <BookCatalog />
                    )
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Scanner Route - Available for both admin and users */}
              <Route
                path="/scanner"
                element={
                  <PrivateRoute>
                    <BookScanner />
                  </PrivateRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              {/* User Routes */}
              <Route
                path="/dashboard"
                element={
                  <UserRoute>
                    <UserDashboard />
                  </UserRoute>
                }
              />
              <Route
                path="/issued-books"
                element={
                  <UserRoute>
                    <IssuedBooks />
                  </UserRoute>
                }
              />
              <Route
                path="/fines"
                element={
                  <UserRoute>
                    <FineManagement />
                  </UserRoute>
                }
              />
            </Routes>
          </Layout>
        </ThemeProvider>
      </Router>
    </>
  );
};

export default App;

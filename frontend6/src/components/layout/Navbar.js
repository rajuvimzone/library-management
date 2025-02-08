import React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  useTheme,
  useMediaQuery,
  Link,
} from '@mui/material';
import {
  Menu as MenuIcon,
  QrCodeScanner,
  LibraryBooks,
  MenuBook,
  Logout,
  MonetizationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="primary"
              aria-label="menu"
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="div"
            color="primary"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <LibraryBooks sx={{ mr: 1 }} />
            Library Management
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isMobile && (
            <>
              {isAdmin ? (
                <Button
                  color="primary"
                  startIcon={<MenuBook />}
                  onClick={() => navigate('/admin')}
                >
                  Admin Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    color="primary"
                    startIcon={<MenuBook />}
                    onClick={() => navigate('/')}
                  >
                    Browse Books
                  </Button>
                  {/* <Button
                    color="primary"
                    startIcon={<LibraryBooks />}
                    onClick={() => navigate('/issued-books')}
                  >
                    My Books
                  </Button> */}
                  <Button
                    color="primary"
                    startIcon={<MonetizationOn />}
                    onClick={() => navigate('/fines')}
                  >
                    My Fines
                  </Button>
                  <Button
                    color="primary"
                    startIcon={<QrCodeScanner />}
                    onClick={() => navigate('/scanner')}
                  >
                    Scan Book
                  </Button>
                </>
              )}
              <Button
                color="primary"
                startIcon={<Logout />}
                onClick={handleLogout}
                size={isMobile ? 'small' : 'medium'}
              >
                {isMobile ? '' : 'Logout'}
              </Button>
            </>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 32,
                height: 32,
                fontSize: '0.875rem',
              }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
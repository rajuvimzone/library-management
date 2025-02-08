import React from 'react';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar';

const Layout = ({ user, setAuth, onLogout, children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      {user && <Navbar user={user} onLogout={onLogout} />}
      <Container
        component="main"
        maxWidth="xl"
        sx={{
          flexGrow: 1,
          py: 4,
          px: { xs: 2, sm: 4 },
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout;

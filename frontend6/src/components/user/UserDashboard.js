import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography
} from '@mui/material';
import BorrowedBooks from './BorrowedBooks';
import TransactionHistory from './TransactionHistory';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const UserDashboard = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Dashboard
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Currently Borrowed" />
          <Tab label="Transaction History" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <BorrowedBooks />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <TransactionHistory />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default UserDashboard;

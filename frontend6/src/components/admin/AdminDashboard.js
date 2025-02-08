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
import BookManagement from './BookManagement';
import UserManagement from './UserManagement';
import TransactionLog from './TransactionLog';
import UserApprovalList from '../UserApprovalList';
import BulkUpload from './BulkUpload';
import ReturnManagement from './ReturnManagement';

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

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Book Management" />
          <Tab label="User Management" />
          <Tab label="Return Books" />
          <Tab label="Transaction Log" />
          <Tab label="User Approvals" />
          {/* <Tab label="Bulk Upload" /> */}
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <BookManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <UserManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <ReturnManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <TransactionLog />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <UserApprovalList />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <BulkUpload />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;

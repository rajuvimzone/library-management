import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from '../../utils/axiosConfig';

const UserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        setProfile(user);

        const transactionsResponse = await axios.get('/transactions/my-transactions');
        setTransactions(transactionsResponse.data);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.response?.data?.message || 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, my: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        
        {profile && (
          <Box mb={4}>
            <Typography variant="h6" color="primary" gutterBottom>
              User Information
            </Typography>
            <Typography>Name: {profile.name}</Typography>
            <Typography>Email: {profile.email}</Typography>
            <Typography>Role: {profile.role}</Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" color="primary" gutterBottom>
          Recent Transactions
        </Typography>
        
        {transactions.length > 0 ? (
          <List>
            {transactions.map((transaction) => (
              <ListItem key={transaction._id}>
                <ListItemText
                  primary={transaction.book?.title}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        Status: {transaction.status}
                      </Typography>
                      <br />
                      Issue Date: {new Date(transaction.issueDate).toLocaleDateString()}
                      <br />
                      Due Date: {new Date(transaction.dueDate).toLocaleDateString()}
                      {transaction.returnDate && (
                        <>
                          <br />
                          Return Date: {new Date(transaction.returnDate).toLocaleDateString()}
                        </>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">
            No transaction history found.
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default UserProfile;

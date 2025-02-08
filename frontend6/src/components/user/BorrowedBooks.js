import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import axios from '../../utils/axiosConfig';
import { format, isAfter } from 'date-fns';

const BorrowedBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchBorrowedBooks = useCallback(async () => {
    try {
      setError('');
      const response = await axios.get('/transactions/my-transactions');
      
      // Filter out transactions with null books and sort by due date
      const validTransactions = response.data
        .filter(transaction => transaction.book && transaction.book._id)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      
      setBooks(validTransactions);
    } catch (err) {
      console.error('Error fetching borrowed books:', err);
      setError('Failed to fetch borrowed books');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when lastUpdate changes
  useEffect(() => {
    fetchBorrowedBooks();
  }, [fetchBorrowedBooks, lastUpdate]);

  // Poll for updates every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleReturn = async () => {
    if (!selectedBook?.book?._id) {
      setError('Invalid book selection');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/transactions/return', {
        bookId: selectedBook.book._id
      });
      
      setReturnDialogOpen(false);
      setSelectedBook(null);
      setLastUpdate(Date.now()); // Trigger refresh
      
    } catch (err) {
      console.error('Error returning book:', err);
      setError(err.response?.data?.message || 'Failed to return book');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    try {
      return isAfter(new Date(), new Date(dueDate));
    } catch (error) {
      console.error('Date comparison error:', error);
      return false;
    }
  };

  if (loading && !books.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {books.length > 0 ? (
          books.map((transaction) => (
            transaction.book && (
              <Grid item xs={12} sm={6} md={4} key={transaction._id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative'
                  }}
                >
                  {isOverdue(transaction.dueDate) && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'error.main'
                      }}
                    >
                      <WarningIcon color="error" sx={{ mr: 1 }} />
                      <Typography variant="caption" color="error">
                        Overdue
                      </Typography>
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {transaction.book.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      by {transaction.book.author}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Borrowed:</strong> {formatDate(transaction.issueDate)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Due Date:</strong> {formatDate(transaction.dueDate)}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={transaction.status}
                          color={isOverdue(transaction.dueDate) ? 'error' : 'primary'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => {
                        setSelectedBook(transaction);
                        setReturnDialogOpen(true);
                      }}
                    >
                      Return Book
                    </Button>
                  </Box>
                </Card>
              </Grid>
            )
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">
              You don't have any borrowed books at the moment.
            </Alert>
          </Grid>
        )}
      </Grid>

      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)}>
        <DialogTitle>Return Book</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to return "{selectedBook?.book?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReturn} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Confirm Return'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BorrowedBooks;

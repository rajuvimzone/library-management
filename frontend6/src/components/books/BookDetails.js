import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  CardContent
} from '@mui/material';
import axios from '../../utils/axiosConfig';

const BookDetails = ({ book: initialBook, onBorrowSuccess, onReturnSuccess, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [book, setBook] = useState(initialBook);
  const [activeTransaction, setActiveTransaction] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    setBook(initialBook);
  }, [initialBook]);

  useEffect(() => {
    if (!isAdmin && book?._id) {
      checkBookStatus();
    }
  }, [book?._id, isAdmin]);

  const checkBookStatus = async () => {
    try {
      const response = await axios.get(`/transactions/book-status/${book._id}`);
      const { transaction } = response.data;
      
      if (transaction) {
        setActiveTransaction(transaction);
      } else {
        setActiveTransaction(null);
      }

      setError(''); 
    } catch (err) {
      console.error('Error checking book status:', err);
      setError('Error checking book status');
    }
  };

  const handleBorrow = async () => {
    try {
      setLoading(true);
      setError(''); 
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const response = await axios.post('/transactions/issue', {
        bookId: book._id,
        dueDate: dueDate.toISOString()
      });

      setSuccess('Book borrowed successfully! Due date: ' + 
        new Date(response.data.dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      );
      
      setBook(prev => ({
        ...prev,
        available: prev.available - 1
      }));

      await checkBookStatus();

      onBorrowSuccess && onBorrowSuccess();
      onUpdate && onUpdate();
    } catch (err) {
      console.error('Error borrowing book:', err);
      const errorMessage = err.response?.data?.message || 'Failed to borrow book';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`/transactions/return/${activeTransaction._id}`);
      
      setSuccess('Book returned successfully!');
      
      setBook(prev => ({
        ...prev,
        available: prev.available + 1
      }));

      setActiveTransaction(null);

      onReturnSuccess && onReturnSuccess();
      onUpdate && onUpdate();
    } catch (err) {
      console.error('Error returning book:', err);
      setError(err.response?.data?.message || 'Failed to return book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Card>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <CardMedia
              component="img"
              image={book.coverImage || '/placeholder-book.png'}
              alt={book.title}
              sx={{ 
                height: 400, 
                objectFit: 'contain',
                p: 2
              }}
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                {book.title}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                by {book.author}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" paragraph>
                  <strong>ISBN:</strong> {book.isbn}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Category:</strong> {book.category}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Available Copies:</strong> {book.available} of {book.totalCopies}
                </Typography>
                {book.description && (
                  <Typography variant="body1" paragraph>
                    <strong>Description:</strong><br />
                    {book.description}
                  </Typography>
                )}
              </Box>

              <Box sx={{ mt: 3 }}>
                {activeTransaction ? (
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      You currently have this book borrowed
                    </Alert>
                   
                  </>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleBorrow}
                    disabled={loading || book.available === 0}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Borrow Book'}
                  </Button>
                )}
                {book.available === 0 && !activeTransaction && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    This book is currently unavailable
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default BookDetails;

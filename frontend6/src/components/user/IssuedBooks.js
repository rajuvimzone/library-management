import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from '../../utils/axiosConfig';

const IssuedBooks = () => {
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIssuedBooks();
  }, []);

  const fetchIssuedBooks = async () => {
    try {
      const response = await axios.get('/transactions/my-transactions');
      setIssuedBooks(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching issued books:', err);
      setError(err.response?.data?.message || 'Failed to fetch issued books');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Issued Books
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Book Title</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {issuedBooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No books currently issued
                </TableCell>
              </TableRow>
            ) : (
              issuedBooks.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell>{transaction.book.title}</TableCell>
                  <TableCell>{transaction.book.author}</TableCell>
                  <TableCell>{formatDate(transaction.issueDate)}</TableCell>
                  <TableCell>{formatDate(transaction.dueDate)}</TableCell>
                  <TableCell>{transaction.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default IssuedBooks;

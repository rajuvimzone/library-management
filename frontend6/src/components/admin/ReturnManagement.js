import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import { formatDate } from '../../utils/dateUtils';

const ReturnManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching active transactions...');
      const response = await axios.get('/transactions/active');
      console.log('Response:', response.data);
      setTransactions(response.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Error fetching active transactions. Please try again.');
      toast.error('Error fetching active transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTransactions();
  }, []);

  const handleReturn = async (transaction) => {
    setSelectedTransaction(transaction);
    setConfirmDialogOpen(true);
  };

  const confirmReturn = async () => {
    try {
      const response = await axios.post(`/transactions/return/${selectedTransaction._id}`);
      console.log('Return response:', response.data);
      
      if (response.data.fine > 0) {
        toast.warning(`Book returned with fine: $${response.data.fine}`);
      } else {
        toast.success('Book returned successfully');
      }
      
      fetchActiveTransactions();
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error returning book:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Error returning book');
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    if (!transaction?.book || !transaction?.user) return false;
    
    const searchString = searchTerm.toLowerCase();
    return (
      transaction.book.title.toLowerCase().includes(searchString) ||
      transaction.user.username.toLowerCase().includes(searchString) ||
      transaction.book.ISBN?.toLowerCase().includes(searchString)
    );
  });

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={fetchActiveTransactions}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Return Management
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by book title, username, or ISBN..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      {filteredTransactions.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 3 }}>
          No active transactions found
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Book Title</TableCell>
                <TableCell>ISBN</TableCell>
                <TableCell>Borrower</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction._id}>
                  <TableCell>{transaction.book.title}</TableCell>
                  <TableCell>{transaction.book.ISBN}</TableCell>
                  <TableCell>{transaction.user.username}</TableCell>
                  <TableCell>{formatDate(transaction.issueDate)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {formatDate(transaction.dueDate)}
                      {isOverdue(transaction.dueDate) && (
                        <Tooltip title="Overdue">
                          <WarningIcon color="error" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      color={isOverdue(transaction.dueDate) ? 'error' : 'success'}
                    >
                      {isOverdue(transaction.dueDate) ? 'Overdue' : 'Active'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CheckIcon />}
                      onClick={() => handleReturn(transaction)}
                    >
                      Return
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Book Return</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark this book as returned?
            {selectedTransaction && selectedTransaction.book && (
              <>
                <br />
                <br />
                <strong>Book:</strong> {selectedTransaction.book.title}
                <br />
                <strong>Borrower:</strong> {selectedTransaction.user.username}
                <br />
                <strong>Due Date:</strong>{' '}
                {formatDate(selectedTransaction.dueDate)}
                {isOverdue(selectedTransaction.dueDate) && (
                  <>
                    <br />
                    <br />
                    <Typography color="error">
                      This book is overdue. A fine will be calculated.
                    </Typography>
                  </>
                )}
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialogOpen(false)}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={confirmReturn}
            color="primary"
            variant="contained"
            startIcon={<CheckIcon />}
          >
            Confirm Return
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReturnManagement;

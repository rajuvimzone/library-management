import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const FineManagement = () => {
  const [fines, setFines] = useState([]);
  const [totalFine, setTotalFine] = useState(0);
  const theme = useTheme();

  const fetchFines = async () => {
    try {
      const response = await axios.get('/fines/unpaid');
      setFines(response.data.transactions);
      setTotalFine(response.data.totalUnpaidFines);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching fines');
    }
  };

  const handlePayFine = async (transactionId) => {
    try {
      await axios.post(`/fines/pay/${transactionId}`);
      toast.success('Fine paid successfully');
      fetchFines(); // Refresh the list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error paying fine');
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Fine Management
      </Typography>

      <Grid container spacing={3}>
        {/* Total Fine Summary Card */}
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total Unpaid Fines
              </Typography>
              <Typography 
                variant="h4" 
                sx={{ color: totalFine > 0 ? theme.palette.error.main : theme.palette.success.main }}
              >
                ₹{totalFine}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Fines Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Book Title</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Return Date</TableCell>
                  <TableCell>Fine Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fines.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>{transaction.book?.title}</TableCell>
                    <TableCell>
                      {new Date(transaction.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {transaction.returnDate 
                        ? new Date(transaction.returnDate).toLocaleDateString()
                        : 'Not Returned'}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.error.main }}>
                      ₹{transaction.fine.amount}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.fine.isPaid ? 'Paid' : 'Unpaid'}
                        color={transaction.fine.isPaid ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {!transaction.fine.isPaid && (
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handlePayFine(transaction._id)}
                        >
                          Pay Fine
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {fines.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        No unpaid fines
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FineManagement;

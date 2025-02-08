import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import axios from '../../utils/axiosConfig';
import { addDays } from 'date-fns';
import BookDetails from './BookDetails';

const SCAN_THROTTLE = 500; // Minimum time between scans in ms

const BookScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedBook, setScannedBook] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isBookBorrowed, setIsBookBorrowed] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'admin';
  
  const scannerRef = useRef(null);
  const lastScanRef = useRef(0);
  const processingRef = useRef(false);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("reader");

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      if (!scannerRef.current || scanning) return;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras?.length) {
        setError('No cameras found');
        return;
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 100 },
        aspectRatio: 2.0,
        formatsToSupport: ["ean_13", "code_128", "ean_8", "code_39"],
        disableFlip: true,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          requestAnimationFrame(() => handleScanResult(decodedText));
        },
        () => {} // Empty error handler to reduce console noise
      );

      setScanning(true);
    } catch (err) {
      setError('Failed to start scanner: ' + err.message);
      console.error('Scanner error:', err);
    }
  };

  const handleScanResult = (decodedText) => {
    const now = Date.now();
    if (processingRef.current || 
        now - lastScanRef.current < SCAN_THROTTLE || 
        !decodedText) {
      return;
    }

    lastScanRef.current = now;
    processingRef.current = true;

    handleScan(decodedText).finally(() => {
      processingRef.current = false;
    });
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
        setScanning(false);
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const checkBookStatus = async (bookId) => {
    try {
      const response = await axios.get(`/transactions/all`);
      const activeTransaction = response.data.find(
        t => t.book._id === bookId && t.status === 'active' && t.type === 'issue'
      );
      setIsBookBorrowed(!!activeTransaction);
      setCurrentTransaction(activeTransaction);
    } catch (err) {
      console.error('Error checking book status:', err);
      setError(err.response?.data?.message || 'Failed to check book status');
    }
  };

  const handleScan = async (result) => {
    if (loading) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/books/barcode/${result}`);
      setScannedBook(response.data);
      await checkBookStatus(response.data._id);
      setSuccess('Book found!');
      setDialogOpen(true);
      await stopScanning();
    } catch (err) {
      console.error('Error scanning book:', err);
      if (err.response?.status === 404) {
        setError('No book found with this barcode');
      } else {
        setError(err.response?.data?.message || 'Failed to scan book');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!scannedBook) return;

    try {
      setLoading(true);
      const dueDate = addDays(new Date(), 14); // 2 weeks from now
      await axios.post('/transactions/issue', {
        bookId: scannedBook._id,
        dueDate
      });
      setSuccess('Book borrowed successfully!');
      setDialogOpen(false);
      setScannedBook(null);
    } catch (err) {
      console.error('Error borrowing book:', err);
      setError(err.response?.data?.message || 'Failed to borrow book');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!scannedBook || !currentTransaction || !isAdmin) return;

    try {
      setLoading(true);
      await axios.post('/transactions/return', {
        bookId: scannedBook._id,
        userId: currentTransaction.user
      });
      setSuccess('Book returned successfully!');
      setDialogOpen(false);
      setScannedBook(null);
      setCurrentTransaction(null);
    } catch (err) {
      console.error('Error returning book:', err);
      setError(err.response?.data?.message || 'Failed to return book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, my: 2 }}>
        <Typography variant="h5" gutterBottom>
          Book Scanner
        </Typography>

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

        <Box id="reader" sx={{ width: '100%', mb: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          {!scanning ? (
            <Button
              variant="contained"
              color="primary"
              onClick={startScanning}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Start Scanning'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              onClick={stopScanning}
              disabled={loading}
            >
              Stop Scanning
            </Button>
          )}
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !loading && setDialogOpen(false)}>
        <DialogTitle>
          {isAdmin ? (isBookBorrowed ? 'Return Book' : 'Book Details') : 'Book Details'}
        </DialogTitle>
        <DialogContent>
          {scannedBook && <BookDetails book={scannedBook} hideActions />}
          {isBookBorrowed && isAdmin && currentTransaction && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                Borrowed By: {currentTransaction.user.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Issue Date: {new Date(currentTransaction.issueDate).toLocaleDateString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Due Date: {new Date(currentTransaction.dueDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          {isBookBorrowed && isAdmin && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleReturn}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Return'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookScanner;

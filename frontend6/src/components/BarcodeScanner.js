import React, { useState } from 'react';
import { BarcodeScannerComponent } from "react-qr-barcode-scanner";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Typography,
    CircularProgress,
    Snackbar,
    Box
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';

const useStyles = makeStyles((theme) => ({
    root: {
        padding: theme.spacing(3),
        maxWidth: 600,
        margin: '0 auto',
    },
    scannerContainer: {
        width: '100%',
        maxWidth: 640,
        height: 720,
        margin: '0 auto',
        marginBottom: theme.spacing(2),
        position: 'relative',
        overflow: 'hidden',
        border: '2px solid #1976d2',
        borderRadius: '8px',
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: theme.spacing(2),
    },
}));

const BarcodeScanner = () => {
    const classes = useStyles();
    const [scanning, setScanning] = useState(false);
    const [scannedData, setScannedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleScan = async (err, result) => {
        if (result) {
            setScannedData(result.text);
            setScanning(false);
        }
        if (err) {
            console.error("Scanning error:", err);
            setError("Failed to scan barcode. Please try again.");
        }
    };

    const handleTransaction = async (action) => {
        if (!scannedData) return;

        setLoading(true);
        try {
            const response = await fetch('/api/transactions/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add your authentication token here
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    barcode: scannedData,
                    userId: localStorage.getItem('userId'), // Assuming you store userId in localStorage
                    action: action
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message);
                setScannedData(null);
            } else {
                setError(data.message || 'Transaction failed');
            }
        } catch (err) {
            setError('Failed to process transaction. Please try again.');
            console.error('Transaction error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper className={classes.root}>
            <Typography variant="h5" gutterBottom>
                Book Scanner
            </Typography>

            {scanning ? (
                <Box className={classes.scannerContainer}>
                    <BarcodeScannerComponent
                        width={640}
                        height={720}
                        onUpdate={handleScan}
                    />
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => setScanning(false)}
                        style={{ marginTop: '1rem' }}
                    >
                        Stop Scanning
                    </Button>
                </Box>
            ) : (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setScanning(true)}
                    disabled={loading}
                >
                    Start Scanning
                </Button>
            )}

            {scannedData && (
                <Dialog open={!!scannedData} onClose={() => setScannedData(null)}>
                    <DialogTitle>Scanned Barcode</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Barcode: {scannedData}
                        </Typography>
                    </DialogContent>
                    <DialogActions className={classes.buttonGroup}>
                        <Button
                            onClick={() => handleTransaction('borrow')}
                            color="primary"
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Borrow Book'}
                        </Button>
                        <Button
                            onClick={() => handleTransaction('return')}
                            color="secondary"
                            variant="contained"
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Return Book'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
            >
                <Alert onClose={() => setError(null)} severity="error">
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!success}
                autoHideDuration={6000}
                onClose={() => setSuccess(null)}
            >
                <Alert onClose={() => setSuccess(null)} severity="success">
                    {success}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default BarcodeScanner;

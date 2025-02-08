import React, { useState } from 'react';
import {
    Button,
    TextField,
    Paper,
    Typography,
    Grid,
    Snackbar
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import GetAppIcon from '@material-ui/icons/GetApp';

const useStyles = makeStyles((theme) => ({
    root: {
        padding: theme.spacing(3),
        maxWidth: 800,
        margin: '0 auto',
    },
    form: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
    preview: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(2),
        textAlign: 'center',
    },
    barcodeImage: {
        maxWidth: '100%',
        height: 'auto',
        marginTop: theme.spacing(2),
    },
}));

const BarcodeGenerator = () => {
    const classes = useStyles();
    const [bookId, setBookId] = useState('');
    const [barcodeUrl, setBarcodeUrl] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const generateBarcode = async () => {
        if (!bookId.trim()) {
            setError('Please enter a book ID');
            return;
        }

        try {
            const response = await fetch('/api/transactions/generate-barcode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ text: bookId })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                setBarcodeUrl(url);
                setSuccess('Barcode generated successfully');
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to generate barcode');
            }
        } catch (err) {
            console.error('Barcode generation error:', err);
            setError('Failed to generate barcode. Please try again.');
        }
    };

    const downloadBarcode = () => {
        if (barcodeUrl) {
            const link = document.createElement('a');
            link.href = barcodeUrl;
            link.download = `barcode-${bookId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <Paper className={classes.root}>
            <Typography variant="h5" gutterBottom>
                Barcode Generator
            </Typography>

            <form className={classes.form} noValidate autoComplete="off">
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                        <TextField
                            fullWidth
                            label="Book ID"
                            value={bookId}
                            onChange={(e) => setBookId(e.target.value)}
                            variant="outlined"
                            placeholder="Enter book ID"
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={generateBarcode}
                            style={{ height: '100%' }}
                        >
                            Generate Barcode
                        </Button>
                    </Grid>
                </Grid>
            </form>

            {barcodeUrl && (
                <Paper className={classes.preview} elevation={3}>
                    <Typography variant="h6" gutterBottom>
                        Generated Barcode
                    </Typography>
                    <img
                        src={barcodeUrl}
                        alt="Generated Barcode"
                        className={classes.barcodeImage}
                    />
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<GetAppIcon />}
                        onClick={downloadBarcode}
                        style={{ marginTop: '1rem' }}
                    >
                        Download Barcode
                    </Button>
                </Paper>
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

export default BarcodeGenerator;

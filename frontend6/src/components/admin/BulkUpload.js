import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && (selectedFile.type === 'text/csv' || 
        selectedFile.type === 'application/vnd.ms-excel' ||
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      setFile(selectedFile);
      setResults(null);
    } else {
      toast.error('Please select a valid CSV or Excel file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post('/books/bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResults(response.data);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Error uploading file');
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Bulk Book Upload
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <input
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            id="bulk-upload-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="bulk-upload-file">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={uploading}
            >
              Select CSV File
            </Button>
          </label>
          {file && (
            <Typography variant="body2" color="textSecondary">
              Selected file: {file.name}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={!file || uploading}
            sx={{ mt: 2 }}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload Books'}
          </Button>
        </Box>
      </Paper>

      {results && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload Results
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Alert severity="success">
              <AlertTitle>Upload Complete</AlertTitle>
              <Typography>
                Processed: {results.processed} books
                <br />
                Successfully added/updated: {results.successful} books
                <br />
                Errors: {results.errors.length} books
              </Typography>
            </Alert>
          </Box>
          {results.errors.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Errors
              </Typography>
              <List>
                {results.errors.map((error, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText primary={error} />
                    </ListItem>
                    {index < results.errors.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </>
          )}
        </Paper>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          CSV File Format
        </Typography>
        <Typography variant="body2" component="div">
          Your CSV file should include the following columns:
          <List>
            <ListItem>
              <ListItemText
                primary="Required Fields"
                secondary="title, author, ISBN, category"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Optional Fields"
                secondary="description, publisher, publishedYear, available, totalCopies, location, coverImage"
              />
            </ListItem>
          </List>
        </Typography>
      </Box>
    </Box>
  );
};

export default BulkUpload;

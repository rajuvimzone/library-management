import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Grid,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import axios from '../../utils/axiosConfig';
import BookCard from './BookCard';

const BookCatalog = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: ''
  });

  const searchInputRef = useRef(null);

  const categories = [
    'Fiction',
    'Non-Fiction',
    'Science',
    'Technology',
    'History',
    'Literature',
    'Philosophy'
  ];

  // Add debounce to prevent too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBooks();
    }, 300); // Wait 300ms after last change before fetching

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const fetchBooks = async () => {
    try {
      setLoading(false); // Don't show loading for search to prevent focus loss
      setError('');
      
      // Only send search parameter if it's not empty
      const params = {};
      if (filters.search.trim()) {
        params.search = filters.search.trim();
      }
      if (filters.category) {
        params.category = filters.category;
      }
      
      const response = await axios.get('/books', { params });
      setBooks(response.data);
    } catch (error) {
      console.error('Error fetching books:', error);
      setError(error.response?.data?.message || 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Only show loading on initial load
  if (loading && !books.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Book Catalog
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            inputRef={searchInputRef}
            fullWidth
            label="Search by Title or Author"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Enter title or author name"
            variant="outlined"
            autoComplete="off"
            InputProps={{
              sx: { borderRadius: 1 }
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            select
            label="Filter by Category"
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            variant="outlined"
            InputProps={{
              sx: { borderRadius: 1 }
            }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {books.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            {filters.search || filters.category ? 'No books found matching your search criteria' : 'No books available'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {books.map((book) => (
            <Grid item key={book._id} xs={12} sm={6} md={4} lg={3}>
              <BookCard book={book} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default BookCatalog;

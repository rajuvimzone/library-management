import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';

const BookManagement = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    totalCopies: '1',
    available: '1',
    location: '',
    description: '',
    publisher: '',
    publishedYear: '',
    coverImage: ''
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/books');
      setBooks(response.data);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      totalCopies: book.totalCopies.toString(),
      available: book.available.toString(),
      location: book.location || '',
      description: book.description || '',
      publisher: book.publisher || '',
      publishedYear: book.publishedYear ? book.publishedYear.toString() : '',
      coverImage: book.coverImage || ''
    });
    setEditDialogOpen(true);
  };

  const handleDelete = async (bookId) => {
    // Find the book to show its title in the confirmation
    const bookToDelete = books.find(book => book._id === bookId);
    if (!bookToDelete) return;

    if (!window.confirm(`Are you sure you want to delete "${bookToDelete.title}"?\n\nNote: This action cannot be undone, and the book can only be deleted if all copies have been returned.`)) {
      return;
    }

    try {
      const response = await axios.delete(`/books/${bookId}`);
      setBooks(books.filter(book => book._id !== bookId));
      toast.success(response.data.message || 'Book deleted successfully');
    } catch (err) {
      console.error('Error deleting book:', err);
      
      // Show appropriate error message based on the error type
      if (err.response?.status === 400) {
        const book = books.find(b => b._id === bookId);
        const borrowedCopies = book ? book.totalCopies - book.available : 'some';
        toast.error(
          `Cannot delete book because ${borrowedCopies} ${borrowedCopies === 1 ? 'copy is' : 'copies are'} currently borrowed. Please ensure all copies are returned first.`,
          { autoClose: 5000 }
        );
      } else {
        toast.error(err.response?.data?.message || 'Failed to delete book. Please try again.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate that available copies cannot exceed total copies
      const totalCopiesNum = parseInt(formData.totalCopies);
      const availableNum = parseInt(formData.available);
      
      if (availableNum > totalCopiesNum) {
        toast.error('Available copies cannot exceed total copies');
        return;
      }

      const response = await axios.put(`/books/${selectedBook._id}`, {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim(),
        category: formData.category.trim(),
        totalCopies: totalCopiesNum,
        available: availableNum,
        location: formData.location.trim(),
        description: formData.description.trim(),
        publisher: formData.publisher.trim(),
        publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : undefined,
        coverImage: formData.coverImage.trim()
      });

      setBooks(books.map(book => 
        book._id === selectedBook._id ? response.data : book
      ));

      setEditDialogOpen(false);
      toast.success('Book updated successfully');
    } catch (err) {
      console.error('Error updating book:', err);
      const errorMessage = err.response?.data?.errors?.[0]?.msg || 
                          err.response?.data?.message || 
                          'Error updating book';
      toast.error(errorMessage);
    }
  };

  const handleAddBook = async () => {
    try {
      // Validate required fields
      if (!formData.title.trim() || !formData.author.trim() || !formData.isbn.trim() || !formData.category.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate ISBN format (basic validation)
      const isbnRegex = /^[0-9-]+$/;
      if (!isbnRegex.test(formData.isbn.trim())) {
        toast.error('ISBN should only contain numbers and hyphens');
        return;
      }

      // Validate that available copies cannot exceed total copies
      const totalCopiesNum = parseInt(formData.totalCopies);
      const availableNum = parseInt(formData.available);
      
      if (availableNum > totalCopiesNum) {
        toast.error('Available copies cannot exceed total copies');
        return;
      }

      const response = await axios.post('/books', {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim(),
        category: formData.category.trim(),
        totalCopies: totalCopiesNum,
        available: availableNum,
        location: formData.location.trim(),
        description: formData.description.trim(),
        publisher: formData.publisher.trim(),
        publishedYear: formData.publishedYear ? parseInt(formData.publishedYear) : undefined,
        coverImage: formData.coverImage.trim()
      });
      
      setBooks([...books, response.data]);
      setAddDialogOpen(false);
      resetFormData();
      toast.success('Book added successfully');
    } catch (err) {
      console.error('Error adding book:', err);
      const errorMessage = err.response?.data?.existingBook ? 
        `Book with ISBN "${err.response.data.existingBook.isbn}" already exists (Title: ${err.response.data.existingBook.title})` :
        err.response?.data?.errors?.[0]?.msg || 
        err.response?.data?.message || 
        'Failed to add book';
      toast.error(errorMessage);
    }
  };

  const resetFormData = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category: '',
      totalCopies: '1',
      available: '1',
      location: '',
      description: '',
      publisher: '',
      publishedYear: '',
      coverImage: ''
    });
  };

  if (loading && !books.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Book Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setFormData({
              title: '',
              author: '',
              isbn: '',
              category: '',
              totalCopies: '1',
              available: '1',
              location: '',
              description: '',
              publisher: '',
              publishedYear: '',
              coverImage: ''
            });
            setAddDialogOpen(true);
          }}
        >
          Add New Book
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Author</TableCell>
                <TableCell>ISBN</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="center">Total</TableCell>
                <TableCell align="center">Available</TableCell>
                {/* <TableCell>Location</TableCell>
                <TableCell>Publisher</TableCell>
                <TableCell>Year</TableCell> */}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {books.map((book) => (
                <TableRow key={book._id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {book.title}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {book.author}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {book.isbn}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {book.category}
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    {book.totalCopies}
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    {book.available}
                  </TableCell>
                  {/* <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {book.location}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {book.publisher}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {book.publishedYear}
                  </TableCell> */}
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEditClick(book)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(book._id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {/* Edit Book Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Book</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                label="Author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                label="ISBN"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                required
                fullWidth
                helperText="ISBN should only contain numbers and hyphens (e.g., 978-0-123456-78-9)"
                error={formData.isbn.trim() !== '' && !/^[0-9-]+$/.test(formData.isbn.trim())}
              />
              <TextField
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                label="Total Copies"
                name="totalCopies"
                type="number"
                value={formData.totalCopies}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                label="Available Copies"
                name="available"
                type="number"
                value={formData.available}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                fullWidth
              />
              <TextField
                label="Publisher"
                name="publisher"
                value={formData.publisher}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Published Year"
                name="publishedYear"
                type="number"
                value={formData.publishedYear}
                onChange={handleInputChange}
                fullWidth
              />
              <TextField
                label="Cover Image URL"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Book Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Book</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Title"
              name="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Author"
              name="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="ISBN"
              name="isbn"
              value={formData.isbn}
              onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              required
              fullWidth
              helperText="ISBN should only contain numbers and hyphens (e.g., 978-0-123456-78-9)"
              error={formData.isbn.trim() !== '' && !/^[0-9-]+$/.test(formData.isbn.trim())}
            />
            <TextField
              label="Category"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Total Copies"
              name="totalCopies"
              type="number"
              value={formData.totalCopies}
              onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Available Copies"
              name="available"
              type="number"
              value={formData.available}
              onChange={(e) => setFormData({ ...formData, available: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Location"
              name="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Publisher"
              name="publisher"
              value={formData.publisher}
              onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              fullWidth
            />
            <TextField
              label="Published Year"
              name="publishedYear"
              type="number"
              value={formData.publishedYear}
              onChange={(e) => setFormData({ ...formData, publishedYear: e.target.value })}
              fullWidth
            />
            <TextField
              label="Cover Image URL"
              name="coverImage"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddBook} variant="contained" color="primary">
            Add Book
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookManagement;

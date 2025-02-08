import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box
} from '@mui/material';
import { Book as BookIcon } from '@mui/icons-material';
import BookDetails from './BookDetails';

const BookCard = ({ book }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="div"
          sx={{
            pt: '56.25%',
            position: 'relative',
            bgcolor: 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              style={{
                position: 'absolute',
                top: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <BookIcon
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 60,
                color: 'grey.400'
              }}
            />
          )}
        </CardMedia>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h6" component="h2" noWrap>
            {book.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            by {book.author}
          </Typography>
          <Box sx={{ mb: 1 }}>
            <Chip
              label={book.genre}
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip
              label={book.available > 0 ? 'Available' : 'Not Available'}
              color={book.available > 0 ? 'success' : 'error'}
              size="small"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {book.available} of {book.quantity} copies available
          </Typography>
        </CardContent>
        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleOpen}
            disabled={book.available === 0}
          >
            View Details
          </Button>
        </Box>
      </Card>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Book Details</DialogTitle>
        <DialogContent>
          <BookDetails book={book} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BookCard;

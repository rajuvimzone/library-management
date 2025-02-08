import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  // Chip  // Commented out as we're not showing status
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  // Block as BlockIcon,  // Commented out as we're not showing status
  // CheckCircle as CheckCircleIcon  // Commented out as we're not showing status
} from '@mui/icons-material';
import axios from '../../utils/axiosConfig';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'user',
    password: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setError('');
      const response = await axios.get('/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      password: '' // Don't show password
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      let response;
      if (selectedUser) {
        // Update existing user
        response = await axios.put(`/users/${selectedUser._id}`, formData);
        setUsers(users.map(user => 
          user._id === selectedUser._id ? response.data : user
        ));
      } else {
        // Create new user
        response = await axios.post('/users', formData);
        setUsers([...users, response.data]);
      }

      // Show success message
      const successAlert = document.createElement('div');
      successAlert.style.position = 'fixed';
      successAlert.style.top = '20px';
      successAlert.style.right = '20px';
      successAlert.style.padding = '10px';
      successAlert.style.backgroundColor = '#4caf50';
      successAlert.style.color = 'white';
      successAlert.style.borderRadius = '4px';
      successAlert.textContent = selectedUser ? 'User updated successfully' : 'User created successfully';
      document.body.appendChild(successAlert);
      setTimeout(() => document.body.removeChild(successAlert), 3000);

      setDialogOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving user:', err);
      let errorMessage = err.response?.data?.message;
      if (err.response?.data?.errors) {
        errorMessage = err.response.data.errors.map(e => e.msg).join(', ');
      }
      setError(errorMessage || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      setLoading(true);
      setError('');
      const response = await axios.delete(`/users/${userId}`);
      setUsers(users.filter(user => user._id !== userId));
      // Show success message
      const successAlert = document.createElement('div');
      successAlert.style.position = 'fixed';
      successAlert.style.top = '20px';
      successAlert.style.right = '20px';
      successAlert.style.padding = '10px';
      successAlert.style.backgroundColor = '#4caf50';
      successAlert.style.color = 'white';
      successAlert.style.borderRadius = '4px';
      successAlert.textContent = response.data.message;
      document.body.appendChild(successAlert);
      setTimeout(() => document.body.removeChild(successAlert), 3000);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  /* Commented out status toggle functionality
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setLoading(true);
      setError('');
      await axios.patch(`/users/${userId}/status`, {
        active: !currentStatus
      });
      fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };
  */

  const resetForm = () => {
    setSelectedUser(null);
    setFormData({
      username: '',
      email: '',
      role: 'user',
      password: ''
    });
  };

  if (loading && !users.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">User Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          Add New User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              {/* Removed Status column */}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                {/* Removed Status cell */}
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditClick(user)}
                    size="small"
                    title="Edit user"
                  >
                    <EditIcon />
                  </IconButton>
                  {/* Removed Status toggle button */}
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(user._id)}
                    size="small"
                    title="Delete user"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              name="username"
              label="Username"
              value={formData.username}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                label="Role"
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              name="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              helperText={selectedUser ? "Leave blank to keep current password" : ""}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserManagement;

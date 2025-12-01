import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff, Save, Person, Lock, Settings, Add } from '@mui/icons-material';

const SettingsPage = () => {
  const username = localStorage.getItem('username');

  const [userData, setUserData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  // للحفاظ على حالة ظهور فورم إضافة مدير جديد
  const [showAddManagerForm, setShowAddManagerForm] = useState(false);
  const [newManager, setNewManager] = useState({ username: '', password: '' });
  const [showNewPass, setShowNewPass] = useState(false);
  const [newManagerSuccess, setNewManagerSuccess] = useState(false);
  const [newManagerError, setNewManagerError] = useState('');

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/user-settings?username=${username}`);
      const data = await res.json();
      if (data.success) {
        setUserData({ username: data.user.username, password: data.user.password });
      }
    } catch (err) {
      console.error('Error fetching user settings');
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/user-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          newUsername: userData.username,
          password: userData.password
        })
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        alert("Failed to save settings: " + data.message);
      }
    } catch (err) {
      alert('Error updating settings');
      console.error(err);
    }
  };

  const handleAddManager = async () => {
    setNewManagerError('');
    if (!newManager.username || !newManager.password) {
      setNewManagerError('Please fill username and password');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/api/add-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: newManager.username,
          password: newManager.password
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewManagerSuccess(true);
        setNewManager({ username: '', password: '' });
        setShowAddManagerForm(false);
      } else {
        setNewManagerError(data.message || 'Failed to add manager');
      }
    } catch (err) {
      setNewManagerError('Error adding manager');
      console.error(err);
    }
  };

  return (
    <Box sx={{ p: 4, minHeight: '100vh', backgroundColor: '#eef2f7' }}>
      <Paper elevation={6} sx={{ maxWidth: 600, mx: 'auto', p: 4, borderRadius: 4, backgroundColor: '#ffffff', mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', color: '#1976d2' }}>
          <Settings sx={{ verticalAlign: 'middle', mr: 1 }} /> Settings
        </Typography>

        <Typography variant="subtitle1" sx={{ textAlign: 'center', color: 'gray', mb: 2 }}>
          These settings are intended for the company manager.
        </Typography>

        <TextField
          fullWidth
          label="Username"
          value={userData.username}
          onChange={(e) => setUserData({ ...userData, username: e.target.value })}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person />
              </InputAdornment>
            )
          }}
        />

        <TextField
          fullWidth
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          value={userData.password}
          onChange={(e) => setUserData({ ...userData, password: e.target.value })}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          fullWidth
          onClick={handleSave}
          sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 3, mb: 2 }}
        >
          Save Settings
        </Button>

        {/* زر إظهار فورم إضافة مدير جديد */}
        {!showAddManagerForm && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Add />}
            fullWidth
            onClick={() => setShowAddManagerForm(true)}
            sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 3 }}
          >
            Add New Manager
          </Button>
        )}

        {/* فورم إضافة مدير جديد */}
        {showAddManagerForm && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center' }}>
              Add New Manager
            </Typography>

            <TextField
              fullWidth
              label="Username"
              value={newManager.username}
              onChange={(e) => setNewManager({ ...newManager, username: e.target.value })}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showNewPass ? 'text' : 'password'}
              value={newManager.password}
              onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPass(!showNewPass)} edge="end">
                      {showNewPass ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {newManagerError && (
              <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
                {newManagerError}
              </Typography>
            )}

            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              fullWidth
              onClick={handleAddManager}
              sx={{ py: 1.5, fontWeight: 'bold', borderRadius: 3, mb: 1 }}
            >
              Add Manager
            </Button>

            <Button
              variant="text"
              color="secondary"
              fullWidth
              onClick={() => setShowAddManagerForm(false)}
              sx={{ fontWeight: 'bold' }}
            >
              Cancel
            </Button>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Settings saved successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={newManagerSuccess}
        autoHideDuration={4000}
        onClose={() => setNewManagerSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          New manager added successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;

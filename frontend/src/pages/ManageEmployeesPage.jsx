import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';



const ManageEmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    password: '',
    image: null,
  });

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:3001/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      type: employee.type,
      password: '',
      image: null,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/employees/${id}`);
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('id', selectedEmployee.id);
    formDataToSend.append('name', formData.name);
    formDataToSend.append('type', formData.type);
    if (formData.password) {
      formDataToSend.append('password', formData.password);
    }
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }

    try {
      await axios.put(`http://localhost:3001/employees/${selectedEmployee.id}`, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOpenDialog(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Manage Employees
      </Typography>

      <Grid container spacing={3}>
        {employees.map((employee) => (
          <Grid item xs={12} sm={6} md={4} key={employee.id}>
            <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardContent>
                <Typography variant="h6">{employee.name}</Typography>
                <Typography variant="body2">Gender: {employee.gender}</Typography>
                <Typography variant="body2">Type: {employee.type}</Typography>
              </CardContent>
              <Box sx={{ flexGrow: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                <IconButton onClick={() => handleEdit(employee)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(employee.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          <form onSubmit={handleUpdate}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <MenuItem value="Full Time">Full Time</MenuItem>
                <MenuItem value="Part Time">Part Time</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              sx={{ mb: 2 }}
            />

       <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 2 }}>
  <Button
    variant="outlined"
    component="label"
    fullWidth
  >
    Upload New Image
    <input
      type="file"
      hidden
      onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
    />
  </Button>

  <Button
    type="submit"
    variant="contained"
    color="primary"
    fullWidth
  >
    Save Changes
  </Button>
</Box>

          </form>
        </DialogContent>
      </Dialog>
    </Box>
  );
};



export default ManageEmployeesPage;

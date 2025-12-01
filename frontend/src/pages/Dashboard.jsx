// Dashboard.js 
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { Dashboard as DashboardIcon, CalendarToday as CalendarIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import { Link } from 'react-router-dom';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import axios from 'axios';
import GroupIcon from '@mui/icons-material/Group';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';



const drawerWidth = 240;

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    // Fetch employees data from the backend
    axios.get('http://localhost:3001/employees')
      .then(response => {
        console.log(response.data); 
        setEmployees(response.data);
      })
      .catch(error => {
        console.error('Error fetching employees:', error);
      });
  }, []);

  const stats = {
    gender: {
      male: employees.filter((e) => e.gender === 'Male').length,
      female: employees.filter((e) => e.gender === 'Female').length,
    },
    employmentType: {
      fullTime: employees.filter((e) => e.type === 'Full Time').length,
      partTime: employees.filter((e) => e.type === 'Part Time').length,
    },
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#208ca9',
            color: '#fff',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {[
              { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
              { text: 'Employees', icon: <GroupIcon/>, path: '/employees' },
              { text: 'ManageEmployees', icon: <ManageAccountsIcon />, path: '/manageEmployees' },
              { text: 'Reports', icon: <AssignmentOutlinedIcon />, path: '/reports' },
              { text: 'Dates', icon: <CalendarIcon />, path: '/dates' },
              { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
            ].map(({ text, icon, path }) => (
              <ListItem key={text} component={Link} to={path}>
                <ListItemIcon sx={{ color: '#fff' }}>{icon}</ListItemIcon>
                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>
          <Divider />
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
          Dashboard Overview
        </Typography>
        <Grid container spacing={3}>
          {/* Gender Distribution Card */}
          <Grid xs={12} md={6}>
            <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#555' }}>
                  Gender Distribution
                </Typography>
                <Doughnut
                  data={{
                    labels: ['Male', 'Female'],
                    datasets: [
                      {
                        data: [stats.gender.male, stats.gender.female],
                        backgroundColor: ['#3B82F6', '#EC4899'],
                        hoverBackgroundColor: ['#2E67C7', '#D13A8A'],
                      },
                    ],
                  }}
                  options={{
                    cutout: '70%',
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Employment Type Card */}
          <Grid xs={12} md={6}>
            <Card sx={{ boxShadow: 3, borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: '#555' }}>
                  Employment Type
                </Typography>
                <Bar
                  data={{
                    labels: ['Full Time', 'Part Time'],
                    datasets: [
                      {
                        label: 'Employees',
                        data: [stats.employmentType.fullTime, stats.employmentType.partTime],
                        backgroundColor: ['#3B82F6', '#10B981'],
                        borderRadius: 5,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
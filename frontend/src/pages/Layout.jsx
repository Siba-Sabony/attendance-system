// Layout.js
import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
} from '@mui/material';
import { Dashboard as DashboardIcon, People as PeopleIcon, CalendarToday as CalendarIcon, Settings as SettingsIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
const drawerWidth = 240;

const Layout = ({ children }) => {
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
              { text: 'Employees', icon: <PeopleIcon />, path: '/employees' },
              { text: 'ManageEmployees', icon: <ManageAccountsIcon />, path: '/ManageEmployees' },
              { text: 'Reports', icon: <AssignmentOutlinedIcon />, path: '/Reports' },
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
        {children}
      </Box>
    </Box>
  );
};

export default Layout;

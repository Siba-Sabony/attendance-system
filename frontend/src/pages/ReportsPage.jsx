import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Paper
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';

const ReportsPage = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const fetchAttendance = async () => {
    try {
      const response = await axios.get('http://localhost:3001/attendance');
      if (response.data.success) {
        setAttendanceRecords(response.data.data);
      } else {
        setAttendanceRecords([]);
      }
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      setAttendanceRecords([]);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(attendanceRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
    XLSX.writeFile(workbook, 'Attendance_Records.xlsx');
  };

  useEffect(() => {
    fetchAttendance();
  }, []);
const columns = [
  { field: 'employee_name', headerName: 'Employee Name', width: 200 },

  {
    field: 'check_in',
    headerName: 'Check-In Time',
    width: 200,
    renderCell: (params) => {
      const val = params?.row?.check_in;
      if (!val) return '-';
      const date = new Date(val);
      if (isNaN(date)) return '-';
      return date.toLocaleString(); // هنا بتحول التاريخ حسب timezone الجهاز تلقائياً
    },
  },

  {
    field: 'check_out',
    headerName: 'Check-Out Time',
    width: 200,
    renderCell: (params) => {
      const val = params?.row?.check_out;
      if (!val) return '-';
      const date = new Date(val);
      if (isNaN(date)) return '-';
      return date.toLocaleString();
    },
  },
];



  const rows = attendanceRecords.map((row, index) => ({
    id: index,
    ...row
  }));

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Attendance Reports
      </Typography>

      <Button variant="contained" color="primary" onClick={exportToExcel} sx={{ mb: 2 }}>
        Export to Excel
      </Button>

      <Paper elevation={3} sx={{ height: 400 }}>
        <DataGrid rows={rows} columns={columns} pageSize={5} rowsPerPageOptions={[5]} />
      </Paper>
    </Box>
  );
};

export default ReportsPage;

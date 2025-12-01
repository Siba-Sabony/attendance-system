import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button
} from '@mui/material';
import { Search, Clear, Download } from '@mui/icons-material';
import * as XLSX from 'xlsx';

const DatesPage = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await axios.get('http://localhost:3001/attendance');
      if (response.data.success) {
        setAttendanceRecords(response.data.data);
        setFilteredRecords(response.data.data);
      } else {
        setAttendanceRecords([]);
        setFilteredRecords([]);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceRecords([]);
      setFilteredRecords([]);
    }
  };

  const formatDate = (datetime) => {
    if (!datetime) return '-';
    const date = new Date(datetime);
    if (isNaN(date)) return '-';
  // تنسيق التاريخ حسب المنطقة الزمنية للجهاز بصيغة yyyy-MM-dd
  return date.toLocaleDateString('en-CA');
  };

  const formatTime = (datetime) => {
    if (!datetime) return '-';
    const date = new Date(datetime);
   if (isNaN(date)) return '-';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


const applyDateFilter = () => {
  const result = attendanceRecords.filter((record) => {
    if (!record.check_in) return false;

    const date = new Date(record.check_in);
    if (isNaN(date)) return false;

    const formattedDate = date.toLocaleDateString('en-CA'); // yyyy-MM-dd

    const matchesDate = filterDate ? formattedDate === filterDate : true;
    const matchesName = filterName ? record.employee_name.toLowerCase().includes(filterName.toLowerCase()) : true;

    return matchesDate && matchesName;
  });

  setFilteredRecords(result);
};

  const clearFilter = () => {
    setFilterDate('');
    setFilterName('');
    setFilteredRecords(attendanceRecords);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredRecords);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Records');
    XLSX.writeFile(workbook, 'Attendance_Records.xlsx');
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
        Attendance Records
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <TextField
          type="date"
          label="Filter by Date"
          InputLabelProps={{ shrink: true }}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
        <TextField
          label="Filter by Employee Name"
          variant="outlined"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
        <Button variant="contained" color="primary" startIcon={<Search />} onClick={applyDateFilter}>
          Apply Filter
        </Button>
        <Button variant="outlined" color="secondary" startIcon={<Clear />} onClick={clearFilter}>
          Clear Filter
        </Button>
        <Button variant="contained" color="success" startIcon={<Download />} onClick={exportToExcel}>
          Export to Excel
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(record.check_in)}</TableCell>
                  <TableCell>{record.employee_name}</TableCell>
                  <TableCell>{formatTime(record.check_in)}</TableCell>
                  <TableCell>{formatTime(record.check_out)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No attendance records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DatesPage;

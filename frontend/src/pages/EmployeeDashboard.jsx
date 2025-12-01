import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import {
  CameraAlt,
  HighlightOff,
  CheckCircle,
  Logout,
  CalendarToday,
  Download,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';



const EmployeeDashboard = ({ username }) => {
  const videoRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [status, setStatus] = useState('');
  const [disabledBtn, setDisabledBtn] = useState({ checkin: false, checkout: false });
  const [attendance, setAttendance] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);


  const storedUsername = localStorage.getItem('username');
  const finalUsername = username || storedUsername;

  useEffect(() => {
    if (finalUsername) fetchAttendance();
  }, [finalUsername]);

 const fetchAttendance = async () => {
  try {
    const res = await fetch(`http://localhost:3001/attendance?username=${finalUsername}`);
    const data = await res.json();
    const allData = data.data || [];

    // ترتيب السجلات حسب أحدث تاريخ check_in (أو check_out إذا check_in غير موجود)
    const sortedData = [...allData].sort((a, b) => {
      const dateA = new Date(a.check_in || a.check_out || 0);
      const dateB = new Date(b.check_in || b.check_out || 0);
      return dateB - dateA;
    });

    setAttendance(sortedData);
    setFilteredAttendance(sortedData);

    // التحقق من أن آخر سجل فيه check_in فقط ولم يتم تسجيل check_out
    const latest = sortedData.find((entry) => entry.check_in);
    const isCheckedIn = latest && !latest.check_out;
    setHasCheckedIn(isCheckedIn);

  } catch (err) {
    console.error(err);
    setStatus('Error fetching attendance records');
  }
};


  const applyDateFilter = () => {
    const result = attendance.filter((record) => {
      if (!record.check_in) return false;
     const localDate = new Date(record.check_in);
const year = localDate.getFullYear();
const month = String(localDate.getMonth() + 1).padStart(2, '0');
const day = String(localDate.getDate()).padStart(2, '0');
const checkInDate = `${year}-${month}-${day}`;


      return checkInDate === filterDate;
    });

    console.log('📅 Applied filter for date:', filterDate);
    setFilteredAttendance(result);
  };
  const clearFilter = () => {
  setFilterDate('');
  setFilteredAttendance(attendance);
};

  const toggleCamera = async () => {
    if (isCameraOn) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } catch (err) {
        setStatus('Camera access denied');
      }
    }
    setIsCameraOn(!isCameraOn);
    setStatus('');
  };

  const captureAndSubmit = async (action) => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        setStatus('Processing...');
        setDisabledBtn(prev => ({ ...prev, [action]: true }));

        const formData = new FormData();
        formData.append('image', blob, 'face.jpg');
        formData.append('action', action);
        formData.append('username', finalUsername);

        try {
          const res = await fetch('http://localhost:3001/attendance', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          setStatus(data.message);
          if (data.success) {
            fetchAttendance();
          }
        } catch (err) {
          setStatus('Error submitting attendance');
        } finally {
          setTimeout(() => setDisabledBtn({ checkin: false, checkout: false }), 5000);
        }
      }, 'image/jpeg');
    } else {
      setStatus('Camera not ready. Please try again.');
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredAttendance);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
    XLSX.writeFile(wb, 'attendance_records.xlsx');
  };

  return (
    <Box
      sx={{
        p: 4,
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #e6ecf3, #ffffff)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 4,
          fontWeight: 700,
          color: '#1e293b',
          borderBottom: '2px solid #94a3b8',
          pb: 1,
        }}
      >
        <CheckCircle sx={{ mr: 1, verticalAlign: 'middle', color: '#10b981' }} /> Employee Dashboard
      </Typography>

      <Paper
        elevation={4}
        sx={{
          p: 3,
          borderRadius: '20px',
          width: '100%',
          maxWidth: 700,
          backgroundColor: '#f8fafc',
        }}
      >
        <Box sx={{ mb: 3 }}>
          <video
            ref={videoRef}
            style={{
              width: '100%',
              borderRadius: '20px',
              border: '4px solid #cbd5e1',
              boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
              display: isCameraOn ? 'block' : 'none',
              margin: 'auto',
            }}
            autoPlay
            muted
          ></video>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={isCameraOn ? <HighlightOff /> : <CameraAlt />}
            onClick={toggleCamera}
            color={isCameraOn ? 'error' : 'primary'}
            sx={{ borderRadius: 30, px: 4, py: 1.5, fontWeight: 'bold' }}
          >
            {isCameraOn ? 'Stop Camera' : 'Start Camera'}
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={() => captureAndSubmit('checkin')}
            disabled={!isCameraOn || disabledBtn.checkin}
            startIcon={<CheckCircle />}
            sx={{ borderRadius: 30, px: 4, py: 1.5, fontWeight: 'bold' }}
          >
            Check In
          </Button>

          <Button
            variant="contained"
            color="warning"
            onClick={() => captureAndSubmit('checkout')}
            disabled={!isCameraOn || disabledBtn.checkout || !hasCheckedIn}
            startIcon={<Logout />}
            sx={{ borderRadius: 30, px: 4, py: 1.5, fontWeight: 'bold' }}
          >
            Check Out
          </Button>

        </Box>

        {status && (
          <Alert severity={status.includes('success') ? 'success' : 'info'} sx={{ mt: 3, borderRadius: 2 }}>
            {status}
          </Alert>
        )}
      </Paper>

      <Paper
        elevation={3}
        sx={{ mt: 5, p: 3, width: '100%', maxWidth: 900, borderRadius: '20px', backgroundColor: '#f1f5f9' }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 3, fontWeight: 'bold', color: '#1e293b', borderBottom: '2px solid #cbd5e1', pb: 1 }}
        >
          <CalendarToday sx={{ mr: 1, verticalAlign: 'middle', color: '#0284c7' }} /> Attendance Records
        </Typography>

        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <TextField
            label="Filter by Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            sx={{ flex: 1 }}
          />
          
        <IconButton
  onClick={applyDateFilter}
  color="primary"
  sx={{ border: '1px solid #ccc', p: 1.2 }}
  title="Apply Filter"
>
  <FilterAltIcon />
</IconButton>

<IconButton
  onClick={clearFilter}
  color="error"
  sx={{ border: '1px solid #ccc', p: 1.2 }}
  title="Clear Filter"
>
  <RestartAltIcon />
</IconButton>

<Button
  onClick={exportToExcel}
  variant="contained"
  color="info"
  startIcon={<Download />}
  sx={{ height: '56px', borderRadius: '50px', fontWeight: 'bold' }}
>
  Export to Excel
</Button>




        </Box>

        <TableContainer sx={{ borderRadius: '12px' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#e2e8f0' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check In</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Check Out</TableCell>
              </TableRow>
            </TableHead>
     <TableBody>
  {filteredAttendance.map((record, index) => (
    <TableRow key={index}>
      <TableCell>{record.employee_name}</TableCell>
      <TableCell>
        {record.check_in && !isNaN(new Date(record.check_in))
          ? format(new Date(record.check_in), 'yyyy-MM-dd HH:mm')
          : '-'}
      </TableCell>
      <TableCell>
        {record.check_out && !isNaN(new Date(record.check_out))
          ? format(new Date(record.check_out), 'yyyy-MM-dd HH:mm')
          : '-'}
      </TableCell>
    </TableRow>
  ))}
</TableBody>

          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default EmployeeDashboard;

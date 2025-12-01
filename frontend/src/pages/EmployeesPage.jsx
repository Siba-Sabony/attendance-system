import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import * as faceapi from 'face-api.js';
import {
  Box, Typography, TextField, Button, FormControl, InputLabel, Select,
  MenuItem, Alert, Paper, IconButton, Tooltip
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

const EmployeePage = () => {
  const videoRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [formData, setFormData] = useState({ name: '', gender: '', type: '', password: '' });
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    };
    loadModels();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkFaceInFile = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
        if (detections.length === 1) resolve(true);
        else resolve(detections.length);
      };
      img.onerror = () => resolve(0);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const toggleCamera = async () => {
    if (cameraOn) {
      const stream = videoRef.current.srcObject;
      stream?.getTracks().forEach(track => track.stop());
      setCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setCameraOn(true);
      } catch {
        alert('Camera access denied');
      }
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(async blob => {
      if (blob) {
        setStatus('Checking face...');
        const file = new File([blob], `capture.jpg`, { type: 'image/jpeg' });
        const faceResult = await checkFaceInFile(file);
        if (faceResult === true) {
          setCapturedImages(prev => [...prev, file]);
          setStatus('Image added successfully.');
          setErrors({ ...errors, images: null });
        } else if (faceResult === 0) {
          setStatus('No face detected in the image.');
        } else {
          setStatus('Multiple faces detected. Please capture a clear image with one face only.');
        }
      }
    }, 'image/jpeg');
  };

  const handleImageUpload = async e => {
    const files = Array.from(e.target.files);
    for (let file of files) {
      setStatus('Checking face in uploaded image...');
      const faceResult = await checkFaceInFile(file);
      if (faceResult === true) {
        setCapturedImages(prev => [...prev, file]);
        setErrors(prev => ({ ...prev, images: null }));
      } else if (faceResult === 0) {
        setStatus('No face detected in the uploaded image.');
      } else {
        setStatus('Multiple faces detected in the uploaded image.');
      }
    }
    e.target.value = null;
  };

  const removeImage = idx => {
    setCapturedImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!capturedImages.length) {
      setErrors({ ...errors, images: 'At least one image is required' });
      return;
    }

    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    capturedImages.forEach(img => fd.append('images', img));

    try {
      const res = await axios.post('http://localhost:3001/employees', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setStatus('Employee added successfully.');
        setFormData({ name: '', gender: '', type: '', password: '' });
        setCapturedImages([]);
      } else setStatus('Failed to add employee.');
    } catch {
      setStatus('Error occurred while adding employee.');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto', borderRadius: 4 }}>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 3 }}>Add New Employee</Typography>
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Name" name="name" value={formData.name} onChange={handleChange}
            error={!!errors.name} helperText={errors.name} sx={{ mb: 2 }} required />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Gender</InputLabel>
            <Select name="gender" value={formData.gender} onChange={handleChange} required>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select name="type" value={formData.type} onChange={handleChange} required>
              <MenuItem value="Full Time">Full Time</MenuItem>
              <MenuItem value="Part Time">Part Time</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth type="password" label="Password" name="password" value={formData.password}
            onChange={handleChange} error={!!errors.password} helperText={errors.password} sx={{ mb: 2 }} required  autoComplete="new-password" />

          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <Button variant="outlined" component="label" startIcon={<AddPhotoAlternateIcon />}>
              Upload Images
              <input type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {capturedImages.map((img, idx) => {
              const url = URL.createObjectURL(img);
              return (
                <Box key={idx} sx={{ position: 'relative', width: 100, height: 100, borderRadius: 1, overflow: 'hidden' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton size="small" onClick={() => removeImage(idx)}
                    sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff' }}>
                    <HighlightOffIcon fontSize="small" />
                  </IconButton>
                </Box>
              );
            })}
          </Box>
          {!!errors.images && <Typography variant="caption" color="error">{errors.images}</Typography>}

          <Box sx={{ mb: 2 }}>
            <video ref={videoRef} autoPlay muted style={{ width: '100%', display: cameraOn ? 'block' : 'none', borderRadius: 8 }} />
            <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
              <Button onClick={toggleCamera} variant="contained" color={cameraOn ? 'error' : 'primary'}
                startIcon={cameraOn ? <HighlightOffIcon /> : <CameraAltIcon />}>
                {cameraOn ? 'Stop Camera' : 'Start Camera'}
              </Button>
              <Button onClick={captureImage} variant="outlined" disabled={!cameraOn}>
                Capture
              </Button>
              <Typography variant="body2" sx={{ mt: 1 }}>{capturedImages.length} image(s)</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button type="submit" variant="contained" color="primary">Add Employee</Button>
            <Tooltip title="Reset Form">
              <IconButton onClick={() => window.location.reload()} color="secondary">
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </form>

        {status && <Alert severity={status.includes('successfully') ? 'success' : 'error'} sx={{ mt: 2 }}>{status}</Alert>}
      </Paper>
    </Box>
  );
};

export default EmployeePage;

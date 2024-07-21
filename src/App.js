import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const FileUploadComponent = () => {
  const [files, setFiles] = useState([]);
  const [fileNames, setFileNames] = useState([]);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const statusIntervalRef = useRef(null);

  const handleFileChange = (e) => {
    setError('');
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length < 3) {
      setError('You must upload more than one files');
      return;
    }

    setFiles(selectedFiles);
    setFileNames(selectedFiles.map(file => file.name));
  };

  const handleUpload = async () => {
    if (files.length !== 3) {
      setError('You must upload more than one files');
      return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    setIsLoading(true);

    try {
      const response = await axios.post('http://0.0.0.0:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setJobId(response.data.job_id);
      setStatus('Uploading...');
    } catch (error) {
      console.error('Error uploading files', error);
      setError('Error uploading files');
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!jobId) return;
    try {
      const response = await axios.get(`http://0.0.0.0:8000/jobs/${jobId}`);
      setStatus(response.data.status);
      if (response.data.status === 'SUCCESS') {
        setDownloadUrl(response.data.download_url);
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
          statusIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error('Error checking job status', error);
      setError('Error checking job status');
    }
  };

  useEffect(() => {
    if (jobId) {
      statusIntervalRef.current = setInterval(() => {
        checkStatus();
      }, 3000);

      return () => {
        if (statusIntervalRef.current) {
          clearInterval(statusIntervalRef.current);
        }
      };
    }
  }, [jobId]);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#5F9EA0',
    padding: '10px',
  };

  const buttonStyle = {
    margin: '10px',
    backgroundColor: "#ADD8E6",
  };

  const buttonStyle1 = {
    margin: '10px',
    backgroundColor: "#008080",
  };

  return (
    <div style={containerStyle}>
      <h1>Video Combiner</h1>
      <input
        multiple
        type="file"
        id="fileInput"
        name="file"
        accept=".mp4, .avi, .mov"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isLoading}
      />
      <button onClick={() => document.getElementById('fileInput').click()} style={buttonStyle} disabled={isLoading}>
        Select Videos
      </button>
      <button onClick={handleUpload} style={buttonStyle1} disabled={isLoading}>
        {isLoading ? 'Uploading...' : 'Upload Videos'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {fileNames.length > 0 && (
        <div>
          <h2>Selected Files:</h2>
          <ul>
            {fileNames.map((fileName, index) => (
              <li key={index}>{fileName}</li>
            ))}
          </ul>
        </div>
      )}
      {jobId && <p>Job ID: {jobId}</p>}
      <p>Status: {status}</p>
      {status === 'SUCCESS' && downloadUrl && (
        <a href={downloadUrl} download>Download Combined Video</a>
      )}
    </div>
  );
};

export default FileUploadComponent;

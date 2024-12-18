import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Chip,
  Typography
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DateRangePicker from '@mui/lab/DateRangePicker';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';

const DataExport = ({ data, sensors }) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState('csv');
  const [dateRange, setDateRange] = useState([null, null]);
  const [selectedSensors, setSelectedSensors] = useState([]);

  const handleExport = () => {
    // Filter data based on selected criteria
    let exportData = data.filter(item => {
      const date = new Date(item.timestamp);
      const inDateRange = (!dateRange[0] || date >= dateRange[0]) &&
                         (!dateRange[1] || date <= dateRange[1]);
      const inSensorList = selectedSensors.length === 0 || 
                          selectedSensors.includes(item.sensorId);
      return inDateRange && inSensorList;
    });

    // Format data based on selected format
    let output;
    if (format === 'csv') {
      output = formatCSV(exportData);
      downloadFile(output, 'sensor_data.csv', 'text/csv');
    } else if (format === 'json') {
      output = JSON.stringify(exportData, null, 2);
      downloadFile(output, 'sensor_data.json', 'application/json');
    } else if (format === 'excel') {
      output = formatExcel(exportData);
      downloadFile(output, 'sensor_data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    setOpen(false);
  };

  const formatCSV = (data) => {
    const headers = ['Timestamp', 'Sensor ID', 'Value', 'Unit'];
    const rows = data.map(item => [
      new Date(item.timestamp).toISOString(),
      item.sensorId,
      item.value,
      item.unit
    ]);
    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  };

  const formatExcel = (data) => {
    // In a real application, you would use a library like xlsx
    // For now, we'll just use CSV format
    return formatCSV(data);
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FileDownloadIcon />}
        onClick={() => setOpen(true)}
      >
        Export Data
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export Sensor Data</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={format}
                label="Export Format"
                onChange={(e) => setFormat(e.target.value)}
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle2" gutterBottom>
              Select Sensors
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {sensors.map(sensor => (
                <Chip
                  key={sensor.id}
                  label={sensor.id}
                  onClick={() => {
                    setSelectedSensors(prev =>
                      prev.includes(sensor.id)
                        ? prev.filter(id => id !== sensor.id)
                        : [...prev, sensor.id]
                    );
                  }}
                  color={selectedSensors.includes(sensor.id) ? "primary" : "default"}
                />
              ))}
            </Box>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateRangePicker
                startText="Start Date"
                endText="End Date"
                value={dateRange}
                onChange={setDateRange}
                renderInput={(startProps, endProps) => (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField {...startProps} />
                    <TextField {...endProps} />
                  </Box>
                )}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} variant="contained">
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataExport;

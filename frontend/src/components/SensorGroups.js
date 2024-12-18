import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Pie } from 'react-chartjs-2';

const SensorGroups = ({ sensors, realtimeData }) => {
  const [groups, setGroups] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    sensors: [],
    color: '#' + Math.floor(Math.random()*16777215).toString(16)
  });

  // Load saved groups from localStorage
  useEffect(() => {
    const savedGroups = localStorage.getItem('sensorGroups');
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }
  }, []);

  // Save groups to localStorage when they change
  useEffect(() => {
    localStorage.setItem('sensorGroups', JSON.stringify(groups));
  }, [groups]);

  const handleAddGroup = () => {
    if (newGroup.name && newGroup.sensors.length > 0) {
      if (editingGroup) {
        setGroups(prev => prev.map(group =>
          group.id === editingGroup.id ? { ...newGroup, id: group.id } : group
        ));
      } else {
        setGroups(prev => [...prev, { ...newGroup, id: Date.now() }]);
      }
      setOpenDialog(false);
      setNewGroup({
        name: '',
        description: '',
        sensors: [],
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      });
      setEditingGroup(null);
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setNewGroup(group);
    setOpenDialog(true);
  };

  const handleDeleteGroup = (groupId) => {
    setGroups(prev => prev.filter(group => group.id !== groupId));
  };

  const calculateGroupStats = (group) => {
    const stats = {
      avgValue: 0,
      minValue: Infinity,
      maxValue: -Infinity,
      activeCount: 0
    };

    group.sensors.forEach(sensorId => {
      const data = realtimeData[sensorId];
      if (data) {
        const value = parseFloat(data.value);
        stats.avgValue += value;
        stats.minValue = Math.min(stats.minValue, value);
        stats.maxValue = Math.max(stats.maxValue, value);
        stats.activeCount++;
      }
    });

    if (stats.activeCount > 0) {
      stats.avgValue /= stats.activeCount;
    }

    return stats;
  };

  const pieData = {
    labels: groups.map(g => g.name),
    datasets: [{
      data: groups.map(g => calculateGroupStats(g).avgValue),
      backgroundColor: groups.map(g => g.color)
    }]
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Sensor Groups</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Create Group
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Groups List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <List>
                {groups.map(group => {
                  const stats = calculateGroupStats(group);
                  return (
                    <ListItem key={group.id}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">{group.name}</Typography>
                            {group.sensors.map(sensorId => (
                              <Chip
                                key={sensorId}
                                label={sensorId}
                                size="small"
                                sx={{ backgroundColor: group.color }}
                              />
                            ))}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">{group.description}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Avg: {stats.avgValue.toFixed(2)} | 
                              Min: {stats.minValue === Infinity ? 'N/A' : stats.minValue.toFixed(2)} | 
                              Max: {stats.maxValue === -Infinity ? 'N/A' : stats.maxValue.toFixed(2)} | 
                              Active: {stats.activeCount}/{group.sensors.length}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleEditGroup(group)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Group Statistics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Group Average Values
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add/Edit Group Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          setEditingGroup(null);
          setNewGroup({
            name: '',
            description: '',
            sensors: [],
            color: '#' + Math.floor(Math.random()*16777215).toString(16)
          });
        }}
      >
        <DialogTitle>
          {editingGroup ? 'Edit Group' : 'Create Group'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Group Name"
              value={newGroup.name}
              onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Description"
              value={newGroup.description}
              onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />

            <Autocomplete
              multiple
              value={newGroup.sensors}
              onChange={(e, newValue) => setNewGroup(prev => ({ ...prev, sensors: newValue }))}
              options={sensors.map(s => s.id)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Sensors"
                  placeholder="Select sensors"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    sx={{ backgroundColor: newGroup.color }}
                  />
                ))
              }
            />

            <TextField
              label="Group Color"
              type="color"
              value={newGroup.color}
              onChange={(e) => setNewGroup(prev => ({ ...prev, color: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setEditingGroup(null);
            setNewGroup({
              name: '',
              description: '',
              sensors: [],
              color: '#' + Math.floor(Math.random()*16777215).toString(16)
            });
          }}>
            Cancel
          </Button>
          <Button onClick={handleAddGroup} variant="contained">
            {editingGroup ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SensorGroups;

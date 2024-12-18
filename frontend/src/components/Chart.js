import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const Chart = ({ 
  data, 
  type = 'line', 
  title = 'Sensor Data',
  timeRange = '1h',
  sensors = [] 
}) => {
  // Group data by sensor
  const sensorData = {};
  sensors.forEach(sensor => {
    sensorData[sensor.id] = data.filter(d => d.sensorId === sensor.id);
  });

  // Generate random color for each sensor
  const getColor = (index) => {
    const colors = [
      'rgba(75,192,192,1)',
      'rgba(255,99,132,1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)'
    ];
    return colors[index % colors.length];
  };

  // Configure chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // Disable animation for real-time updates
    },
    plugins: {
      title: {
        display: true,
        text: title
      },
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === '1h' ? 'minute' : 'hour',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: sensors[0]?.unit || 'Value'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  // Prepare chart data
  const chartData = {
    datasets: sensors.map((sensor, index) => ({
      label: sensor.id,
      data: sensorData[sensor.id].map(d => ({
        x: new Date(d.timestamp),
        y: d.value
      })),
      borderColor: getColor(index),
      backgroundColor: type === 'bar' ? getColor(index) : undefined,
      fill: false,
      tension: 0.4
    }))
  };

  // Render appropriate chart type
  return (
    <div style={{ height: '400px', width: '100%' }}>
      {type === 'line' ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
};

export default Chart;

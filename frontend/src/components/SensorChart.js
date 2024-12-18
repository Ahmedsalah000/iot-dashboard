import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SensorChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/chart?timeframe=${timeframe}`);
        const data = response.data;

        // Group data by sensorId
        const groupedData = data.reduce((acc, item) => {
          if (!acc[item.sensorId]) {
            acc[item.sensorId] = [];
          }
          acc[item.sensorId].push({
            value: item.value,
            timestamp: new Date(item.timestamp),
          });
          return acc;
        }, {});

        // Create datasets for each sensor
        const datasets = Object.entries(groupedData).map(([sensorId, data]) => ({
          label: `Sensor ${sensorId}`,
          data: data.map(item => item.value),
          fill: false,
          borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
          tension: 0.1,
        }));

        // Create labels from timestamps
        const labels = data
          .map(item => new Date(item.timestamp).toLocaleTimeString())
          .filter((value, index, self) => self.indexOf(value) === index);

        setChartData({
          labels,
          datasets,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [timeframe]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 20,
          padding: 15,
          font: {
            size: (window.innerWidth < 768) ? 10 : 12
          }
        }
      },
      title: {
        display: true,
        text: 'Sensor Data Chart',
        font: {
          size: (window.innerWidth < 768) ? 14 : 16
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: (window.innerWidth < 768) ? 10 : 12
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: (window.innerWidth < 768) ? 10 : 12
          }
        }
      }
    }
  };

  return (
    <div>
      <div className="chart-controls">
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          style={{
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            fontSize: '1rem'
          }}
        >
          <option value="1h">Last Hour</option>
          <option value="6h">Last 6 Hours</option>
          <option value="24h">Last 24 Hours</option>
        </select>
      </div>
      <div style={{ height: '60vh', minHeight: '300px' }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};

export default SensorChart;

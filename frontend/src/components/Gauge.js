import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const Gauge = ({ value, min, max, unit, title }) => {
  // Calculate percentage and color
  const percentage = ((value - min) / (max - min)) * 100;
  const getColor = (percent) => {
    if (percent < 25) return 'rgba(255, 99, 132, 0.8)'; // Red
    if (percent < 75) return 'rgba(255, 206, 86, 0.8)'; // Yellow
    return 'rgba(75, 192, 192, 0.8)'; // Green
  };

  const remainingPercentage = 100 - percentage;
  
  const data = {
    datasets: [{
      data: [percentage, remainingPercentage],
      backgroundColor: [
        getColor(percentage),
        'rgba(200, 200, 200, 0.1)'
      ],
      borderWidth: 0,
      circumference: 180,
      rotation: 270,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: false
      }
    },
    cutout: '75%'
  };

  return (
    <div style={{ position: 'relative', height: '200px', width: '100%' }}>
      <Doughnut data={data} options={options} />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
          {value.toFixed(1)} {unit}
        </div>
        <div style={{ fontSize: '0.9em', color: '#666' }}>
          {title}
        </div>
      </div>
    </div>
  );
};

export default Gauge;

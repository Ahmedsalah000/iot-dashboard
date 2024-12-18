import React from 'react';
import SensorChart from './components/SensorChart';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>IoT Dashboard</h1>
      </header>
      <main className="App-main">
        <div className="chart-container">
          <SensorChart />
        </div>
      </main>
    </div>
  );
}

export default App;

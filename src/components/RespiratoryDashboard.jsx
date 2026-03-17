import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function RespiratoryDashboard({ readings }) {
  // Filter out null/empty readings
  const validReadings = readings.filter(r => r.time && (r.HR || r.RR || r.oxygen));

  if (validReadings.length === 0) {
    return <p>No valid readings to display</p>;
  }

  // Extract data for charts
  const timeLabels = validReadings.map(r => r.time);
  const hrData = validReadings.map(r => r.HR ? parseFloat(r.HR) : null);
  const rrData = validReadings.map(r => r.RR ? parseFloat(r.RR) : null);
  const o2Data = validReadings.map(r => r.oxygen ? parseFloat(r.oxygen) : null);
  const fio2Data = validReadings.map(r => r.FIO2 ? parseFloat(r.FIO2) : null);

  // Detect respiratory distress
  const hasRespiratoryDistress = validReadings.some(r => {
    const rr = parseFloat(r.RR);
    const o2 = parseFloat(r.oxygen);
    return (rr > 60 || rr < 30) || (o2 < 92);
  });

  // Combined vital signs chart
  const vitalSignsData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Heart Rate (HR)',
        data: hrData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'Respiratory Rate (RR)',
        data: rrData,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'O2 Saturation (%)',
        data: o2Data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        yAxisID: 'y1',
        tension: 0.3,
      },
    ],
  };

  const vitalSignsOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Respiratory & Cardiac Monitoring',
        font: { size: 16 }
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'HR / RR (bpm / breaths/min)'
        },
        min: 0,
        max: 200,
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'O2 Saturation (%)'
        },
        min: 70,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  
  return (
    <div style={{ marginTop: '40px' }}>
      <h2>🫁 Respiratory Distress Detection Dashboard</h2>

      {/* Alert Banner */}
      {hasRespiratoryDistress && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ff4444',
          color: 'white',
          borderRadius: '5px',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          ⚠️ ALERT: Respiratory distress pattern detected! Abnormal RR or low O2 saturation found.
        </div>
      )}

      {/* Combined Vitals Chart */}
      <div style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <Line data={vitalSignsData} options={vitalSignsOptions} />
      </div>

     

      {/* Clinical Summary */}
      <div style={{ padding: '20px', backgroundColor: '#e8f4f8', borderRadius: '8px' }}>
        <h3>Clinical Summary</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li><strong>Total Readings:</strong> {validReadings.length}</li>
          <li><strong>Average HR:</strong> {(hrData.filter(v => v).reduce((a, b) => a + b, 0) / hrData.filter(v => v).length).toFixed(1)} bpm</li>
          <li><strong>Average RR:</strong> {(rrData.filter(v => v).reduce((a, b) => a + b, 0) / rrData.filter(v => v).length).toFixed(1)} breaths/min</li>
          <li><strong>Average O2 Sat:</strong> {(o2Data.filter(v => v).reduce((a, b) => a + b, 0) / o2Data.filter(v => v).length).toFixed(1)}%</li>
          <li><strong>Lowest O2 Sat:</strong> {Math.min(...o2Data.filter(v => v))}% {Math.min(...o2Data.filter(v => v)) < 92 ? '🔴 Critical' : '✅ Normal'}</li>
          <li><strong>Respiratory Status:</strong> {hasRespiratoryDistress ? '🔴 Distress Detected' : '✅ Stable'}</li>
        </ul>
      </div>
    </div>
  );
}

export default RespiratoryDashboard;
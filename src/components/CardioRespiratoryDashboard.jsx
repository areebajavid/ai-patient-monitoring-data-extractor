import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function CardioRespiratoryDashboard({ readings }) {
  if (!readings || readings.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        No cardiorespiratory data available
      </div>
    );
  }

  // Extract data
  const timeLabels = readings.map(r => r.time || 'N/A');
  const hrData = readings.map(r => parseFloat(r.HR) || null);
  const rrData = readings.map(r => parseFloat(r.RR) || null);
  const spo2Data = readings.map(r => parseFloat(r.oxygen) || null);

  // Calculate averages for summary
  const avgHR = hrData.filter(v => v !== null).reduce((a, b) => a + b, 0) / hrData.filter(v => v !== null).length || 0;
  const avgRR = rrData.filter(v => v !== null).reduce((a, b) => a + b, 0) / rrData.filter(v => v !== null).length || 0;
  const avgSpO2 = spo2Data.filter(v => v !== null).reduce((a, b) => a + b, 0) / spo2Data.filter(v => v !== null).length || 0;

  // Detect "The Cross" - HR up, SpO2 down
  const crossAlerts = [];
  for (let i = 1; i < readings.length; i++) {
    const prevHR = parseFloat(readings[i - 1].HR);
    const currHR = parseFloat(readings[i].HR);
    const prevSpO2 = parseFloat(readings[i - 1].oxygen);
    const currSpO2 = parseFloat(readings[i].oxygen);

    if (currHR > prevHR + 20 && currSpO2 < prevSpO2 - 3) {
      crossAlerts.push({
        time: readings[i].time,
        message: `HR increased from ${prevHR} to ${currHR}, SpO2 dropped from ${prevSpO2}% to ${currSpO2}%`
      });
    }
  }

  // Detect bradycardia (HR < 100 for neonates)
  const bradycardiaEvents = readings.filter(r => parseFloat(r.HR) < 100 && parseFloat(r.HR) > 0);

  // Chart configuration
  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Heart Rate (bpm)',
        data: hrData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y-hr-rr'
      },
      {
        label: 'Respiratory Rate (/min)',
        data: rrData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y-hr-rr'
      },
      {
        label: 'SpO₂ (%)',
        data: spo2Data,
        borderColor: '#14b8a6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y-spo2',
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { size: 13, weight: 'bold' } }
      },
      title: {
        display: true,
        text: 'Cardiorespiratory Monitoring: HR, RR, and SpO₂',
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
              if (context.dataset.label === 'SpO₂ (%)') {
                label += '%';
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time',
          font: { size: 14, weight: 'bold' }
        }
      },
      'y-hr-rr': {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'HR (bpm) / RR (/min)',
          font: { size: 14, weight: 'bold' }
        },
        min: 0,
        max: 200,
        ticks: {
          stepSize: 20
        }
      },
      'y-spo2': {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'SpO₂ (%)',
          font: { size: 14, weight: 'bold' },
          color: '#14b8a6'
        },
        min: 70,
        max: 100,
        ticks: {
          stepSize: 5,
          callback: function(value) {
            // Highlight target zone (88-95%)
            if (value >= 88 && value <= 95) {
              return '★ ' + value + '%';
            }
            return value + '%';
          }
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  return (
    <div>
      <h2 style={{ 
        fontSize: '20px', 
        fontWeight: '600', 
        color: '#1e293b',
        marginBottom: '20px',
        margin: '0 0 20px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        💓 Cardiorespiratory Monitoring
      </h2>

      {/* Critical Alerts */}
      {crossAlerts.length > 0 && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#fee2e2', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #dc2626'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#991b1b', margin: '0 0 12px 0' }}>
            ⚠️ ACUTE DISTRESS ALERTS: "The Cross" Detected
          </h3>
          {crossAlerts.map((alert, idx) => (
            <div key={idx} style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '8px' }}>
              • <strong>{alert.time}:</strong> {alert.message}
            </div>
          ))}
        </div>
      )}

      {bradycardiaEvents.length > 0 && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#fef3c7', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #f59e0b'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', margin: '0 0 12px 0' }}>
            ⚠️ Bradycardia Events (HR &lt; 100 bpm)
          </h3>
          <div style={{ fontSize: '14px', color: '#78350f' }}>
            {bradycardiaEvents.length} events detected at: {bradycardiaEvents.map(e => e.time).join(', ')}
          </div>
        </div>
      )}

      {/* Summary Cards - COMPACT */}
      <div style={{ 
        display: 'flex',
        gap: '12px',
        marginBottom: '28px',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          padding: '10px 16px', 
          backgroundColor: '#fee2e2', 
          borderRadius: '6px',
          border: '2px solid #ef4444',
          minWidth: '140px'
        }}>
          <div style={{ fontSize: '10px', color: '#7f1d1d', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>
            Avg Heart Rate
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#991b1b' }}>
            {avgHR.toFixed(0)} bpm
          </div>
        </div>

        <div style={{ 
          padding: '10px 16px', 
          backgroundColor: '#dbeafe', 
          borderRadius: '6px',
          border: '2px solid #3b82f6',
          minWidth: '140px'
        }}>
          <div style={{ fontSize: '10px', color: '#1e3a8a', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>
            Avg Respiratory Rate
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e40af' }}>
            {avgRR.toFixed(0)} /min
          </div>
        </div>

        <div style={{ 
          padding: '10px 16px', 
          backgroundColor: avgSpO2 >= 88 && avgSpO2 <= 95 ? '#d1fae5' : '#fef3c7', 
          borderRadius: '6px',
          border: avgSpO2 >= 88 && avgSpO2 <= 95 ? '2px solid #10b981' : '2px solid #f59e0b',
          minWidth: '140px'
        }}>
          <div style={{ fontSize: '10px', color: avgSpO2 >= 88 && avgSpO2 <= 95 ? '#065f46' : '#92400e', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>
            Avg SpO₂ {avgSpO2 >= 88 && avgSpO2 <= 95 ? '(Target)' : '(Out of Range)'}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: avgSpO2 >= 88 && avgSpO2 <= 95 ? '#059669' : '#b45309' }}>
            {avgSpO2.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div style={{ 
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ height: '450px' }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default CardioRespiratoryDashboard;
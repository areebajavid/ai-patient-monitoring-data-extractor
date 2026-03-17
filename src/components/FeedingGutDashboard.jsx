import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

function FeedingGutDashboard({ readings }) {
  if (!readings || readings.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        No feeding/gut data available
      </div>
    );
  }

  // Extract data
  const timeLabels = readings.map(r => r.time || 'N/A');
  const abdominalGirthData = readings.map(r => parseFloat(r.abdominal_girth) || null);
  const gastricResidualData = readings.map(r => {
    const residual = r.rt_aspirate;
    if (!residual) return null;
    // Extract numeric value (e.g., "2 ml Clear" → 2)
    const match = residual.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[0]) : null;
  });

  // Detect NEC warning signs
  const necAlerts = [];
  for (let i = 1; i < readings.length; i++) {
    const prevGirth = parseFloat(readings[i - 1].abdominal_girth);
    const currGirth = parseFloat(readings[i].abdominal_girth);
    const currResidual = readings[i].rt_aspirate || '';

    // Alert if girth increased AND residual is green/bloody
    if (currGirth > prevGirth + 0.5 && (currResidual.toLowerCase().includes('green') || currResidual.toLowerCase().includes('bloody'))) {
      necAlerts.push({
        time: readings[i].time,
        message: `Abdominal girth increased from ${prevGirth}cm to ${currGirth}cm with ${currResidual} residual`
      });
    }
  }

  // Chart configuration
  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        type: 'line',
        label: 'Abdominal Girth (cm)',
        data: abdominalGirthData,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y-girth',
        fill: true
      },
      {
        type: 'bar',
        label: 'Gastric Residual (ml)',
        data: gastricResidualData,
        backgroundColor: '#34d399',  // Single color for all bars
        borderColor: '#10b981',
        borderWidth: 2,
        yAxisID: 'y-residual'
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
        text: 'Feeding & Gut Tracker: NEC Watch',
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
              if (context.dataset.label.includes('Girth')) {
                label += ' cm';
              } else {
                label += ' ml';
              }
            }
            return label;
          },
          afterLabel: function(context) {
            if (context.dataset.type === 'bar') {
              const residual = readings[context.dataIndex].rt_aspirate;
              return residual ? `Type: ${residual}` : '';
            }
            return '';
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
      'y-girth': {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Abdominal Girth (cm)',
          font: { size: 14, weight: 'bold' },
          color: '#8b5cf6'
        },
        min: 0,
        ticks: {
          stepSize: 1
        }
      },
      'y-residual': {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Gastric Residual (ml)',
          font: { size: 14, weight: 'bold' },
          color: '#64748b'
        },
        min: 0,
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
        🍼 Feeding & Gut Tracker (NEC Watch)
      </h2>

      {/* NEC Alerts */}
      {necAlerts.length > 0 && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#fee2e2', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #dc2626'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#991b1b', margin: '0 0 12px 0' }}>
            🚨 NEC WARNING SIGNS DETECTED
          </h3>
          {necAlerts.map((alert, idx) => (
            <div key={idx} style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '8px' }}>
              • <strong>{alert.time}:</strong> {alert.message}
            </div>
          ))}
          <div style={{ fontSize: '13px', color: '#991b1b', marginTop: '12px', fontWeight: '600' }}>
            ⚠️ Recommendation: Consider stopping feeds, obtain abdominal X-ray, consult neonatology
          </div>
        </div>
      )}

      {/* Main Chart */}
      <div style={{ 
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ height: '450px' }}>
          <Chart type='bar' data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default FeedingGutDashboard;
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function FluidBalanceTrendDashboard({ treatments, totalInput24hr }) {
  if (!treatments || treatments.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        No fluid balance data available
      </div>
    );
  }

  // Extract time labels
  const timeLabels = treatments.map(t => t.time || 'N/A');
  
  // Calculate hourly intake for each time slot
  const hourlyIntake = treatments.map(treatment => {
    let total = 0;
    
    // Add oral feeds
    if (treatment.oral_feeds) {
      total += parseFloat(treatment.oral_feeds.feeding_tube_ml) || 0;
      total += parseFloat(treatment.oral_feeds.spoon_cup_ml) || 0;
    }
    
    // Add IV fluids
    if (treatment.iv_fluids && treatment.iv_fluids.length > 0) {
      treatment.iv_fluids.forEach(fluid => {
        total += parseFloat(fluid.volume_ml) || 0;
      });
    }
    
    // Add IV infusions
    if (treatment.iv_infusions && treatment.iv_infusions.length > 0) {
      treatment.iv_infusions.forEach(infusion => {
        total += parseFloat(infusion.volume_ml) || 0;
      });
    }
    
    // Add IV bolus
    total += parseFloat(treatment.iv_bolus_ml) || 0;
    
    return total;
  });

  // Calculate cumulative intake
  const cumulativeIntake = [];
  let runningTotal = 0;
  hourlyIntake.forEach(intake => {
    runningTotal += intake;
    cumulativeIntake.push(runningTotal);
  });

  // Target for 24 hours
  const target24hr = parseFloat(totalInput24hr) || 370;

  // Detect if overload or dehydration risk
  const finalIntake = cumulativeIntake[cumulativeIntake.length - 1] || 0;
  let status = 'On Track';
  let statusColor = '#10b981';
  let statusBg = '#d1fae5';

  if (finalIntake > target24hr * 1.2) {
    status = '⚠️ Fluid Overload Risk';
    statusColor = '#dc2626';
    statusBg = '#fee2e2';
  } else if (finalIntake < target24hr * 0.8) {
    status = '⚠️ Dehydration Risk';
    statusColor = '#f59e0b';
    statusBg = '#fef3c7';
  }

  // Chart Data: Stacked Bar + Cumulative Line
  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        type: 'bar',
        label: 'Hourly Intake (ml)',
        data: hourlyIntake,
        backgroundColor: '#60a5fa',
        borderColor: '#3b82f6',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Cumulative Intake (ml)',
        data: cumulativeIntake,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Target (24hr Goal)',
        data: Array(timeLabels.length).fill(target24hr),
        borderColor: '#10b981',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
        yAxisID: 'y'
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
        text: '24-Hour Fluid Balance Trend',
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
              label += context.parsed.y + ' ml';
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
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Volume (ml)',
          font: { size: 14, weight: 'bold' }
        },
        beginAtZero: true
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
        💧 24-Hour Fluid Balance Trend
      </h2>

      {/* Summary Cards */}
      <div style={{ 
        display: 'flex',
        gap: '12px',
        marginBottom: '28px',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          padding: '10px 16px', 
          backgroundColor: '#dbeafe', 
          borderRadius: '6px',
          border: '2px solid #3b82f6',
          minWidth: '140px'
        }}>
          <div style={{ fontSize: '10px', color: '#1e3a8a', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>
            Total Intake
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e40af' }}>
            {finalIntake.toFixed(0)} ml
          </div>
        </div>

        <div style={{ 
          padding: '10px 16px', 
          backgroundColor: '#d1fae5', 
          borderRadius: '6px',
          border: '2px solid #10b981',
          minWidth: '140px'
        }}>
          <div style={{ fontSize: '10px', color: '#065f46', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>
            24hr Target
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#059669' }}>
            {target24hr} ml
          </div>
        </div>

        <div style={{ 
          padding: '10px 16px', 
          backgroundColor: statusBg, 
          borderRadius: '6px',
          border: `2px solid ${statusColor}`,
          minWidth: '140px'
        }}>
          <div style={{ fontSize: '10px', color: statusColor, marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>
            Status
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: statusColor }}>
            {status}
          </div>
        </div>

        <div style={{ 
          padding: '10px 16px', 
          backgroundColor: '#fef3c7', 
          borderRadius: '6px',
          border: '2px solid #f59e0b',
          minWidth: '140px'
        }}>
          <div style={{ fontSize: '10px', color: '#92400e', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>
            % of Target
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#b45309' }}>
            {((finalIntake / target24hr) * 100).toFixed(0)}%
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
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default FluidBalanceTrendDashboard;
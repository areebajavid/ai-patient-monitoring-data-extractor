import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Chart } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

function DrugAdministrationDashboard({ treatments }) {
  if (!treatments || treatments.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        No drug administration data available
      </div>
    );
  }

  // Extract time labels
  const timeLabels = treatments.map(t => t.time || 'N/A');
  
  // Count IV drugs per time slot
  const ivDrugCounts = treatments.map(treatment => {
    return (treatment.iv_drugs && treatment.iv_drugs.length) || 0;
  });

  // Count oral drugs per time slot
  const oralDrugCounts = treatments.map(treatment => {
    return (treatment.oral_drugs && treatment.oral_drugs.length) || 0;
  });

  // Collect all unique drugs for timeline
  const allIVDrugs = new Set();
  const allOralDrugs = new Set();
  
  treatments.forEach(treatment => {
    if (treatment.iv_drugs) {
      treatment.iv_drugs.forEach(drug => allIVDrugs.add(drug));
    }
    if (treatment.oral_drugs) {
      treatment.oral_drugs.forEach(drug => allOralDrugs.add(drug));
    }
  });

  const totalIVDrugs = Array.from(allIVDrugs).length;
  const totalOralDrugs = Array.from(allOralDrugs).length;

  // Chart Data
  const chartData = {
    labels: timeLabels,
    datasets: [
      {
        type: 'bar',
        label: 'IV Drugs (count)',
        data: ivDrugCounts,
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 2,
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: 'Oral Drugs (count)',
        data: oralDrugCounts,
        backgroundColor: '#8b5cf6',
        borderColor: '#7c3aed',
        borderWidth: 2,
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
        text: 'Drug Administration Timeline',
        font: { size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y + ' drugs';
          },
          afterLabel: function(context) {
            const treatment = treatments[context.dataIndex];
            const drugs = context.dataset.label.includes('IV') 
              ? treatment.iv_drugs 
              : treatment.oral_drugs;
            
            if (drugs && drugs.length > 0) {
              return drugs.map((drug, i) => `  ${i + 1}. ${drug}`).join('\n');
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
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Number of Drugs',
          font: { size: 14, weight: 'bold' }
        },
        beginAtZero: true,
        ticks: {
          stepSize: 1
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
        💊 Drug Administration Timeline
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
          backgroundColor: '#fee2e2', 
          borderRadius: '6px',
          border: '2px solid #ef4444',
          minWidth: '140px'
        }}>
          <div style={{ fontSize: '10px', color: '#7f1d1d', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>
            Unique IV Drugs
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#991b1b' }}>
            {totalIVDrugs}
          </div>
        </div>

        <div style={{ 
          padding: '10px 16px', 
          backgroundColor: '#ede9fe', 
          borderRadius: '6px',
          border: '2px solid #8b5cf6',
          minWidth: '140px'
        }}>
          <div style={{ fontSize: '10px', color: '#5b21b6', marginBottom: '2px', fontWeight: '600', textTransform: 'uppercase' }}>
            Unique Oral Drugs
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#6d28d9' }}>
            {totalOralDrugs}
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
            Total Administrations
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e40af' }}>
            {ivDrugCounts.reduce((a, b) => a + b, 0) + oralDrugCounts.reduce((a, b) => a + b, 0)}
          </div>
        </div>
      </div>

      {/* Drug Lists */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        {/* IV Drugs List */}
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#fee2e2', 
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#7f1d1d', margin: '0 0 12px 0' }}>
            💉 IV Drugs in Use
          </h3>
          {totalIVDrugs > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#991b1b' }}>
              {Array.from(allIVDrugs).map((drug, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{drug}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '13px', color: '#991b1b', fontStyle: 'italic', margin: 0 }}>No IV drugs</p>
          )}
        </div>

        {/* Oral Drugs List */}
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#ede9fe', 
          borderRadius: '8px',
          border: '1px solid #ddd6fe'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#5b21b6', margin: '0 0 12px 0' }}>
            💊 Oral Drugs in Use
          </h3>
          {totalOralDrugs > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#6d28d9' }}>
              {Array.from(allOralDrugs).map((drug, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{drug}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '13px', color: '#6d28d9', fontStyle: 'italic', margin: 0 }}>No oral drugs</p>
          )}
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
          <Chart type='bar' data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default DrugAdministrationDashboard;
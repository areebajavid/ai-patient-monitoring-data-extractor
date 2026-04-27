import React, { useState } from 'react';
import axios from 'axios';
import CardioRespiratoryDashboard from './CardioRespiratoryDashboard';
import FeedingGutDashboard from './FeedingGutDashboard';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

function UploadPage({ onNavigateToNurses }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [savedPatients, setSavedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [activeTab, setActiveTab] = useState('data');
  
  // NEW: State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    loadSavedPatients();
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setExtractedData(null);
      setSelectedPatient('');
      setIsSaved(false);
      setIsEditMode(false);
    }
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    if (!patientId.trim()) {
      alert('Please enter a Patient ID');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post('https://ai-patient-monitoring-data-extractor.onrender.com/extract', formData);
      if (response.data.success) {
        const data = response.data.data;
        setExtractedData(data);
        setEditableData(JSON.parse(JSON.stringify(data))); // Deep copy for editing
        setIsSaved(false);
        setIsEditMode(false);
        
        alert('Data extracted successfully! Please review and save.');
      } else {
        alert('Extraction failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error extracting data');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle Save to Firebase
  const handleSaveData = async () => {
    if (!patientId.trim()) {
      alert('Please enter a Patient ID');
      return;
    }

    try {
      await setDoc(doc(db, 'patients', patientId), {
        patientInfo: editableData.patient,
        readings: editableData.readings,
        uploadDate: new Date().toISOString(),
        timestamp: Date.now()
      });

      alert('Data saved successfully to Firebase!');
      setIsSaved(true);
      setIsEditMode(false);
      setExtractedData(editableData); // Update main data with edited version
      loadSavedPatients();
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data to Firebase');
    }
  };

  // NEW: Enable edit mode
  const handleEnableEdit = () => {
    setIsEditMode(true);
    setEditableData(JSON.parse(JSON.stringify(extractedData))); // Fresh copy
  };

  // NEW: Cancel edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditableData(JSON.parse(JSON.stringify(extractedData))); // Reset to original
  };

  // NEW: Handle patient info edit
  const handlePatientInfoChange = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      patient: {
        ...prev.patient,
        [field]: value
      }
    }));
  };

  // NEW: Handle reading edit
  const handleReadingChange = (index, field, value) => {
    setEditableData(prev => {
      const newReadings = [...prev.readings];
      newReadings[index] = {
        ...newReadings[index],
        [field]: value
      };
      return {
        ...prev,
        readings: newReadings
      };
    });
  };

  const loadSavedPatients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'patients'));
      const patients = [];
      querySnapshot.forEach((doc) => {
        patients.push({
          id: doc.id,
          name: doc.data().patientInfo.mother_name || 'Unknown',
          ...doc.data()
        });
      });
      setSavedPatients(patients);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const handleSelectPatient = async (patientId) => {
    if (!patientId) {
      setExtractedData(null);
      setSelectedPatient('');
      return;
    }
    
    const patient = savedPatients.find(p => p.id === patientId);
    if (patient) {
      setSelectedFile(null);
      setPreview(null);
      setPatientId('');
      
      const data = {
        patient: patient.patientInfo,
        readings: patient.readings
      };
      
      setExtractedData(data);
      setEditableData(JSON.parse(JSON.stringify(data)));
      setSelectedPatient(patientId);
      setIsSaved(true);
      setIsEditMode(false);
      
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleDeletePatient = async () => {
    if (!selectedPatient) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete patient record: ${selectedPatient}?`
    );
    
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, 'patients', selectedPatient));
        alert('Patient record deleted successfully!');
        
        setSelectedPatient('');
        setExtractedData(null);
        loadSavedPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Error deleting patient record');
      }
    }
  };

  // Data to display (either original or edited)
  const displayData = isEditMode ? editableData : extractedData;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      
      {/* SIDEBAR */}
      <div style={{ 
        width: '260px', 
        backgroundColor: '#1a252f', 
        color: 'white',
        padding: '24px 16px',
        boxShadow: '2px 0 12px rgba(0,0,0,0.1)',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto',
        borderRight: '1px solid #2d3748'
      }}>
        {/* Logo/Title */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '22px', 
            fontWeight: 'bold', 
            margin: 0,
            color: '#60a5fa',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🏥 SNCU Monitor
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', margin: 0 }}>
            Neonatal Care Analytics
          </p>
        </div>

        {/* Navigate to Nurses Order Sheet Button */}
        <button
          onClick={onNavigateToNurses}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '24px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          💊 Nurses Order Sheet →
        </button>

        {/* Patient History Section */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: '600',
            marginBottom: '12px',
            color: '#e2e8f0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📋 Patient Records
          </h3>
          
          {savedPatients.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
              No saved patients yet
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient.id)}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: selectedPatient === patient.id ? '#3b82f6' : '#2d3748',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: selectedPatient === patient.id ? '2px solid #60a5fa' : '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPatient !== patient.id) {
                      e.currentTarget.style.backgroundColor = '#374151';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPatient !== patient.id) {
                      e.currentTarget.style.backgroundColor = '#2d3748';
                    }
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '3px' }}>
                    {patient.id}
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                    {patient.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Button */}
        {selectedPatient && (
          <button
            onClick={handleDeletePatient}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              marginTop: '16px'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
          >
            🗑️ Delete Selected
          </button>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft: '260px', flex: 1, padding: '32px', maxWidth: 'calc(100vw - 260px)' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1e293b',
            margin: 0
          }}>
            Monitoring Sheet Extractor
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px', margin: '6px 0 0 0' }}>
            Upload and analyze SNCU patient monitoring sheets
          </p>
        </div>

        {/* Upload Card */}
        <div style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '28px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '20px',
            margin: '0 0 20px 0'
          }}>
            📤 Upload New Sheet
          </h2>

          {/* Patient ID Input */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              Patient ID / Registration Number
            </label>
            <input 
              type="text" 
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="Enter patient ID (e.g., 1022956)"
              style={{ 
                padding: '11px 14px', 
                width: '100%',
                maxWidth: '380px',
                fontSize: '14px',
                border: '1.5px solid #d1d5db',
                borderRadius: '6px',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              Monitoring Sheet Image
            </label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileSelect}
              style={{ 
                padding: '10px',
                fontSize: '13px',
                border: '1.5px dashed #d1d5db',
                borderRadius: '6px',
                width: '100%',
                maxWidth: '380px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            />
          </div>
          
          {/* Preview */}
          {preview && (
            <div style={{ 
              marginBottom: '18px',
              padding: '18px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                fontSize: '15px', 
                fontWeight: '600', 
                marginBottom: '12px',
                color: '#1e293b',
                margin: '0 0 12px 0'
              }}>
                Preview
              </h3>
              <img 
                src={preview} 
                alt="Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '380px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db'
                }} 
              />
            </div>
          )}
          
          {/* Extract Button */}
          <button 
            onClick={handleExtract}
            disabled={!selectedFile || loading || !patientId.trim()}
            style={{
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: '600',
              backgroundColor: (selectedFile && patientId.trim()) ? '#3b82f6' : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (selectedFile && patientId.trim()) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              boxShadow: (selectedFile && patientId.trim()) ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (selectedFile && patientId.trim()) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedFile && patientId.trim()) {
                e.target.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {loading ? '⏳ Extracting Data...' : '🔍 Extract Data'}
          </button>
        </div>

        {/* Results Section with TABS */}
        {extractedData && (
          <div>
            {/* Action Buttons - Edit/Save */}
            {!isSaved && (
              <div style={{ 
                marginBottom: '20px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                {!isEditMode ? (
                  <>
                    <button
                      onClick={handleEnableEdit}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#d97706'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#f59e0b'}
                    >
                      ✏️ Edit Data
                    </button>
                    <button
                      onClick={handleSaveData}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                    >
                      💾 Save to Database
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveData}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                    >
                      ✅ Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
                    >
                      ❌ Cancel
                    </button>
                    <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '600' }}>
                      🔓 Edit Mode Active
                    </span>
                  </>
                )}
              </div>
            )}

            {isSaved && (
              <div style={{ 
                marginBottom: '20px',
                padding: '12px 16px',
                backgroundColor: '#d1fae5',
                borderRadius: '6px',
                border: '2px solid #10b981',
                fontSize: '14px',
                color: '#065f46',
                fontWeight: '600'
              }}>
                ✅ Data saved to Firebase successfully!
              </div>
            )}

            {/* Tab Navigation */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '24px',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <button
                onClick={() => setActiveTab('data')}
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  backgroundColor: activeTab === 'data' ? '#3b82f6' : 'transparent',
                  color: activeTab === 'data' ? 'white' : '#64748b',
                  border: 'none',
                  borderBottom: activeTab === 'data' ? '3px solid #3b82f6' : '3px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderRadius: '6px 6px 0 0'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'data') {
                    e.target.style.color = '#1e293b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'data') {
                    e.target.style.color = '#64748b';
                  }
                }}
              >
                📊 Extracted Data {isEditMode && '(Editing)'}
              </button>
              <button
                onClick={() => setActiveTab('dashboards')}
                disabled={!isSaved}
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  backgroundColor: activeTab === 'dashboards' ? '#3b82f6' : 'transparent',
                  color: activeTab === 'dashboards' ? 'white' : isSaved ? '#64748b' : '#cbd5e1',
                  border: 'none',
                  borderBottom: activeTab === 'dashboards' ? '3px solid #3b82f6' : '3px solid transparent',
                  cursor: isSaved ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  borderRadius: '6px 6px 0 0'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'dashboards' && isSaved) {
                    e.target.style.color = '#1e293b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'dashboards' && isSaved) {
                    e.target.style.color = '#64748b';
                  }
                }}
              >
                📈 Clinical Dashboards {!isSaved && '(Save data first)'}
              </button>
            </div>

            {/* Tab Content: Extracted Data */}
            {activeTab === 'data' && (
              <div>
                {/* Patient Info Card */}
                <div style={{ 
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  padding: '28px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  marginBottom: '28px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h2 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#1e293b',
                    marginBottom: '20px',
                    margin: '0 0 20px 0'
                  }}>
                    👤 Patient Information {isEditMode && '(Editable)'}
                  </h2>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '14px'
                  }}>
                    {['reg_no', 'mother_name', 'date_of_admission', 'sex', 'weight', 'date'].map((field) => (
                      <div key={field} style={{ padding: '12px', backgroundColor: isEditMode ? '#fffbeb' : '#f9fafb', borderRadius: '6px', border: isEditMode ? '1px solid #fbbf24' : '1px solid #f3f4f6' }}>
                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {field.replace(/_/g, ' ')}
                        </div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={editableData.patient[field] || ''}
                            onChange={(e) => handlePatientInfoChange(field, e.target.value)}
                            style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: '#1e293b',
                              border: 'none',
                              backgroundColor: 'transparent',
                              width: '100%',
                              outline: 'none',
                              fontFamily: 'inherit'
                            }}
                          />
                        ) : (
                          <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                            {displayData.patient[field] || 'N/A'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Readings Table */}
                <div style={{ 
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  padding: '28px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <h2 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    color: '#1e293b',
                    marginBottom: '20px',
                    margin: '0 0 20px 0'
                  }}>
                    📊 Vital Signs Readings {isEditMode && '(Editable - click to edit)'}
                  </h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse', 
                      fontSize: '13px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Time</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Activity</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Temp</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Colour</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>HR</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>RR</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>CRT</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>BP</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>O2 Flow</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Oxygen</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Blood Glucose</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Stool</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Abd. Girth</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>RT Aspirate</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>Urine</th>
                          <th style={{ padding: '11px', border: '1px solid #e5e7eb', fontWeight: '600', color: '#374151' }}>IV Patency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayData.readings.map((reading, index) => (
                          <tr key={index} style={{ backgroundColor: isEditMode ? '#fffbeb' : (index % 2 === 0 ? 'white' : '#fafbfc') }}>
                            {['time', 'activity', 'temperature', 'colour', 'HR', 'RR', 'CRT', 'BP', 'O2_flow_rate', 'oxygen', 'blood_glucose', 'stool', 'abdominal_girth', 'rt_aspirate', 'urine', 'iv_patency'].map((field) => (
                              <td key={field} style={{ padding: '10px', border: '1px solid #e5e7eb', color: '#4b5563' }}>
                                {isEditMode ? (
                                  <input
                                    type="text"
                                    value={editableData.readings[index][field] || ''}
                                    onChange={(e) => handleReadingChange(index, field, e.target.value)}
                                    style={{
                                      width: '100%',
                                      border: 'none',
                                      backgroundColor: 'transparent',
                                      fontSize: '13px',
                                      color: '#4b5563',
                                      outline: 'none',
                                      fontFamily: 'inherit'
                                    }}
                                  />
                                ) : (
                                  reading[field] || '-'
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Clinical Dashboards */}
            {activeTab === 'dashboards' && isSaved && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Dashboard 1: Cardiorespiratory Monitor */}
                <div style={{ 
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  padding: '28px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <CardioRespiratoryDashboard readings={extractedData.readings} />
                </div>

                {/* Dashboard 2: Feeding & Gut Tracker */}
                <div style={{ 
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  padding: '28px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb'
                }}>
                  <FeedingGutDashboard readings={extractedData.readings} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
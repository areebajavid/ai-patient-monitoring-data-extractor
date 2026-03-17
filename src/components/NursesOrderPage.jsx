import React, { useState } from 'react';
import axios from 'axios';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';

function NursesOrderPage({ onNavigateBack }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [savedRecords, setSavedRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState('');
  const [activeTab, setActiveTab] = useState('data');
  
  // NEW: State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableData, setEditableData] = useState(null);
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    loadSavedRecords();
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setExtractedData(null);
      setSelectedRecord('');
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
      const response = await axios.post('http://localhost:5000/extract-nurses', formData);
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
      await setDoc(doc(db, 'nurses_orders', patientId), {
        patientId: patientId,
        treatments: editableData.treatments || [],
        totals: editableData.totals || {},
        uploadDate: new Date().toISOString(),
        timestamp: Date.now()
      });

      alert('Data saved successfully to Firebase!');
      setIsSaved(true);
      setIsEditMode(false);
      setExtractedData(editableData); // Update main data with edited version
      loadSavedRecords();
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

  // NEW: Handle treatment field edit
  const handleTreatmentChange = (index, field, value) => {
    setEditableData(prev => {
      const newTreatments = [...prev.treatments];
      newTreatments[index] = {
        ...newTreatments[index],
        [field]: value
      };
      return {
        ...prev,
        treatments: newTreatments
      };
    });
  };

  // NEW: Handle nested oral feeds edit
  const handleOralFeedsChange = (index, field, value) => {
    setEditableData(prev => {
      const newTreatments = [...prev.treatments];
      newTreatments[index] = {
        ...newTreatments[index],
        oral_feeds: {
          ...newTreatments[index].oral_feeds,
          [field]: value
        }
      };
      return {
        ...prev,
        treatments: newTreatments
      };
    });
  };

  const loadSavedRecords = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'nurses_orders'));
      const records = [];
      querySnapshot.forEach((doc) => {
        records.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setSavedRecords(records);
    } catch (error) {
      console.error('Error loading records:', error);
    }
  };

  const handleSelectRecord = async (recordId) => {
    if (!recordId) {
      setExtractedData(null);
      setSelectedRecord('');
      return;
    }
    
    const record = savedRecords.find(r => r.id === recordId);
    if (record) {
      setSelectedFile(null);
      setPreview(null);
      setPatientId('');
      
      const data = {
        treatments: record.treatments,
        totals: record.totals
      };
      
      setExtractedData(data);
      setEditableData(JSON.parse(JSON.stringify(data)));
      setSelectedRecord(recordId);
      setIsSaved(true);
      setIsEditMode(false);
      
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete nurses order record: ${selectedRecord}?`
    );
    
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, 'nurses_orders', selectedRecord));
        alert('Record deleted successfully!');
        
        setSelectedRecord('');
        setExtractedData(null);
        loadSavedRecords();
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Error deleting record');
      }
    }
  };

  const handleDeleteAllRecords = async () => {
    const confirmDelete = window.confirm(
      `⚠️ WARNING: This will permanently delete ALL ${savedRecords.length} nurses order records. This action cannot be undone.\n\nAre you absolutely sure?`
    );
    
    if (confirmDelete) {
      try {
        const deletePromises = savedRecords.map(record => 
          deleteDoc(doc(db, 'nurses_orders', record.id))
        );
        
        await Promise.all(deletePromises);
        
        alert(`Successfully deleted all ${savedRecords.length} records!`);
        
        setSelectedRecord('');
        setExtractedData(null);
        setSavedRecords([]);
        
      } catch (error) {
        console.error('Error deleting records:', error);
        alert('Error deleting records. Please try again.');
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
        {/* Back Button */}
        <button
          onClick={onNavigateBack}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#374151',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '24px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#374151'}
        >
          ← Back to Monitoring Sheet
        </button>

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
            💊 Nurses Orders
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', margin: 0 }}>
            Treatment & Medication Records
          </p>
        </div>

        {/* Records History */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '14px', 
            fontWeight: '600',
            marginBottom: '12px',
            color: '#e2e8f0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            📋 Saved Records
          </h3>
          
          {savedRecords.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
              No saved records yet
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {savedRecords.map((record) => (
                <div
                  key={record.id}
                  onClick={() => handleSelectRecord(record.id)}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: selectedRecord === record.id ? '#3b82f6' : '#2d3748',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: selectedRecord === record.id ? '2px solid #60a5fa' : '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRecord !== record.id) {
                      e.currentTarget.style.backgroundColor = '#374151';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRecord !== record.id) {
                      e.currentTarget.style.backgroundColor = '#2d3748';
                    }
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>
                    Patient ID: {record.id}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Buttons */}
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedRecord && (
            <button
              onClick={handleDeleteRecord}
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
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
            >
              🗑️ Delete Selected
            </button>
          )}
          
          {savedRecords.length > 0 && (
            <button
              onClick={handleDeleteAllRecords}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#991b1b'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              🗑️ Delete All Records
            </button>
          )}
        </div>
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
            Nurses Order Sheet Extractor
          </h1>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '6px', margin: '6px 0 0 0' }}>
            Upload and extract treatment & medication data
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
            📤 Upload Nurses Order Sheet
          </h2>

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

          <div style={{ marginBottom: '18px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: '#374151',
              fontSize: '14px'
            }}>
              Nurses Order Sheet Image
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
                {/* Total Input Summary Card */}
                {displayData.totals && displayData.totals.total_input_24hr_ml && (
                  <div style={{ 
                    backgroundColor: '#ecfdf5',
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    marginBottom: '28px',
                    border: '2px solid #10b981'
                  }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#065f46',
                      margin: '0 0 8px 0'
                    }}>
                      📊 Total Fluid Input (24 Hours)
                    </h3>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>
                      {displayData.totals.total_input_24hr_ml} ml
                    </div>
                  </div>
                )}

                {/* Treatment Records Table */}
<div style={{ 
  backgroundColor: '#ffffff',
  borderRadius: '10px',
  padding: '28px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb'
}}>

            {/* Tab Content: Clinical Dashboards - EMPTY */}
            {activeTab === 'dashboards' && isSaved && (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '400px',
                backgroundColor: '#f9fafb',
                borderRadius: '10px',
                border: '2px dashed #d1d5db'
              }}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
                  <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px 0' }}>
                    Clinical Dashboards
                  </h3>
                  <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>
                    Ready to add new graphs here
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default NursesOrderPage;
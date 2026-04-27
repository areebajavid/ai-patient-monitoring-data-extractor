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
      setExtractedData(editableData);
      loadSavedRecords();
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data to Firebase');
    }
  };

  const handleEnableEdit = () => {
    setIsEditMode(true);
    setEditableData(JSON.parse(JSON.stringify(extractedData)));
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditableData(JSON.parse(JSON.stringify(extractedData)));
  };

  const handleTreatmentChange = (index, field, value) => {
    setEditableData(prev => {
      const newTreatments = [...prev.treatments];
      newTreatments[index] = { ...newTreatments[index], [field]: value };
      return { ...prev, treatments: newTreatments };
    });
  };

  const loadSavedRecords = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'nurses_orders'));
      const records = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
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
      const data = { treatments: record.treatments, totals: record.totals };
      setExtractedData(data);
      setEditableData(JSON.parse(JSON.stringify(data)));
      setSelectedRecord(recordId);
      setIsSaved(true);
      setIsEditMode(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;
    if (window.confirm(`Delete record: ${selectedRecord}?`)) {
      try {
        await deleteDoc(doc(db, 'nurses_orders', selectedRecord));
        alert('Record deleted successfully!');
        setSelectedRecord('');
        setExtractedData(null);
        loadSavedRecords();
      } catch (error) { alert('Error deleting record'); }
    }
  };

  const handleDeleteAllRecords = async () => {
    if (window.confirm(`⚠️ WARNING: Delete ALL records?`)) {
      try {
        const deletePromises = savedRecords.map(record => deleteDoc(doc(db, 'nurses_orders', record.id)));
        await Promise.all(deletePromises);
        alert(`Successfully deleted all records!`);
        setSelectedRecord('');
        setExtractedData(null);
        setSavedRecords([]);
      } catch (error) { alert('Error deleting records'); }
    }
  };

  const displayData = isEditMode ? editableData : extractedData;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      
      {/* SIDEBAR */}
      <div style={{ width: '260px', backgroundColor: '#1a252f', color: 'white', padding: '24px 16px', position: 'fixed', height: '100vh', overflowY: 'auto' }}>
        <button onClick={onNavigateBack} style={{ width: '100%', padding: '10px', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '6px', marginBottom: '24px', cursor: 'pointer' }}>
          ← Back
        </button>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', color: '#60a5fa' }}>💊 Nurses Orders</h2>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: '#e2e8f0', marginBottom: '12px' }}>📋 Saved Records</h3>
          {savedRecords.map((record) => (
            <div key={record.id} onClick={() => handleSelectRecord(record.id)} style={{ padding: '10px', backgroundColor: selectedRecord === record.id ? '#3b82f6' : '#2d3748', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px' }}>
              Patient ID: {record.id}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {selectedRecord && <button onClick={handleDeleteRecord} style={{ padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px' }}>🗑️ Delete Selected</button>}
          {savedRecords.length > 0 && <button onClick={handleDeleteAllRecords} style={{ padding: '10px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px' }}>🗑️ Delete All</button>}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ marginLeft: '260px', flex: 1, padding: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Nurses Order Sheet Extractor</h1>

        {/* Upload Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '28px', border: '1px solid #e5e7eb' }}>
          <input type="text" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Patient ID" style={{ padding: '10px', width: '300px', marginBottom: '10px', display: 'block' }} />
          <input type="file" onChange={handleFileSelect} style={{ marginBottom: '10px', display: 'block' }} />
          {preview && <img src={preview} alt="Preview" style={{ maxHeight: '200px', display: 'block', marginBottom: '10px' }} />}
          <button onClick={handleExtract} disabled={loading} style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px' }}>
            {loading ? 'Extracting...' : '🔍 Extract Data'}
          </button>
        </div>

        {extractedData && (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              {!isSaved && (
                <>
                  {!isEditMode ? (
                    <button onClick={handleEnableEdit} style={{ padding: '10px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '6px', border: 'none' }}>✏️ Edit</button>
                  ) : (
                    <button onClick={handleCancelEdit} style={{ padding: '10px', backgroundColor: '#6b7280', color: 'white', borderRadius: '6px', border: 'none' }}>❌ Cancel</button>
                  )}
                  <button onClick={handleSaveData} style={{ padding: '10px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px', border: 'none' }}>💾 Save</button>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #eee', marginBottom: '20px' }}>
              <button onClick={() => setActiveTab('data')} style={{ padding: '10px', border: 'none', background: activeTab === 'data' ? '#eee' : 'none' }}>Data</button>
              <button onClick={() => setActiveTab('dashboards')} disabled={!isSaved} style={{ padding: '10px', border: 'none', background: activeTab === 'dashboards' ? '#eee' : 'none' }}>Dashboards</button>
            </div>

            {activeTab === 'data' && (
              <div style={{ backgroundColor: '#fff', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3>Treatments List</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Treatment</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Route</th>
                      <th style={{ border: '1px solid #ddd', padding: '8px' }}>Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.treatments?.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                          {isEditMode ? <input value={item.treatment_name} onChange={(e) => handleTreatmentChange(idx, 'treatment_name', e.target.value)} /> : item.treatment_name}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.route}</td>
                        <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.frequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'dashboards' && (
              <div style={{ padding: '40px', textAlign: 'center', background: '#f9fafb' }}>
                <h3>📈 Dashboard View</h3>
                <p>Visualization data for Patient: {selectedRecord || patientId}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default NursesOrderPage;
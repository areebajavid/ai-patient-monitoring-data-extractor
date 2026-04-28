# 🏥 SNCU Monitor — AI Patient Monitoring Data Extractor

An AI-powered web application that extracts and digitizes handwritten data from **Special Newborn Care Unit (SNCU)** monitoring sheets using computer vision.

---

## 🚀 Live Demo

🔗 **[ai-patient-monitoring-data-extracto.vercel.app](https://ai-patient-monitoring-data-extracto.vercel.app)**

---

## ✨ Features

- 📸 **Upload monitoring sheets** — supports image uploads of handwritten SNCU records
- 🤖 **AI-powered extraction** — uses Groq's LLaMA vision model to read and parse data
- 📊 **Structured output** — extracts patient info, vitals, and time-based readings into clean JSON
- 💊 **Nurses Order Sheet support** — extracts IV fluids, medications, feeds, and treatments
- 🗃️ **Patient Records** — save and manage extracted patient data
- ⚡ **Fast & Free** — powered by Groq's free tier API

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | Node.js + Express |
| AI Model | Groq API (LLaMA 4 Scout Vision) |
| Database | Firebase |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 📋 Data Extracted

### Monitoring Sheet
- Patient info (Reg No, Mother's name, weight, DOA)
- Vitals: HR, RR, Temperature, BP, CRT, SpO2
- Blood glucose, urine output, stool, abdominal girth
- O2 flow rate, FIO2, IV patency, RT aspirate

### Nurses Order Sheet
- Oral feeds (feeding tube, spoon/cup, breastfeed)
- Oral & IV drugs
- IV fluids & infusions (rate + volume)
- Blood products, IV bolus, other treatments
- 24hr total input

---

## 🏃 Run Locally

### Prerequisites
- Node.js v18+
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend
```bash
cd backend
npm install
```

Create `.env` file:
```
GROQ_API_KEY=your_groq_api_key_here
```

```bash
node server.js
```

### Frontend
```bash
npm install
npm start
```

App runs at `http://localhost:3000`

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key for vision model |

---

## 📁 Project Structure

```
sncu-monitor/
├── backend/
│   ├── server.js        # Express API with /extract & /extract-nurses routes
│   └── .env             # API keys (not committed)
├── src/
│   ├── App.js
│   ├── UploadPage.jsx   # Monitoring sheet upload & extraction
│   └── NursesPage.jsx   # Nurses order sheet upload & extraction
├── public/
└── package.json
```

---

## 🌐 Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | [vercel.app](https://ai-patient-monitoring-data-extracto.vercel.app) |
| Backend | Render | [onrender.com](https://ai-patient-monitoring-data-extractor.onrender.com) |

> ⚠️ Render free tier spins down after inactivity — first request may take ~30 seconds.

---

## 📄 License

MIT License © 2026 areebajavid

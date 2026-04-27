const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

app.post("/extract", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const imageData = fs.readFileSync(imagePath).toString("base64");
    const mimeType = req.file.mimetype;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageData}`,
                },
              },
              {
                type: "text",
                text: `You are a medical data extraction assistant specializing in neonatal care records.

This is an SNCU (Special Newborn Care Unit) monitoring sheet. Extract ALL visible data from the image.

CRITICAL: Return a valid JSON object with this EXACT structure. Include ALL fields even if empty (use null for missing values):

{
  "patient": {
    "reg_no": "extract SNCU Reg. No",
    "mother_name": "extract Baby of (Mother's name)",
    "date_of_admission": "extract Date of Admission",
    "sex": "extract Sex (M/F)",
    "weight": "extract Weight in kg",
    "date": "extract Date"
  },
  "readings": [
    {
      "time": "extract Time",
      "activity": "extract Activity (Dull/Active)",
      "temperature": "extract Temperature in °C",
      "colour": "extract Colour (Pink/Pale/Cyanotic)",
      "HR": "extract HR (Heart Rate)",
      "RR": "extract RR (Respiratory Rate)",
      "CRT": "extract CRT (Capillary Refill Time)",
      "BP": "extract B.P. (Blood Pressure)",
      "O2_flow_rate": "extract O2 Flow Rate",
      "FIO2": "extract FIO2",
      "oxygen": "extract Oxygen Saturation %",
      "blood_glucose": "extract Blood Glucose value",
      "urine": "extract Urine output",
      "stool": "extract Stool description",
      "abdominal_girth": "extract Abdominal Girth in cm",
      "rt_aspirate": "extract R.T. Aspirate",
      "iv_patency": "extract IV Patency (Yes/No)"
    }
  ]
}

RULES:
- Return ONLY the JSON object, no markdown formatting, no backticks, no extra text
- Extract data for EVERY time column that has values
- If a field is blank/empty, use null
- Preserve exact values as written (including units)
- Include ALL readings from left to right across the sheet`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    // Extract the JSON from Groq's response
    let groqText = response.data.choices[0].message.content;
    groqText = groqText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonData = JSON.parse(groqText);

    res.json({ success: true, data: jsonData });
  } catch (error) {
    console.error("Error:", error.response ? JSON.stringify(error.response.data) : error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/extract-nurses", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const imageData = fs.readFileSync(imagePath).toString("base64");
    const mimeType = req.file.mimetype;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageData}`,
                },
              },
              {
                type: "text",
                text: `You are a medical data extraction assistant specializing in neonatal care records.

This is a NURSES ORDER SHEET from an SNCU (Special Newborn Care Unit). Extract ALL visible treatment and medication data from the image.

CRITICAL: Return a valid JSON object with this EXACT structure:

{
  "treatments": [
    {
      "time": "time slot",
      "oral_feeds": {
        "feeding_tube_ml": "value or null",
        "spoon_cup_ml": "value or null",
        "breast_feed": "value or null"
      },
      "oral_drugs": ["drug1", "drug2"],
      "iv_drugs": ["drug1 with volume", "drug2 with volume"],
      "iv_fluids": [
        {"fluid": "fluid name", "rate_ml_hr": "rate", "volume_ml": "volume"}
      ],
      "iv_infusions": [
        {"infusion": "infusion name", "rate_ml_hr": "rate", "volume_ml": "volume"}
      ],
      "iv_bolus_ml": "value or null",
      "blood_products": "type and volume or null",
      "other_treatment": "any other treatment or null"
    }
  ],
  "totals": {
    "total_input_24hr_ml": "total value or null"
  }
}

RULES:
- Extract data for EVERY time column that has values
- If a field is blank/empty, use null
- For arrays (oral_drugs, iv_drugs), extract all listed items
- For IV fluids/infusions, capture rate (ml/hr) and volume (ml) from each time slot
- Include the total input calculation if visible
- Return ONLY the JSON object, no markdown formatting, no backticks, no extra text`,
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    // Extract the JSON from Groq's response
    let groqText = response.data.choices[0].message.content;
    groqText = groqText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const jsonData = JSON.parse(groqText);

    res.json({ success: true, data: jsonData });
  } catch (error) {
    console.error("Error:", error.response ? JSON.stringify(error.response.data) : error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(5000, () => {
  console.log("Backend server running on port 5000");
});
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cloudinary = require('cloudinary').v2;
const Analysis = require('../model/Analysis');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzePlantImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'කරුණාකර පින්තූරයක් ඇතුළත් කරන්න.' });
        }

        const uploadRes = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ folder: 'agri_assistant' }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }).end(req.file.buffer);
        });

        const imageUrl = uploadRes.secure_url;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Analyze this plant leaf image. Identify the disease. 
        Provide the analysis in BOTH English and Sinhala.
        Return the result exactly as a valid JSON object. Do NOT wrap it in markdown code blocks.
        Structure:
        {
            "english": "Disease Name: [Name]\\nSymptoms: [Symptoms]\\nCause: [Cause]\\nTreatments: [Treatments]",
            "sinhala": "රෝගය හඳුනාගැනීම: [Name]\\nරෝගයේ ලක්ෂණ: [Symptoms]\\nරෝගයට හේතුව: [Cause]\\nප්‍රතිකාර: [Treatments]",
            "confidence": 85
        }`;

        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString("base64"),
                mimeType: req.file.mimetype
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        let rawText = response.text().replace(/```json/gi, "").replace(/```/g, "").trim();

        let parsed = {};
        try {
            parsed = JSON.parse(rawText);
        } catch (e) {
            parsed = { sinhala: rawText, english: rawText, confidence: 90 };
        }

        const finalConfidence = parsed.confidence || 90;

        const newRecord = new Analysis({
            userId: req.body.userId || "guest",
            imageUrl: imageUrl,
            result: parsed.sinhala,    
            resultEn: parsed.english,  
            confidence: finalConfidence,
            status: 'disease' // Default status
        });

        await newRecord.save();

        res.json({
            analysis: parsed.sinhala,
            analysisEn: parsed.english,
            confidence: finalConfidence,
            imageUrl: imageUrl
        });

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: 'Analysis failed' });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { userId } = req.query;
        const history = await Analysis.find({ userId }).sort({ createdAt: -1 });

        // Remap old records: if resultEn is missing, the `result` field contains English text
        // (saved before the bilingual system). Treat it as English and clear the Sinhala field.
        const remapped = history.map(item => {
            const obj = item.toObject();
            if (!obj.resultEn && obj.result) {
                // Old record — result is English text
                obj.resultEn = obj.result;
                obj.result = null;
            }
            return obj;
        });

        res.json(remapped);
    } catch (error) {
        res.status(500).json({ error: 'History failed' });
    }
};

exports.deleteAnalysis = async (req, res) => {
    try {
        const { id } = req.params;

        // 👈 වෙනස 1: Body එකෙන් හෝ Query එකෙන් කොහෙන් ආවත් userId එක ලබාගන්න
        const userId = req.body.userId || req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const record = await Analysis.findOneAndDelete({ _id: id, userId: userId });

        if (!record) {
            return res.status(404).json({ error: 'Record not found or not authorized.' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: 'Delete failed' });
    }
};
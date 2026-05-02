const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    result: { type: String },       // Sinhala analysis (may be null for old records)
    resultEn: { type: String },     // English analysis
    confidence: { type: Number, required: false, default: 90 },
    status: { type: String, default: 'disease' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Analysis', analysisSchema);
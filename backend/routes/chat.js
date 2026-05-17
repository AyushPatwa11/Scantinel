const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing. Please configure it in the .env file.' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const requestBody = {
      systemInstruction: {
        parts: [
          { text: "You are Scantinel AI, a helpful cybersecurity assistant for the Scantinel platform. You help users understand their security scans, explain vulnerabilities, and suggest remediation steps. Keep your answers concise, professional, and visually appealing using markdown where appropriate." }
        ]
      },
      contents: messages
    };

    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const aiMessage = response.data.candidates[0].content.parts[0].text;
    res.json({ text: aiMessage });
  } catch (error) {
    console.error('Chat error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate response.' });
  }
});

module.exports = router;

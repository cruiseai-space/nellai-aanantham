const express = require('express');
const { logRouteError } = require('../utils/log');
const router = express.Router();
const aiService = require('../services/ai');

/**
 * POST /api/ai/parse-voice
 * Parse voice transcript to extract structured inventory data
 */
router.post('/parse-voice', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Transcript is required and must be a string'
      });
    }

    if (transcript.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Transcript cannot be empty'
      });
    }

    const result = await aiService.parseVoiceInput(transcript);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logRouteError("ai Voice parsing error:", error);
    res.status(500).json({
      error: 'AI Processing Error',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/parse-receipt
 * Parse receipt/bill image to extract items
 */
router.post('/parse-receipt', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Image is required and must be a base64 string'
      });
    }

    const result = await aiService.parseImageReceipt(image);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logRouteError("ai Receipt parsing error:", error);
    res.status(500).json({
      error: 'AI Processing Error',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/parse-csv
 * Parse CSV data and understand column mappings
 */
router.post('/parse-csv', async (req, res) => {
  try {
    const { csv, type = 'ingredients' } = req.body;

    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'CSV data is required and must be a string'
      });
    }

    const validTypes = ['ingredients', 'batches', 'products'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    const result = await aiService.parseCSVData(csv, type);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logRouteError("ai CSV parsing error:", error);
    res.status(500).json({
      error: 'AI Processing Error',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/suggest-recipe
 * Suggest recipe ingredients and estimate cost
 */
router.post('/suggest-recipe', async (req, res) => {
  try {
    const { name, ingredients } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Recipe name is required'
      });
    }

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Ingredients list must be an array'
      });
    }

    const result = await aiService.suggestRecipeCost(name, ingredients);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logRouteError("ai Recipe suggestion error:", error);
    res.status(500).json({
      error: 'AI Processing Error',
      message: error.message
    });
  }
});

module.exports = router;

const groq = require('../config/groq');

/**
 * Parse voice transcript to extract structured inventory data
 * @param {string} transcript - Voice transcript text
 * @returns {Object} - { intent, data }
 */
async function parseVoiceInput(transcript) {
  const systemPrompt = `You are an inventory management assistant for a sweet shop called "Nellai Aanantham".
Parse the user's voice input and extract structured data.

Possible intents:
- add_ingredient: Adding a new ingredient to the system
- add_batch: Adding a batch/stock of an existing ingredient
- create_order: Creating a customer order

For add_ingredient, extract:
- name: ingredient name
- unit: measurement unit (kg, g, liters, pieces, etc.)
- category: ingredient category (dairy, dry_goods, spices, etc.)

For add_batch, extract:
- ingredient: ingredient name
- quantity: numeric quantity
- unit: measurement unit
- unit_cost: cost per unit in rupees

For create_order, extract:
- customer_name: customer name (if mentioned)
- items: array of { product, quantity }

Respond ONLY with valid JSON in this format:
{
  "intent": "add_ingredient" | "add_batch" | "create_order",
  "data": { ... extracted fields ... },
  "confidence": 0.0-1.0
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript }
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('Error parsing voice input:', error);
    throw new Error('Failed to parse voice input: ' + error.message);
  }
}

/**
 * Parse receipt/bill image to extract items
 * @param {string} base64Image - Base64 encoded image
 * @returns {Array} - Array of extracted items
 */
async function parseImageReceipt(base64Image) {
  const systemPrompt = `You are an OCR and data extraction assistant for an inventory management system.
Analyze the receipt/bill image and extract all items with their quantities and prices.

Respond ONLY with valid JSON in this format:
{
  "items": [
    {
      "name": "item name",
      "quantity": numeric_quantity,
      "unit": "kg/g/pieces/liters/etc",
      "unit_price": numeric_price,
      "total_price": numeric_total
    }
  ],
  "vendor": "vendor name if visible",
  "date": "date if visible (YYYY-MM-DD format)",
  "total_amount": numeric_total,
  "confidence": 0.0-1.0
}`;

  try {
    // Use vision model for image parsing
    const completion = await groq.chat.completions.create({
      model: 'llama-3.2-90b-vision-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all items, quantities, and prices from this receipt image.'
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image.startsWith('data:') 
                  ? base64Image 
                  : `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    
    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { items: [], error: 'Could not parse receipt', raw: response };
  } catch (error) {
    console.error('Error parsing receipt image:', error);
    throw new Error('Failed to parse receipt image: ' + error.message);
  }
}

/**
 * Parse CSV data and understand column mappings
 * @param {string} csvText - CSV text content
 * @param {string} type - Type of data: 'ingredients', 'batches', 'products'
 * @returns {Array} - Structured array of records
 */
async function parseCSVData(csvText, type = 'ingredients') {
  const typeSchemas = {
    ingredients: `{
      "name": "ingredient name (required)",
      "unit": "measurement unit (required)",
      "category": "category name",
      "minimum_stock": "numeric minimum stock level"
    }`,
    batches: `{
      "ingredient_name": "ingredient name (required)",
      "quantity": "numeric quantity (required)",
      "unit_cost": "cost per unit (required)",
      "supplier": "supplier name",
      "expiry_date": "expiry date (YYYY-MM-DD)"
    }`,
    products: `{
      "name": "product name (required)",
      "selling_price": "price per unit (required)",
      "category": "product category",
      "description": "product description"
    }`
  };

  const systemPrompt = `You are a CSV parsing assistant for an inventory management system.
Parse the CSV data and map columns to the required schema.

Target schema for ${type}:
${typeSchemas[type] || typeSchemas.ingredients}

Handle various column names and formats. Map columns intelligently based on their content.
Clean and normalize the data (trim whitespace, convert numbers, standardize dates).

Respond ONLY with valid JSON in this format:
{
  "records": [ ... array of parsed records ... ],
  "column_mappings": { "original_column": "mapped_field" },
  "errors": [ ... any rows that couldn't be parsed ... ],
  "total_parsed": number,
  "total_errors": number
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this CSV data as ${type}:\n\n${csvText}` }
      ],
      temperature: 0.1,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('Error parsing CSV data:', error);
    throw new Error('Failed to parse CSV data: ' + error.message);
  }
}

/**
 * Suggest recipe ingredients and estimate cost
 * @param {string} recipeName - Name of the recipe
 * @param {Array} ingredientsList - Available ingredients with current prices
 * @returns {Object} - Suggested ingredients and estimated cost
 */
async function suggestRecipeCost(recipeName, ingredientsList) {
  const systemPrompt = `You are a traditional Indian sweets expert, specifically for South Indian sweets from Nellai (Tirunelveli) region.
Given a recipe name and available ingredients with their current prices, suggest the required ingredients and quantities.

Available ingredients with prices:
${JSON.stringify(ingredientsList, null, 2)}

Provide realistic quantities for making a standard batch (typically for 1 kg of the final product).
Calculate the estimated cost based on the provided ingredient prices.

Respond ONLY with valid JSON in this format:
{
  "recipe_name": "name",
  "description": "brief description of the sweet",
  "suggested_ingredients": [
    {
      "ingredient_name": "name",
      "quantity": numeric_amount,
      "unit": "unit",
      "estimated_cost": numeric_cost,
      "available": true/false
    }
  ],
  "total_estimated_cost": numeric_total,
  "yield": "expected yield (e.g., '1 kg' or '50 pieces')",
  "notes": "any preparation notes",
  "confidence": 0.0-1.0
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Suggest ingredients and estimate cost for: ${recipeName}` }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('Error suggesting recipe:', error);
    throw new Error('Failed to suggest recipe: ' + error.message);
  }
}

module.exports = {
  parseVoiceInput,
  parseImageReceipt,
  parseCSVData,
  suggestRecipeCost
};

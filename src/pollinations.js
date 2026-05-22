const axios = require('axios');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const apiKey = process.env.POLLINATIONS_API_KEY;
const apiName = process.env.POLLINATIONS_NAME || 'above-reptile';

const imagesDir = path.join(__dirname, '..', 'data', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

/**
 * Generates an image using Pollinations.ai with the user's API Key and persists it.
 */
async function generateImage(userId, prompt, model = 'flux', width = 1024, height = 1024) {
  if (!userId) throw new Error('User ID is required');
  if (!prompt) throw new Error('Prompt is required');

  // 1. Insert initial row to get unique ID
  const insert = db.prepare(`
    INSERT INTO generated_images (user_id, prompt, model, image_path)
    VALUES (?, ?, ?, 'pending')
  `).run(userId, prompt, model);
  
  const id = insert.lastInsertRowid;
  const fileName = `generated-${id}.jpg`;
  const localPath = path.join(imagesDir, fileName);
  const publicPath = `/images/${fileName}`;

  try {
    // 2. Build URL
    // Encode prompt and set optional parameters
    const encodedPrompt = encodeURIComponent(prompt);
    let url = `https://image.pollinations.ai/p/${encodedPrompt}?model=${model}&width=${width}&height=${height}&nologo=true&private=true&enhance=false`;
    
    // Pass API key if configured
    if (apiKey) {
      url += `&key=${apiKey}`;
    }

    console.log(`🖼️ [Pollinations] Generating: "${prompt}" using model "${model}"...`);
    
    // 3. Fetch image data as binary buffer
    const headers = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers,
      timeout: 30000 // 30s timeout
    });

    // 4. Save to filesystem
    fs.writeFileSync(localPath, response.data);
    
    // 5. Update database path
    db.prepare(`
      UPDATE generated_images 
      SET image_path = ? 
      WHERE id = ?
    `).run(publicPath, id);

    console.log(`✔ [Pollinations] Saved successfully: ${publicPath}`);
    return { id, prompt, model, imageUrl: publicPath };

  } catch (error) {
    console.error(`❌ [Pollinations] Image generation failed for ID ${id}:`, error.message);
    
    // Clean up database row on failure
    db.prepare('DELETE FROM generated_images WHERE id = ?').run(id);
    
    // Throw descriptive error
    throw new Error(error.response?.data?.message || error.message || 'Image generation failed');
  }
}

module.exports = {
  generateImage
};

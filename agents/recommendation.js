// agents/recommendation.js
const { getProductsByCategory, getRandomProducts } = require('../data/products');
const fs = require('fs');
const path = require('path');

// Map user-friendly category names to our internal category keys
const categoryMap = {
  'mens casual': 'mens_casual',
  'mens formal': 'mens_formal',
  'womens ethnic': 'womens_ethnic',
  'womens western': 'womens_western',
  'accessories': 'accessories'
};

// Normalize budget to a reasonable range
function normalizeBudget(budget) {
  if (!budget) return 0;
  
  // If it's a string with commas, remove them (e.g., '1,00,000' -> '100000')
  const numericBudget = typeof budget === 'string' 
    ? parseInt(budget.replace(/[^0-9]/g, '')) 
    : Number(budget);
  
  if (isNaN(numericBudget)) return 0;
  
  // If budget is too high (e.g., more than 50,000), normalize it to a reasonable range
  if (numericBudget > 50000) {
    // Map to a range between 5,000 and 20,000
    return Math.min(20000, Math.max(5000, numericBudget / 10));
  }
  
  return numericBudget;
}

async function recommend(client, message, userContext = {}) {
  try {
    const categoryText = userContext.category || '';
    const normalizedBudget = normalizeBudget(userContext.budget);
    const count = userContext.count || 3; // Default to 3 products, can be overridden for 'show more'
    
    // If no specific category is provided, return random products
    if (!categoryText || categoryText.trim() === '') {
      const randomProducts = getRandomProducts(count);
      await sendProductRecommendations(client, message, randomProducts, normalizedBudget, userContext);
      return randomProducts;
    }

    // Normalize the input and find matching category
    const input = categoryText.toLowerCase().trim();
    const categoryKey = Object.entries(categoryMap).find(([key]) => 
      key.includes(input) || input.includes(key.split(' ')[0])
    )?.[1];

    // Get products by category or fallback to random products
    const products = categoryKey 
      ? getProductsByCategory(categoryKey)
      : getRandomProducts(count);

    // If we have products, send them, otherwise send random products
    if (products && products.length > 0) {
      const recommendedProducts = products.slice(0, count).map(pick => ({
        id: pick.id,
        name: pick.name,
        price: pick.price,
        category: pick.categoryName,
        reason: pick.description,
        image: pick.image,
        rating: pick.rating,
        inStock: pick.inStock,
        details: pick.details
      }));
      
      await sendProductRecommendations(client, message, recommendedProducts, normalizedBudget, userContext);
      return recommendedProducts;
    }
    
    // Fallback to random products if no category match
    const fallbackProducts = getRandomProducts(count);
    await sendProductRecommendations(client, message, fallbackProducts, normalizedBudget, userContext);
    return fallbackProducts;
    
  } catch (error) {
    console.error('Error in recommendation engine:', error);
    const fallbackProducts = getRandomProducts(3);
    await sendProductRecommendations(client, message, fallbackProducts);
    return fallbackProducts;
  }
}

// Function to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

async function sendProductRecommendations(client, message, products, budget = 0, userContext = {}) {
  try {
    // Prepare header message with budget context if available
    let headerMessage = 'Here are some recommendations for you: 🛍️\n\n';
    
    if (budget > 0) {
      headerMessage += `Based on your budget of ₹${budget.toLocaleString('en-IN')}:\n\n`;
    }
    
    headerMessage += 'Reply with the item number to know more, type SHOW MORE for additional options, or type MENU to start over.';
    
    await client.sendText(message.from, headerMessage);
    
    // Get the absolute path to the project root
    const projectRoot = path.join(__dirname, '..');
    
    // Then send each product with image and details
    for (let i = 0; i < products.length; i++) {
      const item = products[i];
      const caption = `*${i + 1}. ${item.name}*\n` +
                     `Price: ₹${item.price}${item.originalPrice ? ` (${Math.round((1 - item.price/item.originalPrice)*100)}% OFF)` : ''}\n` +
                     `Rating: ${item.rating} ⭐ (${item.reviews || 'No'} reviews)\n` +
                     `In Stock: ${item.inStock ? '✅' : '❌'}\n\n` +
                     `_${item.reason || 'A great choice for you!'}_`;
      
      try {
        // Check if image exists
        const imagePath = path.join(projectRoot, item.image);
        
        if (fileExists(imagePath)) {
          // Send image using base64
          const imageBase64 = fs.readFileSync(imagePath, { encoding: 'base64' });
          await client.sendImage(
            message.from,
            `data:image/jpeg;base64,${imageBase64}`,
            'product.jpg',
            caption
          );
        } else {
          throw new Error(`Image not found at: ${imagePath}`);
        }
      } catch (imageError) {
        console.error('Error sending image, falling back to text:', imageError.message);
        // If image fails, send just the text
        await client.sendText(
          message.from,
          `📷 *${item.name}*\n${caption}`
        );
      }
      
      // Small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error sending product recommendations:', error);
    // Fallback to text if image sending fails
    await client.sendText(
      message.from,
      'Here are your recommendations:\n\n' +
      products.map((item, i) => 
        `${i + 1}. ${item.name} - ₹${item.price}`
      ).join('\n')
    );
  }
}

module.exports = { recommend };

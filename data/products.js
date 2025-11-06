



// Product catalog for ABFRL Challenge V MVP
// All products use the same image path which can be updated later
const imagePath = '/images/products/image.png';

const categories = {
  "mens_casual": "Men's Casual",
  "mens_formal": "Men's Formal",
  "womens_ethnic": "Women's Ethnic",
  "womens_western": "Women's Western",
  "accessories": "Accessories"
};

const brands = [
  "Allen Solly", "Van Heusen", "Louis Philippe", "Peter England", 
  "Raymond", "Pantaloons", "Wrogn", "H&M", "Zara", "Levi's"
];

// Generate random products
const generateProducts = () => {
  const products = [];
  let id = 1000;
  
  Object.entries(categories).forEach(([categoryKey, categoryName]) => {
    const categoryProducts = [];
    const productCount = 5 + Math.floor(Math.random() * 5); // 5-10 products per category
    
    for (let i = 0; i < productCount; i++) {
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const price = 499 + Math.floor(Math.random() * 20) * 250; // Prices from 499 to 5499 in steps of 250
      const rating = (3.5 + Math.random() * 1.5).toFixed(1); // Rating between 3.5 and 5.0
      
      categoryProducts.push({
        id: `${categoryKey.toUpperCase().substring(0,1)}-${id++}`,
        name: `${brand} ${categoryName.split(' ').pop()} ${i + 1}`,
        brand,
        price,
        originalPrice: Math.round(price * (1.2 + Math.random() * 0.3)), // 20-50% markup
        category: categoryKey,
        categoryName,
        image: imagePath,
        rating: parseFloat(rating),
        reviews: Math.floor(Math.random() * 500),
        inStock: Math.random() > 0.1, // 90% chance of being in stock
        isNew: Math.random() > 0.7, // 30% chance of being new
        description: `Premium quality ${categoryName.toLowerCase()} product from ${brand}.`,
        details: {
          material: ["Cotton", "Linen", "Polyester", "Silk", "Wool"][Math.floor(Math.random() * 5)],
          color: ["Black", "Blue", "White", "Grey", "Beige", "Navy"][Math.floor(Math.random() * 6)],
          size: ["S", "M", "L", "XL", "XXL"][Math.floor(Math.random() * 5)],
          fit: ["Slim", "Regular", "Relaxed"][Math.floor(Math.random() * 3)]
        }
      });
    }
    
    products.push(...categoryProducts);
  });
  
  return products;
};

// Generate and export products
const products = generateProducts();

// Helper function to get products by category
const getProductsByCategory = (category) => {
  if (!category) return [];
  const categoryKey = category.toLowerCase().replace(/\s+/g, '_');
  return products.filter(p => p.category === categoryKey);
};

// Helper function to get a random product
const getRandomProduct = () => {
  return products[Math.floor(Math.random() * products.length)];
};

// Helper function to get multiple random products
const getRandomProducts = (count = 3) => {
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

module.exports = {
  products,
  categories: Object.values(categories),
  getProductsByCategory,
  getRandomProduct,
  getRandomProducts
};
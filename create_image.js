const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a canvas
const width = 400;
const height = 400;
const canvas = createCanvas(width, height);
const context = canvas.getContext('2d');

// Fill background
context.fillStyle = '#f0f0f0';
context.fillRect(0, 0, width, height);

// Add text
context.fillStyle = '#333';
context.font = '30px Arial';
context.textAlign = 'center';
context.fillText('Product Image', width / 2, height / 2);
context.font = '20px Arial';
context.fillText('Placeholder', width / 2, height / 2 + 40);

// Save to file
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('images/products/image.png', buffer);

console.log('Created placeholder image at: images/products/image.png');

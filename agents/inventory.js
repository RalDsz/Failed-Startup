// agents/inventory.js
async function checkInventory(sku, size) {
  // Dummy stock model — always returns stock available in 2 stores + online
  return {
    sku,
    size: size || "M",
    available: true,
    locations: [
      { store: "Mumbai - Phoenix Mall", qty: 5 },
      { store: "Navi Mumbai - InOrbit", qty: 2 },
      { store: "Online Warehouse", qty: 20 }
    ]
  };
}

module.exports = { checkInventory };

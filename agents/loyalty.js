// agents/loyalty.js
async function getLoyalty(userId) {
  // Dummy: every user has 420 points
  return { points: 420, tier: "Silver" };
}

async function bestOffer(context) {
  // Dummy: fixed festival offer
  return { code: "FEST20", description: "Flat 20% off (festive week)", discountPercent: 20 };
}

module.exports = { getLoyalty, bestOffer };

module.exports = {
  welcome: `👋 Hi — welcome to ABFRL assistant!\nI can help you discover outfits, check offers, find sizes and complete purchase here.\n\nWhat are you shopping for today?\n• Mens Casual\n• Mens Formal\n• Womens Ethnic\n• Womens Western\n• Accessories`,
  askOccasion: `Great! What's the occasion?\n• Work\n• Party\n• Daily Wear\n• Festive / Wedding`,
  askBudget: `Nice — approximate budget?\n• Under ₹1499\n• ₹1500 - ₹2999\n• ₹3000+`,
  recommendHeader: `Based on that, here are 3 picks 👇\n(Reply 1 / 2 / 3 to pick one, or type "refine" to change filters)`,
  checkingInventory: `Checking stock… ✅`,
  askFulfillment: `How would you like to receive it?\n• Ship to home\n• Click & Collect\n• Try in store reservation`,
  applyOffers: (points, offer) => `You have ${points} loyalty points (worth ₹${points/5}).\nCurrent offer: ${offer}\nApply best pricing? (yes/no)`,
  paymentMethods: `Choose payment method:\n• Saved card\n• UPI\n• COD (store pickup only)`,
  orderConfirmed: (orderId, pickup) => `✅ Order ${orderId} confirmed!\n${pickup}\nYou'll get a reminder 1 hour before pickup.`,
  askRate: `How was your purchase experience? Rate 1-5 ⭐`,
  fallback: `Sorry, I didn't understand that. You can type "menu" to go back to the start.`,
};

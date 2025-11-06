// agents/fulfillment.js
async function fulfill({ method, userId, sku, location }) {
  // method: "ship", "click_collect", "try_store"
  const orderId = `ORD-${Date.now()}`;
  if(method === "click_collect" || method === "try_store") {
    return {
      orderId,
      type: "pickup",
      pickupLocation: location || "Mumbai - Phoenix Mall",
      pickupSlot: "Today 4:00 PM - 5:00 PM"
    };
  }
  // ship to home
  return {
    orderId,
    type: "shipment",
    courier: "MockExpress",
    estDelivery: "3-5 business days"
  };
}

module.exports = { fulfill };

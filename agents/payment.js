// agents/payment.js
async function processPayment({ method, amount, attempt = 1 }) {
  // Simulate success for MVP. Add small failure chance if needed
  const simulateFailure = false; // set true for testing retry logic
  if(simulateFailure && Math.random() < 0.2) {
    return { success: false, reason: "Declined by bank" };
  }
  // Return mock transaction id
  const txnId = `TXN-${Date.now()}`;
  return { success: true, txnId, amount, method };
}

module.exports = { processPayment };

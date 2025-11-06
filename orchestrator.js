// orchestrator.js
const { recommend } = require('./agents/recommendation');
const { checkInventory } = require('./agents/inventory');
const { getLoyalty, bestOffer } = require('./agents/loyalty');
const { processPayment } = require('./agents/payment');
const { fulfill } = require('./agents/fulfillment');
const db = require('./db');
const T = require('./templates');

function shortNumber(from) {
  // e.g. 919999888777@c.us -> 9999888777
  return from.replace(/\D/g, '').slice(-10);
}

async function handleMessage(client, message) {
  const user = message.from;
  const bodyRaw = (message.body || "").trim();
  const body = bodyRaw.toLowerCase();

  let state = await db.getUser(user);
  if(!state) {
    state = { stage: "WELCOME", context: {} };
    await db.setUser(user, state);
  }

  async function save() {
    await db.setUser(user, state);
  }

  // universal commands
  if(body === 'menu' || body === 'start') {
    state = { stage: "WELCOME", context: {} };
    await save();
  }

  switch(state.stage) {

    case "WELCOME":
      await client.sendText(user, T.welcome);
      state.stage = "OCCASION";
      await save();
      return;

    case "OCCASION":
      // capture category
      state.context.category = bodyRaw;
      await client.sendText(user, T.askOccasion);
      state.stage = "BUDGET";
      await save();
      return;

    case "BUDGET":
      state.context.occasion = bodyRaw;
      await client.sendText(user, T.askBudget);
      state.stage = "RECOMMEND";
      await save();
      return;

    case "RECOMMEND":
      try {
        state.context.budget = bodyRaw;
        // call recommendation agent with client and message objects
        const picks = await recommend(client, message, {
          category: state.context.category || "accessories",
          budget: bodyRaw,
          occasion: state.context.occasion
        });
        
        // Store picks in context for later reference
        state.context.picks = picks;
        state.stage = "AWAIT_PICK";
        await save();
      } catch (error) {
        console.error('Error in RECOMMEND stage:', error);
        await client.sendText(user, 'Sorry, I encountered an error while getting recommendations. Please try again.');
        state.stage = "WELCOME";
        await save();
      }
      return;

    case "AWAIT_PICK":
      if(body === "refine") {
        state.stage = "OCCASION";
        await save();
        await client.sendText(user, 'Sure - let\'s refine. Which category?');
        return;
      }
      
      // Handle 'show more' command
      if (body === 'show more' || body === 'more' || body === 'show more options') {
        try {
          // Get more products (10 instead of the default 3)
          const picks = await recommend(client, message, {
            ...state.context,
            count: 10 // Request 10 products instead of the default 3
          });
          
          // Update picks in context
          state.context.picks = picks;
          state.stage = "AWAIT_PICK";
          await save();
        } catch (error) {
          console.error('Error showing more products:', error);
          await client.sendText(user, 'Sorry, I encountered an error while loading more products.');
        }
        return;
      }
      // expect 1/2/3
      if(["1","2","3"].includes(body)) {
        const idx = parseInt(body) - 1;
        const pick = state.context.picks && state.context.picks[idx];
        if(!pick) {
          await client.sendText(user, "Sorry I couldn't find that item. Type menu to restart.");
          return;
        }
        state.context.selected = pick;
        await client.sendText(user, T.checkingInventory);
        // call inventory
        const stock = await checkInventory(pick.id, "M"); // default size M; later ask for size
        const locationsText = stock.locations.map(l => `• ${l.store} (${l.qty} in stock)`).join('\n');
        await client.sendText(user, `Good news — ${pick.name} (size M) is available:\n${locationsText}`);
        await client.sendText(user, T.askFulfillment);
        state.stage = "AWAIT_FULFILL_CHOICE";
        state.context.stock = stock;
        await save();
        return;
      } else {
        await client.sendText(user, T.fallback);
        return;
      }

    case "AWAIT_FULFILL_CHOICE":
      {
        const choice = body;
        if(choice.includes("ship")) {
          state.context.fulfillMethod = "ship";
          await client.sendText(user, 'Got it — shipping to your address. Checking loyalty & offers...');
        } else if(choice.includes("click") || choice.includes("collect")) {
          state.context.fulfillMethod = "click_collect";
          await client.sendText(user, 'Click & Collect selected. Checking loyalty & offers...');
        } else if(choice.includes("try") || choice.includes("store")) {
          state.context.fulfillMethod = "try_store";
          await client.sendText(user, 'Try in store reservation selected. Checking loyalty & offers...');
        } else {
          await client.sendText(user, T.fallback);
          return;
        }

        // call loyalty & offers
        const loy = await getLoyalty(user);
        const offer = await bestOffer(state.context);
        await client.sendText(user, T.applyOffers(loy.points, `${offer.code} - ${offer.description}`));
        state.context.loyalty = loy;
        state.context.offer = offer;
        state.stage = "AWAIT_APPLY_OFFER";
        await save();
        return;
      }

    case "AWAIT_APPLY_OFFER":
      if(body === 'yes' || body === 'y') {
        state.context.appliedOffer = state.context.offer;
        await client.sendText(user, `Applied ${state.context.offer.code}. Calculating final total...`);
      } else {
        state.context.appliedOffer = null;
        await client.sendText(user, 'Okay — no offer applied. Calculating final total...');
      }
      // calculate final price (dummy)
      const price = state.context.selected.price;
      const discount = state.context.appliedOffer ? Math.round(price * (state.context.appliedOffer.discountPercent/100)) : 0;
      const final = price - discount - Math.round((state.context.loyalty.points||0)/5); // simple points usage conversion
      state.context.checkout = { price, discount, loyaltyUsed: Math.round((state.context.loyalty.points||0)/5), final };
      await client.sendText(user, `Final total after offers: ₹${state.context.checkout.final}\n\n${T.paymentMethods}`);
      state.stage = "AWAIT_PAYMENT";
      await save();
      return;

    case "AWAIT_PAYMENT":
      // Accept any method text; then call payment agent
      const method = bodyRaw;
      await client.sendText(user, `Processing payment via ${method}...`);
      const paymentRes = await processPayment({ method, amount: state.context.checkout.final });
      if(!paymentRes.success) {
        await client.sendText(user, `Payment failed: ${paymentRes.reason}. Try another method.`);
        return;
      }
      state.context.payment = paymentRes;
      // fulfillment
      const fulfillmentRes = await fulfill({ method: state.context.fulfillMethod, userId: user, sku: state.context.selected.id, location: state.context.stock.locations[0].store });
      // confirm order message
      const pickupText = fulfillmentRes.type === "pickup"
        ? `Pickup at ${fulfillmentRes.pickupLocation} — slot ${fulfillmentRes.pickupSlot}`
        : `Shipped with ${fulfillmentRes.courier}. ETA ${fulfillmentRes.estDelivery}`;
      await client.sendText(user, `✅ Payment successful — txn ${paymentRes.txnId}\n${T.orderConfirmed(fulfillmentRes.orderId, pickupText)}`);
      state.stage = "POST_PURCHASE";
      state.context.order = fulfillmentRes;
      await save();

      // schedule follow up (for MVP we just inform)
      setTimeout(async () => {
        try {
          await client.sendText(user, `Reminder: Your pickup is scheduled at ${fulfillmentRes.pickupLocation} at ${fulfillmentRes.pickupSlot}`);
        } catch (e) { /* ignore */ }
      }, 1000 * 60 * 60); // in prod you'd schedule real reminders -- here 1 hour

      return;

    case "POST_PURCHASE":
      // expect rating or simple conversation
      if(/[1-5]/.test(body)) {
        await client.sendText(user, `Thanks for rating ${body} ⭐! We appreciate the feedback.`);
        // clear state to allow new session
        await db.clearUser(user);
        return;
      } else {
        await client.sendText(user, `If you want to start a new search type "menu".`);
        return;
      }

    default:
      await client.sendText(user, T.fallback);
      return;
  }
}

module.exports = { handleMessage, shortNumber };

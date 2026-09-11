'use strict';

const chatStore = require('../utils/chatStore');
const notify = require('../utils/notify');

function clean(str, max) {
  return String(str == null ? '' : str).trim().slice(0, max);
}

// Lightweight rule-based responder. This is the seam where a real agent,
// a human hand-off, or a third-party desk (Intercom, etc.) would plug in.
function autoReply(text) {
  const t = text.toLowerCase();
  const has = (...words) => words.some((w) => t.includes(w));

  if (has('hello', 'hi ', 'hey', 'good morning', 'good afternoon') || t === 'hi') {
    return "Hi, you're through to VMAX Machine Ltd. Which machine, part or job can we help with?";
  }
  if (has('career', 'job', 'hiring', 'vacancy', 'apply', 'position', 'role', 'apprentice')) {
    return 'We are hiring technicians, field service engineers, parts advisors and drivers. Open roles are on our Careers page, or tell me what you are on the tools with now.';
  }
  if (has('price', 'cost', 'quote', 'how much', 'budget', 'finance', 'lease', 'hire purchase')) {
    return 'Prices depend on specification, hours and what you are part-exchanging. Leave your email with the model you are after and a sales engineer will come back with a written figure.';
  }
  if (has('part', 'filter', 'undercarriage', 'bucket', 'attachment', 'breaker', 'teeth', 'cutting edge')) {
    return 'We hold around 9,400 parts lines and despatch stocked items the same day. Give me the model and serial number and the parts desk will confirm availability.';
  }
  if (has('hire', 'rent', 'rental', 'lease')) {
    return 'We sell rather than hire, but finance is often the answer: hire purchase, lease purchase or contract hire with the servicing built into the monthly figure. Which machine are you looking at?';
  }
  if (has('service', 'repair', 'breakdown', 'broken', 'fault', 'down', 'leak', 'hydraulic')) {
    return 'Our service controller can get a van to you, usually the same day. Tell me the machine, the site and what it is doing and I will pass it straight through.';
  }
  if (has('used', 'second hand', 'secondhand', 'low hour', 'trade in', 'part exchange', 'part-exchange')) {
    return 'We only sell brand new machines, so we do not carry used stock or take part-exchange. What we do cover is everything after the sale: servicing, parts, warranty and breakdown.';
  }
  if (has('warranty', 'cover', 'guarantee')) {
    return 'Every machine leaves with its full factory warranty registered on the day of delivery, and extended powertrain and hydraulic cover runs to five years. We raise and track claims ourselves.';
  }
  if (has('loader', 'excavator', 'digger', 'dozer', 'hauler', 'dumper', 'grader', 'telehandler', 'backhoe', 'roller', 'machine', 'stock')) {
    return 'That is squarely what we sell, new, across around fifty models. Tell me what you are moving, how many hours a week and what the ground is like, and we will spec the right size of machine.';
  }
  if (has('delivery', 'transport', 'low loader', 'lowloader', 'collect')) {
    return 'We run our own low-loaders and handle abnormal load permits, so delivery comes with a date rather than an estimate. Where is the site?';
  }
  if (has('contact', 'call', 'phone', 'email', 'visit', 'yard', 'open')) {
    return 'The fastest route is the contact page, or email contact@vmaxmachineltd.com. Leave your email here and the desk will come back to you.';
  }
  if (has('thanks', 'thank you', 'cheers', 'great')) {
    return 'Any time. Anything else I can help with?';
  }
  return "Thanks for the message. Someone on the desk will follow up. If you leave your email and a line on the job, we'll route it to the right person.";
}

/**
 * POST /api/chat/message
 *
 * Fallback path: used when the browser cannot reach Supabase itself (not
 * configured, or the client library failed to load). The server holds the
 * service role, so it writes both sides of the exchange.
 */
exports.postMessage = async (req, res, next) => {
  try {
    const sessionId = clean(req.body.sessionId, 64);
    const text = clean(req.body.text, 2000);

    if (!chatStore.isValidId(sessionId)) {
      return res.status(422).json({ error: 'invalid_session', message: 'Missing or malformed session id.' });
    }
    if (text.length < 1) {
      return res.status(422).json({ error: 'empty_message', message: 'Message cannot be empty.' });
    }

    const now = new Date().toISOString();
    const messages = [{ role: 'user', text, at: now }];

    // Stay quiet once a member of staff has picked the conversation up.
    let handedOver = false;
    try {
      handedOver = await chatStore.isHandedOver(sessionId);
    } catch (err) {
      console.error('[vmax] chat handover check failed:', err.message);
    }

    const reply = handedOver ? null : { role: 'agent', text: autoReply(text), at: new Date(Date.now() + 1).toISOString() };
    if (reply) messages.push(reply);

    let stored = true;
    try {
      await chatStore.append(sessionId, messages);
    } catch (err) {
      stored = false;
      console.error('[vmax] failed to persist chat message:', err.message);
    }

    // Route the visitor's message to the inbox so a human can pick it up.
    await notify.chatMessage(chatStore.sessionUuid(sessionId), text);

    // Both sides come back, so the widget draws the visitor's own message from
    // the same source it draws everything else and cannot double it up.
    return res.status(201).json({ ok: true, stored, messages });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/chat/notify
 *
 * Companion to the browser-written path. The visitor's own message is already
 * in the database, written by their browser under row level security; this
 * raises the flag by email and, until a human takes over, posts the holding
 * reply with the service role so it reaches them over realtime.
 */
exports.notifyMessage = async (req, res, next) => {
  try {
    const sessionId = clean(req.body.sessionId, 64);
    const text = clean(req.body.text, 2000);

    if (!chatStore.isUuid(sessionId)) {
      return res.status(422).json({ error: 'invalid_session', message: 'Missing or malformed session id.' });
    }
    if (text.length < 1) {
      return res.status(422).json({ error: 'empty_message', message: 'Message cannot be empty.' });
    }

    let replied = false;
    try {
      if (!(await chatStore.isHandedOverById(sessionId))) {
        await chatStore.appendById(sessionId, [{ role: 'agent', text: autoReply(text), at: new Date().toISOString() }]);
        replied = true;
      }
    } catch (err) {
      console.error('[vmax] failed to post chat reply:', err.message);
    }

    await notify.chatMessage(sessionId, text);

    return res.status(202).json({ ok: true, replied });
  } catch (err) {
    return next(err);
  }
};

/** GET /api/chat/:sessionId */
exports.getHistory = async (req, res, next) => {
  try {
    const sessionId = clean(req.params.sessionId, 64);
    if (!chatStore.isValidId(sessionId)) {
      return res.status(422).json({ error: 'invalid_session', message: 'Malformed session id.' });
    }
    let convo = { messages: [] };
    try {
      convo = await chatStore.load(sessionId);
    } catch (err) {
      // A storage fault should cost the visitor their history, not the widget.
      console.error('[vmax] failed to load chat history:', err.message);
    }
    return res.json({ sessionId, messages: convo.messages });
  } catch (err) {
    return next(err);
  }
};

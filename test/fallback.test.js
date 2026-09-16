'use strict';

/**
 * The ways one half of the Supabase configuration can be missing.
 *
 * The first two are the browser failing to reach Supabase itself: in both the
 * chat must still work, because the server holds the service role. The third
 * is the other way round, and is the one that quietly lost enquiries - the
 * server has no service-role key, so the page has to file the form itself.
 */

const assert = require('assert');
const http = require('http');
const { chromium } = require('playwright-core');
const mock = require('./mock-supabase');

const ROOT = require('path').join(__dirname, '..');


function serve(env) {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(ROOT + '/src')) delete require.cache[key];
  }
  ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'DATA_DIR', 'CHAT_NOTIFY'].forEach((k) => delete process.env[k]);
  Object.assign(process.env, env);
  const app = require(ROOT + '/src/app');
  return new Promise((r) => {
    const s = http.createServer(app).listen(0, '127.0.0.1', () => r(s));
  });
}

async function chat(browser, base) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(base + '/contact', { waitUntil: 'networkidle' });
  await page.click('#chat-toggle');
  await page.fill('#chat-input', 'Do you take on marine structures?');
  await page.press('#chat-input', 'Enter');
  await page.waitForFunction(
    () => document.querySelectorAll('#chat-log .chat-msg.agent:not(.typing)').length >= 1,
    null,
    { timeout: 15000 }
  );
  const drawn = await page.$$eval('#chat-log .chat-msg', (n) => n.map((x) => x.textContent));
  assert.strictEqual(errors.length, 0, errors.join('\n'));
  await page.close();
  return drawn;
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
  try {
    /* --- anonymous sign-ins switched off on the Supabase project --- */
    const sb = await mock.start({});
    sb.anonymousEnabled = false;
    let site = await serve({
      SUPABASE_URL: `http://127.0.0.1:${sb.address().port}`,
      SUPABASE_ANON_KEY: mock.ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: mock.SERVICE_KEY,
      CHAT_NOTIFY: 'off',
    });
    let drawn = await chat(browser, `http://127.0.0.1:${site.address().port}`);
    assert.ok(drawn.some((t) => t.includes('marine structures')), JSON.stringify(drawn));
    assert.ok(drawn.length >= 2, 'still got a reply: ' + JSON.stringify(drawn));
    assert.strictEqual(sb.db.chat_sessions.rows.length, 1, 'server wrote the session');
    assert.strictEqual(sb.db.chat_messages.rows.length, 2, 'server wrote both rows');
    assert.ok(sb.db.chat_sessions.rows[0].visitor_id, 'visitor_id supplied without auth.uid()');
    console.log('  ok  anonymous sign-ins disabled: chat falls back to the server and still persists');
    site.close();
    sb.close();

    /* --- no database at all: local files --- */
    const dir = require('fs').mkdtempSync('/tmp/vmax-chat-');
    site = await serve({ DATA_DIR: dir, CHAT_NOTIFY: 'off' });
    drawn = await chat(browser, `http://127.0.0.1:${site.address().port}`);
    assert.ok(drawn.length >= 2, 'reply without a database: ' + JSON.stringify(drawn));
    const files = require('fs').readdirSync(require('path').join(dir, 'chat'));
    assert.strictEqual(files.length, 1, 'conversation written to disk');
    console.log('  ok  no Supabase at all: chat works against local files');
    site.close();

    /* --- the other half missing: a browser key but no service-role key ---
       The server cannot write the row, so the page must file it itself or the
       enquiry is thanked for and lost. This is what made /admin look empty
       while the chat tab filled up. */
    const sb2 = await mock.start({});
    site = await serve({
      SUPABASE_URL: `http://127.0.0.1:${sb2.address().port}`,
      SUPABASE_ANON_KEY: mock.ANON_KEY,
      DATA_DIR: require('fs').mkdtempSync('/tmp/vmax-noservice-'),
      CHAT_NOTIFY: 'off',
    });
    const base2 = `http://127.0.0.1:${site.address().port}`;

    const page = await browser.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(base2 + '/contact', { waitUntil: 'networkidle' });
    await page.fill('#contact-form-name', 'Pieter Hoek');
    await page.fill('#contact-form-email', 'pieter@example.nl');
    await page.fill('#contact-form-message', 'Quote me a 20 tonne excavator for a six month job.');
    await page.click('#contact-form [data-submit]');
    await page.waitForSelector('#contact-form .form-status.ok', { timeout: 15000 });

    assert.strictEqual(sb2.db.enquiries.rows.length, 1,
      'the browser must file what the server could not: ' + JSON.stringify(sb2.db.enquiries.rows));
    const filed = sb2.db.enquiries.rows[0];
    assert.strictEqual(filed.name, 'Pieter Hoek');
    assert.strictEqual(filed.status, 'new');
    assert.match(filed.message, /20 tonne excavator/);
    assert.strictEqual(errs.length, 0, errs.join('\n'));
    console.log('  ok  no service-role key: the enquiry form files its own row and reaches the desk');

    await page.goto(base2 + '/apply', { waitUntil: 'networkidle' });
    await page.fill('#apply-name', 'Sanne Vermeer');
    await page.fill('#apply-email', 'sanne@example.nl');
    await page.fill('#apply-message', 'Six years on field service, mostly hydraulics and driveline work.');
    await page.click('#apply-form [data-submit], #apply-submit');
    await page.waitForSelector('#apply-status.ok', { timeout: 15000 });

    assert.strictEqual(sb2.db.applications.rows.length, 1,
      'the same for an application: ' + JSON.stringify(sb2.db.applications.rows));
    assert.strictEqual(sb2.db.applications.rows[0].name, 'Sanne Vermeer');
    assert.strictEqual(errs.length, 0, errs.join('\n'));
    console.log('  ok  no service-role key: the apply form files its own row too');

    /* --- and when neither path is open, say so rather than say thank you --- */
    sb2.publicForms = false;
    await page.goto(base2 + '/contact', { waitUntil: 'networkidle' });
    await page.fill('#contact-form-name', 'Lost Enquiry');
    await page.fill('#contact-form-email', 'lost@example.com');
    await page.fill('#contact-form-message', 'This one has nowhere at all to go.');
    await page.click('#contact-form [data-submit]');
    await page.waitForSelector('#contact-form .form-status.bad', { timeout: 15000 });
    const said = await page.textContent('#contact-form .form-status');
    assert.match(said, /could not file/i, said);
    assert.strictEqual(sb2.db.enquiries.rows.length, 1, 'and nothing new was written');
    assert.strictEqual(
      await page.inputValue('#contact-form-message'),
      'This one has nowhere at all to go.',
      'the form keeps what was typed so it can be emailed instead'
    );
    console.log('  ok  nowhere to file it: the visitor is told, not thanked');
    await page.close();
    site.close();
    sb2.close();

    console.log('\nfallback suite passed');
  } catch (err) {
    console.error('\nFAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
  process.exit(process.exitCode || 0);
})();

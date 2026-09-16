'use strict';

/**
 * What actually happened to something a visitor sent us.
 *
 * The contact and apply forms used to answer "thank you, it has reached our
 * engineers" whatever became of the record. When the service-role key is
 * missing from a deployment, `storage.append` writes to a JSON file beside the
 * process instead, and on a serverless host that file is gone the moment the
 * request ends: the visitor is thanked, the desk at /admin never sees it, and
 * nothing anywhere says so. Live chat never had the problem, because the
 * browser writes its own rows with the public key under row level security.
 *
 * So the reply now carries the facts, and the page decides what to say:
 *
 *   stored    the record is somewhere a member of staff will find it
 *   retry     it is not, but the browser can file it itself - the project is
 *             reachable from the page, which is the same footing chat is on
 *   notified  a notification reached a human inbox regardless
 *
 * A file write counts as stored only where there is no database configured at
 * all: on a laptop that is the whole storage backend and nothing is being lost.
 * Where the project IS configured, a file write means the row missed the desk.
 */

const config = require('./config');

/**
 * @param {'supabase'|'file'|null} landed  what storage.append reported
 * @param {boolean} notified               whether a notification channel took it
 * @param {string} message                 what to say when all is well
 */
function outcome(landed, notified, message) {
  const url = config.supabaseUrl();
  // The pair the browser is handed by /api/public-config.
  const reachableFromBrowser = Boolean(url && config.supabaseAnonKey());
  const noDatabaseAnywhere = !url && !config.supabaseServiceKey();

  const stored = landed === 'supabase' || (landed === 'file' && noDatabaseAnywhere);
  return {
    ok: true,
    stored,
    retry: !stored && reachableFromBrowser,
    notified: Boolean(notified),
    message,
  };
}

module.exports = { outcome };

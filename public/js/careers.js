'use strict';

(function () {
  const V = window.VMAX; if (!V) return;
  const wrap = document.getElementById('roles');
  if (!wrap) return;
  const esc = V.esc;
  const FALLBACK = [
    { id: 'heavy-equipment-technician', title: 'Heavy Equipment Technician', team: 'Workshop', location: 'Main workshop', type: 'Full time', summary: 'Strip, diagnose and rebuild hydraulics, drivelines and engines on loaders, excavators and haulers.' },
    { id: 'field-service-engineer', title: 'Field Service Engineer', team: 'Field Service', location: 'Mobile, own van', type: 'Full time', summary: 'Run your own service van, working scheduled maintenance and breakdown call-outs across customer sites.' }
  ];

  const role = (r) => `
    <div class="role" data-reveal>
      <div>
        <div class="team">${esc(r.team)}</div>
        <h3>${esc(r.title)}</h3>
        <p class="role-sum">${esc(r.summary)}</p>
      </div>
      <div class="role-meta">${esc(r.location)}<br>${esc(r.type)}</div>
      <a class="apply" href="/apply?role=${encodeURIComponent(r.id)}">Apply <span class="arw">&rsaquo;</span></a>
    </div>`;

  (async () => {
    let roles = FALLBACK;
    try { const d = await V.fetchJSON('/api/careers'); roles = d.roles || FALLBACK; } catch (e) {}
    wrap.innerHTML = roles.map(role).join('');
    V.observeReveals();
  })();
})();

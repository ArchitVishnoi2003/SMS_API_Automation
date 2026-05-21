function layout(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} · MAT SMS</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">
${body}
</body>
</html>`;
}

function loginPage(error) {
  return layout('Sign in', `
<div class="max-w-sm mx-auto mt-24 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
  <h1 class="text-2xl font-bold mb-1">MAT SMS</h1>
  <p class="text-sm text-slate-500 mb-6">Sign in to your team workspace</p>
  ${error ? `<div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-2 mb-4">${escapeHtml(error)}</div>` : ''}
  <form method="post" action="/login" class="space-y-3">
    <input name="email" type="email" placeholder="Email" required autofocus class="w-full border border-slate-300 rounded px-3 py-2">
    <input name="password" type="password" placeholder="Password" required class="w-full border border-slate-300 rounded px-3 py-2">
    <button class="w-full bg-slate-900 text-white rounded py-2 font-medium hover:bg-slate-700">Sign in</button>
  </form>
  <p class="text-sm text-center mt-4 text-slate-500">New here? <a href="/register" class="text-slate-900 underline">Create account</a></p>
</div>
  `);
}

function registerPage(error) {
  return layout('Register', `
<div class="max-w-sm mx-auto mt-24 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
  <h1 class="text-2xl font-bold mb-1">Create account</h1>
  <p class="text-sm text-slate-500 mb-6">Join the team workspace</p>
  ${error ? `<div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-2 mb-4">${escapeHtml(error)}</div>` : ''}
  <form method="post" action="/register" class="space-y-3">
    <input name="name" type="text" placeholder="Your name" class="w-full border border-slate-300 rounded px-3 py-2">
    <input name="email" type="email" placeholder="Email" required class="w-full border border-slate-300 rounded px-3 py-2">
    <input name="password" type="password" placeholder="Password (min 6 chars)" required minlength="6" class="w-full border border-slate-300 rounded px-3 py-2">
    <button class="w-full bg-slate-900 text-white rounded py-2 font-medium hover:bg-slate-700">Create account</button>
  </form>
  <p class="text-sm text-center mt-4 text-slate-500">Already have one? <a href="/login" class="text-slate-900 underline">Sign in</a></p>
</div>
  `);
}

function dashboardPage(user, stats, recent) {
  const rows = recent.map(m => `
    <tr class="border-t border-slate-200">
      <td class="px-3 py-2 font-mono text-sm">${escapeHtml(m.phone_number)}</td>
      <td class="px-3 py-2 text-sm">${escapeHtml(m.body.slice(0, 60))}${m.body.length > 60 ? '…' : ''}</td>
      <td class="px-3 py-2 text-sm"><span class="${statusBadge(m.status)}">${m.status}</span></td>
      <td class="px-3 py-2 text-sm text-slate-500">${new Date(m.created_at + 'Z').toLocaleString()}</td>
    </tr>
  `).join('');

  return layout('Dashboard', `
<header class="bg-white border-b border-slate-200">
  <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
    <div class="font-bold text-lg">MAT SMS</div>
    <div class="text-sm text-slate-600">
      ${escapeHtml(user.name || user.email)} ·
      <a href="/logout" class="underline">Sign out</a>
    </div>
  </div>
</header>

<main class="max-w-5xl mx-auto px-4 py-8 space-y-6">
  <section class="grid grid-cols-3 gap-4">
    <div class="bg-white p-4 rounded-lg border border-slate-200">
      <div class="text-xs uppercase tracking-wide text-slate-500">Sent today</div>
      <div class="text-2xl font-bold">${stats.used}</div>
    </div>
    <div class="bg-white p-4 rounded-lg border border-slate-200">
      <div class="text-xs uppercase tracking-wide text-slate-500">Remaining</div>
      <div class="text-2xl font-bold ${stats.remaining < 10 ? 'text-red-600' : 'text-emerald-600'}">${stats.remaining}</div>
    </div>
    <div class="bg-white p-4 rounded-lg border border-slate-200">
      <div class="text-xs uppercase tracking-wide text-slate-500">Daily cap</div>
      <div class="text-2xl font-bold">${stats.limit}</div>
    </div>
  </section>

  <section class="bg-white p-6 rounded-lg border border-slate-200">
    <h2 class="font-semibold mb-3">Send an SMS</h2>
    <form id="sendForm" class="space-y-3">
      <input id="phone" name="phone" type="tel" placeholder="+919876543210" required class="w-full border border-slate-300 rounded px-3 py-2 font-mono">
      <textarea id="body" name="body" rows="3" placeholder="Your message" required class="w-full border border-slate-300 rounded px-3 py-2"></textarea>
      <div class="flex items-center justify-between">
        <div id="status" class="text-sm"></div>
        <button class="bg-slate-900 text-white rounded px-4 py-2 font-medium hover:bg-slate-700">Send</button>
      </div>
    </form>
  </section>

  <section class="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <div class="px-6 py-3 border-b border-slate-200 font-semibold">Recent messages</div>
    <table class="w-full">
      <thead class="bg-slate-50 text-xs uppercase text-slate-500">
        <tr>
          <th class="text-left px-3 py-2">To</th>
          <th class="text-left px-3 py-2">Message</th>
          <th class="text-left px-3 py-2">Status</th>
          <th class="text-left px-3 py-2">When</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="4" class="px-3 py-6 text-center text-slate-500">No messages yet</td></tr>'}
      </tbody>
    </table>
  </section>
</main>

<script>
document.getElementById('sendForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById('status');
  const phone = document.getElementById('phone').value;
  const body = document.getElementById('body').value;
  statusEl.textContent = 'Sending…';
  statusEl.className = 'text-sm text-slate-500';
  try {
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, body })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Send failed');
    statusEl.textContent = 'Sent — refreshing…';
    statusEl.className = 'text-sm text-emerald-600';
    setTimeout(() => location.reload(), 800);
  } catch (err) {
    statusEl.textContent = err.message;
    statusEl.className = 'text-sm text-red-600';
  }
});
</script>
  `);
}

function statusBadge(status) {
  const colors = {
    pending: 'bg-amber-100 text-amber-800',
    sent: 'bg-emerald-100 text-emerald-800',
    failed: 'bg-red-100 text-red-800'
  };
  return `inline-block px-2 py-0.5 rounded text-xs ${colors[status] || 'bg-slate-100 text-slate-800'}`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

module.exports = { loginPage, registerPage, dashboardPage };

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || ''
};

function layout(title, body) {
  return `<!doctype html>
<html lang="en" class="h-full">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} · Sms Gateway</title>
  
  <!-- Modern Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Firebase SDKs -->
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            outfit: ['Outfit', 'sans-serif'],
            mono: ['Fira Code', 'monospace'],
          }
        }
      }
    }
  </script>
  
  <style>
    /* Premium visual overrides */
    .glass-panel {
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .glass-input {
      background: rgba(15, 23, 42, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .glass-input:focus {
      background: rgba(15, 23, 42, 0.7);
      border-color: rgba(139, 92, 246, 0.6);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
      outline: none;
    }
    
    /* Elegant pulse shimmer for skeleton loading */
    @keyframes shimmer {
      100% { transform: translateX(100%); }
    }
    
    .shimmer-bg {
      position: relative;
      overflow: hidden;
    }
    
    .shimmer-bg::after {
      position: absolute;
      top: 0; right: 0; bottom: 0; left: 0;
      transform: translateX(-100%);
      background-image: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.04) 20%,
        rgba(255, 255, 255, 0.08) 60%,
        rgba(255, 255, 255, 0) 100%
      );
      animation: shimmer 2s infinite;
      content: '';
    }
  </style>
</head>
<body class="bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 min-h-screen font-sans flex flex-col antialiased h-full">
  <script>
    // Global Firebase setup configuration injected from backend
    window.firebaseConfig = ${JSON.stringify(firebaseConfig)};
    window.hasFirebaseConfig = ${!!firebaseConfig.apiKey};
  </script>
  
  <div class="flex-grow flex flex-col">
    ${body}
  </div>

  <script>
    // Automatically replace all elements with data-lucide attribute with their SVG representation
    document.addEventListener("DOMContentLoaded", function() {
      lucide.createIcons();
    });
  </script>
</body>
</html>`;
}

function loginPage(error) {
  return layout('Sign In', `
<!-- ═══ GridScan WebGL Background Canvas ═══ -->
<canvas id="gridscan-bg" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;"></canvas>

<div class="flex-grow flex items-center justify-center px-4 py-8 md:py-16" style="position:relative;z-index:10;">

  <div class="w-[360px] md:w-[700px] max-w-full glass-panel p-5 md:p-8 rounded-[2rem] shadow-[0_0_60px_rgba(0,229,255,0.15)] border border-cyan-500/20 transition-all duration-300 flex flex-col md:flex-row gap-5 md:gap-12 font-outfit backdrop-blur-xl">
    
    <!-- Left: Logo & Header -->
    <div class="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
      <div class="inline-flex items-center justify-center p-3 md:p-4 bg-cyan-500/10 rounded-2xl border border-cyan-400/30 mb-4 md:mb-6 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
        <i data-lucide="cpu" class="w-10 h-10 text-cyan-300"></i>
      </div>
      <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,229,255,0.5)] mb-3">Sms Gateway</h1>
      <p class="text-cyan-100/70 text-lg font-light max-w-sm">The next-generation SIM-based marketing &amp; messaging gateway.</p>
    </div>

    <!-- Right: Auth Form -->
    <div class="flex-1 w-full max-w-md mx-auto relative">
      
      <!-- Error container -->
      <div id="authError" class="hidden mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
        <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400"></i>
        <span id="errorMessage"></span>
      </div>

      ${error ? '<div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]"><i data-lucide="alert-triangle" class="w-5 h-5 text-red-400"></i><span>' + escapeHtml(error) + '</span></div>' : ''}

      <!-- Interactive Tabs -->
      <div class="flex border-b border-cyan-900/40 mb-6 md:mb-8">
        <button id="tabLogin" class="flex-1 pb-4 text-sm font-bold border-b-2 border-cyan-400 text-white tracking-wider uppercase transition-colors">Sign In</button>
        <button id="tabRegister" class="flex-1 pb-4 text-sm font-bold border-b-2 border-transparent text-cyan-100/40 hover:text-cyan-100/80 tracking-wider uppercase transition-colors">Register</button>
      </div>

      <!-- Main Auth Form -->
      <form id="authForm" class="space-y-5">
        <div id="nameInputWrapper" class="hidden space-y-2">
          <label class="text-xs font-bold text-cyan-200/60 tracking-widest uppercase">Full Name</label>
          <div class="relative">
            <i data-lucide="user" class="absolute left-4 top-4 w-5 h-5 text-cyan-500/60"></i>
            <input id="nameInput" name="name" type="text" placeholder="Alex Mercer" class="w-full glass-input rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-cyan-100/30 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all">
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-cyan-200/60 tracking-widest uppercase">Email Address</label>
          <div class="relative">
            <i data-lucide="fingerprint" class="absolute left-4 top-4 w-5 h-5 text-cyan-500/60"></i>
            <input id="emailInput" name="email" type="email" required placeholder="alex@company.com" class="w-full glass-input rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-cyan-100/30 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all">
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-cyan-200/60 tracking-widest uppercase">Password</label>
          <div class="relative">
            <i data-lucide="lock-keyhole" class="absolute left-4 top-4 w-5 h-5 text-cyan-500/60"></i>
            <input id="passwordInput" name="password" type="password" required minlength="6" placeholder="••••••••" class="w-full glass-input rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-cyan-100/30 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all">
          </div>
        </div>

        <!-- Action Button -->
        <button id="submitBtn" class="w-full mt-8 py-4 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
          <span id="submitBtnText">Sign In</span>
          <i data-lucide="arrow-right" class="w-4 h-4"></i>
        </button>
      </form>
    </div>
  </div>
</div>

<!-- GridScan WebGL Background (Bundled) -->
<style>
  #gridscan-bg { position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;display:block;pointer-events:none; }
  .glass-panel { position:relative;z-index:10; }
</style>
<script src="/gridscan.bundle.js"></script>

<script>
  let isLoginMode = true;
  const isFirebaseActive = window.hasFirebaseConfig;
  
  if (!isFirebaseActive) {
    document.getElementById('bypassWarning')?.classList.remove('hidden');
  } else {
    // Initialize Firebase client
    firebase.initializeApp(window.firebaseConfig);
  }

  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const nameInputWrapper = document.getElementById('nameInputWrapper');
  const submitBtnText = document.getElementById('submitBtnText');
  const errorContainer = document.getElementById('authError');
  const errorMessage = document.getElementById('errorMessage');

  function setMode(loginMode) {
    isLoginMode = loginMode;
    errorContainer.classList.add('hidden');
    if (loginMode) {
      tabLogin.className = "flex-1 pb-4 text-sm font-bold border-b-2 border-cyan-400 text-white tracking-wider uppercase transition-colors";
      tabRegister.className = "flex-1 pb-4 text-sm font-bold border-b-2 border-transparent text-cyan-100/40 hover:text-cyan-100/80 tracking-wider uppercase transition-colors";
      nameInputWrapper.classList.add('hidden');
      document.getElementById('nameInput').removeAttribute('required');
      submitBtnText.textContent = "Sign In";
    } else {
      tabLogin.className = "flex-1 pb-4 text-sm font-bold border-b-2 border-transparent text-cyan-100/40 hover:text-cyan-100/80 tracking-wider uppercase transition-colors";
      tabRegister.className = "flex-1 pb-4 text-sm font-bold border-b-2 border-cyan-400 text-white tracking-wider uppercase transition-colors";
      nameInputWrapper.classList.remove('hidden');
      document.getElementById('nameInput').setAttribute('required', 'true');
      submitBtnText.textContent = "Register";
    }
    lucide.createIcons();
  }

  tabLogin.addEventListener('click', () => setMode(true));
  tabRegister.addEventListener('click', () => setMode(false));

  const authForm = document.getElementById('authForm');
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorContainer.classList.add('hidden');
    
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const name = document.getElementById('nameInput').value;

    const originalBtnContent = document.getElementById('submitBtn').innerHTML;
    document.getElementById('submitBtn').innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> Processing...';
    lucide.createIcons();
    document.getElementById('submitBtn').disabled = true;

    try {
      let idToken = '';
      
      if (!isFirebaseActive) {
        // Dev bypass logic
        const fakePayload = btoa(JSON.stringify({ email: email, name: name || 'Dev User' }));
        idToken = 'dev-bypass-header.' + fakePayload + '.signature';
      } else {
        if (isLoginMode) {
          const userCred = await firebase.auth().signInWithEmailAndPassword(email, password);
          idToken = await userCred.user.getIdToken();
        } else {
          const userCred = await firebase.auth().createUserWithEmailAndPassword(email, password);
          if (name) {
            await userCred.user.updateProfile({ displayName: name });
          }
          idToken = await userCred.user.getIdToken();
        }
      }

      // Send token to our server to create session
      const res = await fetch('/api/session-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, name })
      });
      
      const data = await res.json();
      if (data.ok) {
        window.location.href = '/app';
      } else {
        throw new Error(data.error || 'Server rejected session');
      }

    } catch (err) {
      console.error(err);
      errorMessage.textContent = err.message || 'Authentication failed';
      errorContainer.classList.remove('hidden');
    } finally {
      document.getElementById('submitBtn').disabled = false;
      document.getElementById('submitBtn').innerHTML = originalBtnContent;
    }
  });
</script>
`);
}
function dashboardPage(user, stats, recent) {
  const rows = recent.map(m => `
    <tr class="border-b border-slate-800/40 hover:bg-slate-900/35 transition-colors">
      <td class="px-4 py-3.5 font-mono text-xs text-slate-300 font-semibold">${escapeHtml(m.phone_number)}</td>
      <td class="px-4 py-3.5 text-xs text-slate-400 max-w-md truncate" title="${escapeHtml(m.body)}">${escapeHtml(m.body)}</td>
      <td class="px-4 py-3.5 text-xs"><span class="${statusBadge(m.status)}">${m.status}</span></td>
      <td class="px-4 py-3.5 text-xs text-slate-500">${new Date(m.created_at + 'Z').toLocaleString()}</td>
    </tr>
  `).join('');

  return layout('Dashboard', `
<!-- Top Premium Navigation -->
<header class="glass-panel border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
  <div class="flex items-center gap-3">
    <div class="p-2 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 rounded-lg border border-violet-500/30">
      <i data-lucide="zap" class="w-5 h-5 text-violet-400"></i>
    </div>
    <span class="font-outfit font-bold text-xl tracking-tight text-white">MAT <span class="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">SMS Pro</span></span>
  </div>
  
  <div class="flex items-center gap-4">
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-xs">
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
      <span class="text-slate-400">Android Connected</span>
    </div>
    
    <div class="h-6 w-[1px] bg-slate-800"></div>
    
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center font-bold text-violet-400 text-sm">
        ${escapeHtml((user.name || user.email || 'A').slice(0, 1).toUpperCase())}
      </div>
      <div class="hidden sm:block text-left text-xs">
        <p class="text-slate-200 font-semibold">${escapeHtml(user.name || 'Team Member')}</p>
        <p class="text-slate-500 font-mono text-[10px]">${escapeHtml(user.email)}</p>
      </div>
      <a href="/logout" class="p-2 text-slate-500 hover:text-red-400 transition-colors" title="Sign out">
        <i data-lucide="log-out" class="w-5 h-5"></i>
      </a>
    </div>
  </div>
</header>

<!-- Main Scaffold -->
<div class="flex-grow flex flex-col lg:flex-row max-w-7xl w-full mx-auto px-4 lg:px-6 py-6 gap-6">
  
  <!-- Left Side: Interactive Controls (AI Assistant & Standard Composer) -->
  <main class="flex-1 flex flex-col gap-6 lg:max-w-3xl">
    
    <!-- Gemini AI Assistant -->
    <section class="glass-panel p-6 rounded-2xl relative overflow-hidden group">
      <div class="absolute w-64 h-64 -top-24 -right-24 bg-violet-500/5 rounded-full blur-2xl"></div>
      
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
          <i data-lucide="sparkles" class="w-5 h-5 text-violet-400 animate-pulse"></i>
        </div>
        <div>
          <h2 class="font-outfit font-bold text-lg text-white">Gemini SMS Companion</h2>
          <p class="text-slate-500 text-xs mt-0.5">Let Google Gemini write personalized, high-conversion templates</p>
        </div>
      </div>
      
      <form id="aiPromptForm" class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Write your AI Instructions</label>
          <textarea id="aiPrompt" rows="2" placeholder="e.g. Ask VIP clients to check out our seasonal summer discounts starting tomorrow. Include {name}." class="w-full glass-input rounded-xl p-3 text-sm text-white placeholder-slate-500" required></textarea>
        </div>
        
        <div class="flex items-center justify-between gap-4">
          <div id="aiStatus" class="text-xs text-slate-400 flex items-center gap-2"></div>
          
          <button type="submit" class="px-5 py-2.5 rounded-xl font-bold bg-violet-600 text-white text-sm shadow-md hover:bg-violet-500 transition-all flex items-center gap-2 active:scale-95">
            <span>Draft with Gemini</span>
            <i data-lucide="sparkles" class="w-4 h-4"></i>
          </button>
        </div>
      </form>
      
      <!-- AI Results Panel -->
      <div id="aiTemplatesSection" class="hidden mt-6 space-y-3.5 border-t border-slate-800/60 pt-5">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">AI Crafted Variations</span>
          <span class="text-[10px] text-slate-500 font-mono">Select a card to populate the editor</span>
        </div>
        
        <div id="aiCardsContainer" class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <!-- Populated by JavaScript -->
        </div>
      </div>

      <!-- Holographic Skeleton Loader while generating -->
      <div id="aiSkeletonLoader" class="hidden mt-6 border-t border-slate-800/60 pt-5 space-y-4">
        <div class="flex items-center justify-between">
          <div class="h-4 w-32 bg-slate-800 rounded animate-pulse"></div>
          <div class="h-3 w-40 bg-slate-800 rounded animate-pulse"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div class="glass-panel p-4 rounded-xl border-dashed shimmer-bg h-36">
            <div class="h-3.5 w-16 bg-slate-800 rounded mb-3"></div>
            <div class="h-3 w-full bg-slate-800 rounded mb-2"></div>
            <div class="h-3 w-4/5 bg-slate-800 rounded mb-2"></div>
            <div class="h-3 w-3/5 bg-slate-800 rounded"></div>
          </div>
          <div class="glass-panel p-4 rounded-xl border-dashed shimmer-bg h-36">
            <div class="h-3.5 w-20 bg-slate-800 rounded mb-3"></div>
            <div class="h-3 w-full bg-slate-800 rounded mb-2"></div>
            <div class="h-3 w-4/5 bg-slate-800 rounded mb-2"></div>
            <div class="h-3 w-2/5 bg-slate-800 rounded"></div>
          </div>
          <div class="glass-panel p-4 rounded-xl border-dashed shimmer-bg h-36">
            <div class="h-3.5 w-24 bg-slate-800 rounded mb-3"></div>
            <div class="h-3 w-full bg-slate-800 rounded mb-2"></div>
            <div class="h-3 w-3/5 bg-slate-800 rounded mb-2"></div>
            <div class="h-3 w-4/5 bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Standard Composer -->
    <section class="glass-panel p-6 rounded-2xl">
      <div class="flex items-center gap-3 mb-4">
        <div class="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
          <i data-lucide="mail" class="w-5 h-5 text-indigo-400"></i>
        </div>
        <h2 class="font-outfit font-bold text-lg text-white">SMS Composer</h2>
      </div>
      
      <form id="sendForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-1 space-y-1.5">
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Client Number</label>
            <div class="relative">
              <i data-lucide="phone" class="absolute left-3 top-3.5 w-4.5 h-4.5 text-slate-500"></i>
              <input id="phone" name="phone" type="tel" placeholder="+919876543210" required class="w-full glass-input rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono">
            </div>
            <span class="text-[10px] text-slate-500 block">Must include country code (e.g. +91)</span>
          </div>
          
          <div class="md:col-span-2 space-y-1.5">
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Dynamic Placeholders Helper</label>
            <div class="grid grid-cols-3 gap-2">
              <input id="varName" type="text" placeholder="{name} -> Alice" class="glass-input rounded-xl px-3 py-2 text-xs text-white">
              <input id="varVal1" type="text" placeholder="{amount} -> $250" class="glass-input rounded-xl px-3 py-2 text-xs text-white">
              <button id="applyVarsBtn" type="button" class="bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold border border-slate-700/50">Replace Vars</button>
            </div>
          </div>
        </div>
        
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Message Content</label>
            <span id="charCounter" class="text-[10px] text-slate-500 font-mono">0 chars (0 SMS parts)</span>
          </div>
          <textarea id="body" name="body" rows="4" placeholder="Draft your SMS message here..." required class="w-full glass-input rounded-xl p-4 text-sm text-white"></textarea>
        </div>
        
        <div class="flex items-center justify-between border-t border-slate-800/40 pt-4">
          <div id="status" class="text-sm font-semibold flex items-center gap-2"></div>
          
          <button type="submit" class="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm shadow-lg hover:from-violet-500 hover:to-indigo-500 active:scale-95 transition-all flex items-center gap-2">
            <span>Send Message</span>
            <i data-lucide="send" class="w-4 h-4"></i>
          </button>
        </div>
      </form>
    </section>
    

  </main>
  
  <!-- Right Side: Diagnostics & History logs -->
  <aside class="w-full lg:w-96 flex flex-col gap-6">
    
    <!-- Quota & Stats Circle Panel -->
    <section class="glass-panel p-6 rounded-2xl flex flex-col items-center">
      <h2 class="font-outfit font-semibold text-sm text-slate-400 uppercase tracking-wide self-start mb-4">Daily SIM Quota</h2>
      
      <!-- SVG Dial Indicator -->
      <div class="relative w-36 h-36 flex items-center justify-center mb-4">
        <!-- SVG Ring Track -->
        <svg class="absolute w-full h-full -rotate-90">
          <circle cx="72" cy="72" r="62" stroke="rgba(255,255,255,0.03)" stroke-width="8" fill="transparent" />
          <circle id="quotaIndicatorCircle" cx="72" cy="72" r="62" stroke="url(#gradientViolet)" stroke-width="8" fill="transparent"
            stroke-dasharray="390" stroke-dashoffset="${390 - (390 * (stats.remaining / stats.limit))}"
            stroke-linecap="round" class="transition-all duration-500" />
          <defs>
            <linearGradient id="gradientViolet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#8b5cf6" />
              <stop offset="100%" stop-color="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>
        
        <div class="text-center z-10">
          <span class="text-3xl font-extrabold font-outfit text-white leading-none block">${stats.remaining}</span>
          <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mt-1">Remaining</span>
        </div>
      </div>
      
      <div class="grid grid-cols-2 w-full gap-4 pt-4 border-t border-slate-800/40 text-center">
        <div>
          <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Sent Today</span>
          <span class="text-lg font-bold block text-white font-outfit mt-0.5">${stats.used}</span>
        </div>
        <div>
          <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Daily Allowance</span>
          <span class="text-lg font-bold block text-slate-300 font-outfit mt-0.5">${stats.limit}</span>
        </div>
      </div>
    </section>
    
    <!-- System Gateway Connection Details -->
    <section class="glass-panel p-6 rounded-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800/40 pb-3">
        <h2 class="font-outfit font-semibold text-sm text-slate-400 uppercase tracking-wide">SIM Gateway Log</h2>
        <i data-lucide="cpu" class="w-4.5 h-4.5 text-slate-500"></i>
      </div>
      
      <div class="space-y-3 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-500">Device Status</span>
          <span class="text-emerald-400 font-semibold">Online / Active</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Gateway URL</span>
          <span class="font-mono text-slate-300">sms-gate.app</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Allowed Rate</span>
          <span class="text-slate-300">~6 SMS / Minute</span>
        </div>
      </div>
      
      <div class="p-3 bg-violet-600/5 border border-violet-500/10 rounded-xl text-[11px] text-violet-300/80 leading-relaxed">
        <span class="font-semibold block mb-0.5 text-white flex items-center gap-1.5"><i data-lucide="info" class="w-3.5 h-3.5 text-violet-400"></i> Carrier Advice</span>
        Avoid sending identical templates in large bursts. Spacing them out protects the personal SIM from automated carrier spam filters.
      </div>
    </section>
  </aside>
</div>

<!-- History Log Panel -->
<div class="max-w-7xl w-full mx-auto px-4 lg:px-6 pb-12">
  <section class="glass-panel rounded-2xl overflow-hidden shadow-xl">
    <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-slate-800 rounded-lg">
          <i data-lucide="history" class="w-4.5 h-4.5 text-slate-400"></i>
        </div>
        <h2 class="font-outfit font-bold text-base text-white">Recent Transactions Log</h2>
      </div>
      <span class="text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-mono">Realtime updates</span>
    </div>
    
    <div class="overflow-x-auto w-full">
      <table class="w-full text-left border-collapse">
        <thead class="bg-slate-900/40 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          <tr>
            <th class="px-4 py-3 border-b border-slate-800">To</th>
            <th class="px-4 py-3 border-b border-slate-800">Message Content</th>
            <th class="px-4 py-3 border-b border-slate-800">Gateway Status</th>
            <th class="px-4 py-3 border-b border-slate-800">Sent When</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/40">
          ${rows || '<tr><td colspan="4" class="px-6 py-8 text-center text-xs text-slate-500 font-medium">No sent SMS logs found in SQLite. Keep testing!</td></tr>'}
        </tbody>
      </table>
    </div>
  </section>
</div>

<script>
  // SMS Composer Char Counter
  const messageBody = document.getElementById('body');
  const charCounter = document.getElementById('charCounter');
  
  function updateCounter() {
    const text = messageBody.value;
    const len = text.length;
    // Standard GSM SMS calculations
    const parts = len <= 160 ? 1 : Math.ceil(len / 153);
    charCounter.textContent = \`\${len} chars (\${parts} SMS part\${parts > 1 ? 's' : ''})\`;
  }
  messageBody.addEventListener('input', updateCounter);
  updateCounter();

  // Apply variables substitution locally
  document.getElementById('applyVarsBtn').addEventListener('click', () => {
    let text = messageBody.value;
    
    const nameVal = document.getElementById('varName').value.trim();
    const amountVal = document.getElementById('varVal1').value.trim();
    
    if (nameVal) {
      text = text.replace(/{name}/g, nameVal);
    }
    if (amountVal) {
      text = text.replace(/{amount}/g, amountVal);
    }
    
    messageBody.value = text;
    updateCounter();
  });

  // Prompt generator submit
  document.getElementById('aiPromptForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = document.getElementById('aiPrompt').value.trim();
    const statusEl = document.getElementById('aiStatus');
    const skeleton = document.getElementById('aiSkeletonLoader');
    const section = document.getElementById('aiTemplatesSection');
    
    statusEl.innerHTML = '<span class="text-violet-400 font-semibold animate-pulse">Consulting Gemini Expert Copywriter\u2026</span>';
    skeleton.classList.remove('hidden');
    section.classList.add('hidden');
    
    try {
      const res = await fetch('/api/generate-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');
      
      const container = document.getElementById('aiCardsContainer');
      container.innerHTML = '';
      
      data.templates.forEach((tpl) => {
        const card = document.createElement('div');
        card.className = "glass-panel p-4 rounded-xl border border-slate-800 hover:border-violet-500/50 hover:bg-violet-950/5 active:scale-98 cursor-pointer transition-all flex flex-col h-full";
        card.innerHTML = \`
          <span class="text-xs font-bold text-violet-400 mb-1.5 font-outfit">\${escapeHtml(tpl.title)}</span>
          <p class="text-xs text-slate-300 font-medium leading-relaxed flex-grow">\${escapeHtml(tpl.text)}</p>
        \`;
        card.addEventListener('click', () => {
          messageBody.value = tpl.text;
          updateCounter();
          messageBody.focus();
          messageBody.classList.add('ring-2', 'ring-violet-500');
          setTimeout(() => messageBody.classList.remove('ring-2', 'ring-violet-500'), 1000);
        });
        container.appendChild(card);
      });
      
      skeleton.classList.add('hidden');
      section.classList.remove('hidden');
      statusEl.innerHTML = '<span class="text-emerald-400 font-semibold">Gemini drafted 3 templates!</span>';
    } catch(err) {
      skeleton.classList.add('hidden');
      statusEl.innerHTML = \`<span class="text-red-400 font-semibold">Error: \${escapeHtml(err.message)}</span>\`;
    }
  });

  // Standard Form Submit
  document.getElementById('sendForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('status');
    const phone = document.getElementById('phone').value.trim();
    const body = messageBody.value.trim();
    
    statusEl.innerHTML = '<i data-lucide="loader" class="w-4 h-4 text-slate-400 animate-spin"></i><span class="text-slate-400">Queueing on phone Gateway\u2026</span>';
    lucide.createIcons();
    
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, body })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      
      statusEl.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span class="text-emerald-400 font-semibold">Dispatched successfully!</span>';
      setTimeout(() => location.reload(), 1000);
    } catch (err) {
      statusEl.innerHTML = \`<i data-lucide="x-circle" class="w-4 h-4 text-red-400"></i><span class="text-red-400 font-semibold">\${escapeHtml(err.message)}</span>\`;
    }
    lucide.createIcons();
  });

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
</script>
  `);
}

function statusBadge(status) {
  const colors = {
    pending: 'bg-amber-500/10 border border-amber-500/20 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.05)]',
    sent: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.05)]',
    failed: 'bg-red-500/10 border border-red-500/20 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.05)]'
  };
  return `inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${colors[status] || 'bg-slate-800 text-slate-400'}`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

module.exports = { loginPage, dashboardPage };

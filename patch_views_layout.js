const fs = require('fs');
const path = require('path');

const viewsPath = path.join(__dirname, 'src', 'views.js');
let content = fs.readFileSync(viewsPath, 'utf8');

// Find the start of the loginPage function
const startIdx = content.indexOf('function loginPage(error) {');
if (startIdx === -1) {
  console.error("Could not find loginPage");
  process.exit(1);
}

// Find the end of the loginPage function
const endMarker = 'function dashboardPage(user, stats, recent) {';
const endIdx = content.indexOf(endMarker);
if (endIdx === -1) {
  console.error("Could not find end of loginPage");
  process.exit(1);
}

const newLoginPage = `function loginPage(error) {
  return layout('Sign In', \`
<!-- ═══ GridScan WebGL Background Canvas ═══ -->
<canvas id="gridscan-bg" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block;"></canvas>

<div class="flex-grow flex items-center justify-center px-4 py-16" style="position:relative;z-index:10;">

  <div class="w-full max-w-4xl glass-panel p-8 md:p-12 rounded-[2rem] shadow-[0_0_60px_rgba(0,229,255,0.15)] border border-cyan-500/20 transition-all duration-300 flex flex-col md:flex-row gap-12 md:gap-16 font-outfit backdrop-blur-xl">
    
    <!-- Left: Logo & Header -->
    <div class="flex-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
      <div class="inline-flex items-center justify-center p-4 bg-cyan-500/10 rounded-2xl border border-cyan-400/30 mb-6 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
        <i data-lucide="cpu" class="w-10 h-10 text-cyan-300"></i>
      </div>
      <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(0,229,255,0.5)] mb-3">MAT SMS Pro</h1>
      <p class="text-cyan-100/70 text-lg font-light max-w-sm">The next-generation SIM-based marketing &amp; messaging gateway.</p>
    </div>

    <!-- Right: Auth Form -->
    <div class="flex-1 w-full max-w-md mx-auto relative">
      
      <!-- Error container -->
      <div id="authError" class="hidden mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
        <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400"></i>
        <span id="errorMessage"></span>
      </div>

      \${error ? \`
      <div class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-center gap-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
        <i data-lucide="alert-triangle" class="w-5 h-5 text-red-400"></i>
        <span>\${escapeHtml(error)}</span>
      </div>
      \` : ''}

      <!-- Interactive Tabs -->
      <div class="flex border-b border-cyan-900/40 mb-8">
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
          <label class="text-xs font-bold text-cyan-200/60 tracking-widest uppercase">Data Link ID (Email)</label>
          <div class="relative">
            <i data-lucide="fingerprint" class="absolute left-4 top-4 w-5 h-5 text-cyan-500/60"></i>
            <input id="emailInput" name="email" type="email" required placeholder="alex@company.com" class="w-full glass-input rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-cyan-100/30 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all">
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-cyan-200/60 tracking-widest uppercase">Access Key (Password)</label>
          <div class="relative">
            <i data-lucide="lock-keyhole" class="absolute left-4 top-4 w-5 h-5 text-cyan-500/60"></i>
            <input id="passwordInput" name="password" type="password" required minlength="6" placeholder="••••••••" class="w-full glass-input rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-cyan-100/30 focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all">
          </div>
        </div>

        <!-- Action Button -->
        <button id="submitBtn" class="w-full mt-8 py-4 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
          <span id="submitBtnText">Initialize</span>
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
      submitBtnText.textContent = "Initialize";
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
        idToken = \`dev-bypass-header.\${fakePayload}.signature\`;
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
\`);
}
`;

const newContent = content.substring(0, startIdx) + newLoginPage + content.substring(endIdx);
fs.writeFileSync(viewsPath, newContent, 'utf8');
console.log('Successfully updated loginPage layout in views.js');

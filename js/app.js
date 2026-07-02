// Application Core JavaScript & State Management

// Advanced Notification Auto-Injector
function showAdvancedToast(title, message, type = 'success') {
  let toast = document.getElementById('advanced-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'advanced-toast';
    toast.className = 'fixed top-5 left-1/2 -translate-x-1/2 z-[100] transform -translate-y-20 opacity-0 transition-all duration-500 bg-[#0d162d]/95 backdrop-blur-2xl border rounded-2xl py-3.5 px-5 flex items-center gap-4 min-w-[300px] pointer-events-none shadow-2xl';

    toast.innerHTML = `
      <div id="toast-icon-bg" class="w-9 h-9 rounded-full flex items-center justify-center shrink-0">
        <span id="toast-icon" class="text-xl"></span>
      </div>
      <div>
        <h4 class="text-white font-extrabold text-sm tracking-wide" id="toast-title"></h4>
        <p class="text-slate-350 text-xs mt-0.5" id="toast-message"></p>
      </div>
    `;
    document.body.appendChild(toast);
  }

  const iconBg = document.getElementById('toast-icon-bg');
  const icon = document.getElementById('toast-icon');

  if (type === 'error') {
    toast.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    toast.style.boxShadow = '0 10px 40px rgba(239, 68, 68, 0.25)';
    iconBg.className = 'w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-red-500/20';
    icon.textContent = '❌';
  } else {
    toast.style.borderColor = 'rgba(79, 70, 229, 0.4)';
    toast.style.boxShadow = '0 10px 40px rgba(79, 70, 229, 0.25)';
    iconBg.className = 'w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/20';
    icon.textContent = '✅';
  }

  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-message').textContent = message;

  setTimeout(() => {
    toast.style.transform = 'translate(-50%, 0)';
    toast.style.opacity = '1';
  }, 50);

  setTimeout(() => {
    toast.style.transform = 'translate(-50%, -100%)';
    toast.style.opacity = '0';
  }, 2500);
}

// Initialize State
let appState = {
  balance: 0.00,
  totalDeposit: 0.00,
  totalWithdraw: 0.00,
  totalProfit: 0.00,
  lockedEarnings: 0.00,
  deposits: [],
  withdraws: []
};

// Update user details on both Header and Profile section in DOM
function updateDOMUserInfo(name, email) {
  let initials = "MB";
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].substring(0, Math.min(2, parts[0].length)).toUpperCase();
    }
  }

  // Header Elements
  const elHInitial = document.getElementById('user-header-initial');
  const elHName = document.getElementById('user-header-name');
  const elHId = document.getElementById('user-header-id');
  if (elHInitial) elHInitial.textContent = initials;
  if (elHName) elHName.textContent = name;
  if (elHId) elHId.textContent = `ID: ${email.split('@')[0]}`;

  // Profile Elements
  const elPInitial = document.getElementById('user-profile-initial');
  const elPName = document.getElementById('user-profile-name');
  const elPMeta = document.getElementById('user-profile-meta');
  if (elPInitial) elPInitial.textContent = initials;
  if (elPName) elPName.textContent = name;
  if (elPMeta) elPMeta.textContent = `ID: ${email.split('@')[0]} | Member since May 2026`;

  // Referral Link
  const elRef = document.getElementById('user-referral-link');
  if (elRef) {
    elRef.innerHTML = `http://mybusiness.com/register?ref=${phone}`;
  }
}

const API_URL = '/api';



// Show Dashboard immediately - no waiting
function showDashboard() {
  const authLayout = document.getElementById('auth-layout');
  const dashLayout = document.getElementById('dashboard-layout');
  if (authLayout) authLayout.classList.add('hidden');
  if (dashLayout) {
    dashLayout.classList.remove('hidden');
    dashLayout.style.opacity = '1';
    dashLayout.style.transform = 'scale(1)';
  }
}

// Show Auth Screen
function showAuthScreen(mode = 'login') {
  const authLayout = document.getElementById('auth-layout');
  const dashLayout = document.getElementById('dashboard-layout');
  if (authLayout) authLayout.classList.remove('hidden');
  if (dashLayout) dashLayout.classList.add('hidden');
  if (window.toggleAuthMode) window.toggleAuthMode(mode);
}

// Load state from backend on startup
async function loadState() {
  const token = localStorage.getItem('my_business_token');

  if (!token) {
    showAuthScreen('login');
    return;
  }

  // Token exists → show dashboard IMMEDIATELY, load data in background
  showDashboard();

  try {
    const userRes = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!userRes.ok) {
      // Token invalid → go back to login
      localStorage.removeItem('my_business_token');
      showAuthScreen('login');
      return;
    }

    const currentUser = await userRes.json();
    updateDOMUserInfo(currentUser.name, currentUser.email);

    // Load wallet data in background
    try {
      const walletRes = await fetch(`${API_URL}/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        appState.balance = walletData.wallet?.balance || 0;
        appState.totalDeposit = walletData.wallet?.totalDeposit || 0;
        appState.totalWithdraw = walletData.wallet?.totalWithdraw || 0;
        appState.totalProfit = walletData.wallet?.totalProfit || 0;
        appState.lockedEarnings = walletData.wallet?.lockedEarnings || 0;

        appState.deposits = (walletData.transactions || []).filter(t => t.type === 'deposit').map(t => ({
          name: currentUser.name,
          amount: t.amount,
          status: t.status === 'approved' ? 'Completed' : (t.status === 'rejected' ? 'Rejected' : 'Pending'),
          date: new Date(t.createdAt).toLocaleDateString()
        }));

        appState.withdraws = (walletData.transactions || []).filter(t => t.type === 'withdraw').map(t => ({
          amount: t.amount,
          method: t.method,
          status: t.status === 'approved' ? 'Completed' : (t.status === 'rejected' ? 'Rejected' : 'Pending'),
          date: new Date(t.createdAt).toLocaleDateString()
        }));

        updateUI();
      }
    } catch (walletErr) {
      console.warn('Wallet load failed (continuing):', walletErr);
    }

  } catch (err) {
    console.error('Auth check failed:', err);
    // Network error - still keep dashboard open since token exists
    // Only logout if explicitly invalid
  }
}

// Function to manually reload from API
async function saveState() {
  await loadState();
}


// Format currency helper
function formatCurrency(val) {
  return parseFloat(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Get current date string (e.g. "1 Jul 2026")
function getCurrentDateString() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date();
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// Update DOM elements based on state
function updateUI() {
  // Update dashboard stats cards
  const elBalance = document.getElementById('stat-balance');
  const elTotalDeposit = document.getElementById('stat-total-deposit');
  const elTotalWithdraw = document.getElementById('stat-total-withdraw');
  const elTotalProfit = document.getElementById('stat-total-profit');

  if (elBalance) elBalance.textContent = `${formatCurrency(appState.balance)} USD`;
  if (elTotalDeposit) elTotalDeposit.textContent = `${formatCurrency(appState.totalDeposit)} USD`;
  if (elTotalWithdraw) elTotalWithdraw.textContent = `${formatCurrency(appState.totalWithdraw)} USD`;
  if (elTotalProfit) elTotalProfit.textContent = `${formatCurrency(appState.totalProfit)} USD`;

  // Update Assets Section
  const elAssetsValuation = document.getElementById('assets-total-valuation');
  const elAssetsLocked = document.getElementById('assets-locked-earnings');
  const elAssetsWithdrawable = document.getElementById('assets-withdrawable-balance');

  const totalAssets = appState.balance + appState.lockedEarnings;
  if (elAssetsValuation) elAssetsValuation.textContent = `$${formatCurrency(totalAssets)} USD`;
  if (elAssetsLocked) elAssetsLocked.textContent = `$${formatCurrency(appState.lockedEarnings)}`;
  if (elAssetsWithdrawable) elAssetsWithdrawable.textContent = `$${formatCurrency(appState.balance)}`;

  // Populate Latest Deposits Table
  const depositsBody = document.getElementById('deposits-table-body');
  if (depositsBody) {
    depositsBody.innerHTML = '';
    // Display top 3 latest
    appState.deposits.slice(0, 3).forEach(dep => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-2.5 text-slate-350">${dep.name}</td>
        <td class="py-2.5 text-right font-semibold text-slate-250">$${formatCurrency(dep.amount)}</td>
        <td class="py-2.5 text-center"><span class="bg-emerald-500/10 text-emerald-400 leading-none px-2 py-0.5 rounded text-[10px]">${dep.status}</span></td>
        <td class="py-2.5 text-right text-slate-500">${dep.date}</td>
      `;
      depositsBody.appendChild(tr);
    });
  }

  // Populate Latest Withdraws Table
  const withdrawsBody = document.getElementById('withdraws-table-body');
  if (withdrawsBody) {
    withdrawsBody.innerHTML = '';
    // Display top 3 latest
    appState.withdraws.slice(0, 3).forEach(wd => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-2.5 font-semibold text-slate-250">$${formatCurrency(wd.amount)}</td>
        <td class="py-2.5 text-center text-slate-350">${wd.method}</td>
        <td class="py-2.5 text-center"><span class="bg-emerald-500/10 text-emerald-400 leading-none px-2 py-0.5 rounded text-[10px]">${wd.status}</span></td>
        <td class="py-2.5 text-right text-slate-500">${wd.date}</td>
      `;
      withdrawsBody.appendChild(tr);
    });
  }
}

// Fetch payment methods dynamically
async function loadPaymentMethods() {
  const token = localStorage.getItem('my_business_token');
  if (!token) return;
  try {
    const res = await fetch(`${API_URL}/payment-methods`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const methods = await res.json();
      const container = document.getElementById('deposit-methods-container');
      const select = document.getElementById('deposit-method-select');
      const details = document.getElementById('deposit-method-details');
      if (methods.length > 0 && container) {
        container.classList.remove('hidden');
        select.innerHTML = '<option value="">Select a method...</option>';
        methods.forEach(m => {
          const op = document.createElement('option');
          op.value = m.name;
          op.textContent = m.name;
          op.dataset.info = `<strong>Title:</strong> ${m.accountTitle}<br><strong>Account Number:</strong> ${m.accountNumber}<br><strong>IBAN:</strong> ${m.iban || 'N/A'}<br><br><span class="text-xs text-indigo-300">${m.instructions || ''}</span>`;
          select.appendChild(op);
        });
        select.addEventListener('change', (e) => {
          const opt = e.target.selectedOptions[0];
          if (opt && opt.value) {
            details.innerHTML = opt.dataset.info;
          } else {
            details.innerHTML = '';
          }
        });
      }
    }
  } catch (e) { console.error(e); }
}

// Document Load Listener
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  loadPaymentMethods();
  initNavigation();
  initRippleEffect();
  initModals();
  initSubPages();
});

// 1. Navigation handling (Sync between Sidebar & Mobile Navigation)
function initNavigation() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const bottomLinks = document.querySelectorAll('.bottom-nav-link');
  const tabSections = document.querySelectorAll('.tab-section');

  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');

  // Switch Tab Function
  window.switchTabPanel = function (tabId) {
    // Hide all sections
    tabSections.forEach(section => {
      section.classList.add('hidden');
    });

    // Show active section
    const activeSection = document.getElementById(`tab-${tabId}`);
    if (activeSection) {
      activeSection.classList.remove('hidden');
    }

    // Update Sidebar links active status
    sidebarLinks.forEach(link => {
      if (link.getAttribute('data-tab') === tabId) {
        link.classList.add('active');
        link.classList.remove('text-slate-400');
        link.classList.add('text-white');
      } else {
        link.classList.remove('active');
        link.classList.add('text-slate-400');
        link.classList.remove('text-white');
      }
    });

    // Update Bottom Nav links active status
    bottomLinks.forEach(link => {
      if (link.getAttribute('data-tab') === tabId) {
        link.classList.add('text-indigo-400');
        link.classList.remove('text-slate-450');
      } else {
        link.classList.remove('text-indigo-400');
        link.classList.add('text-slate-450');
      }
    });

    // Close mobile menu
    closeMobileSidebar();
  };

  // Bind Sidebar items Click
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      if (tabId === 'logout') {
        alert('Logging out...');
        return;
      }
      window.switchTabPanel(tabId);
    });
  });

  // Bind Bottom Nav items Click
  bottomLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      window.switchTabPanel(tabId);
    });
  });

  // Mobile Hamburger Toggle
  if (menuToggle && sidebar && sidebarOverlay) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.remove('-translate-x-full');
      sidebarOverlay.classList.remove('hidden');
    });

    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  function closeMobileSidebar() {
    if (sidebar && sidebarOverlay) {
      sidebar.classList.add('-translate-x-full');
      sidebarOverlay.classList.add('hidden');
    }
  }

  // Initial tab load
  window.switchTabPanel('dashboard');
}

// 2. Ripple Button Effect
function initRippleEffect() {
  const buttons = document.querySelectorAll('.ripple-btn');
  buttons.forEach(button => {
    button.addEventListener('mousedown', function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      this.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
}

// 3. Modals and Triggers
let selectedPlanName = '';
let selectedPlanPrice = 0;

function initModals() {
  // Invest Dialog Action
  window.openInvestModal = function (planName, priceStr) {
    const modal = document.getElementById('invest-modal');
    if (!modal) return;

    selectedPlanName = planName;
    selectedPlanPrice = parseFloat(priceStr.replace(/[^0-9.]/g, ''));

    document.getElementById('invest-plan-name').textContent = planName;
    document.getElementById('invest-plan-price').textContent = priceStr;

    // Set account balance in modal
    const elModalBalance = document.getElementById('invest-modal-balance');
    elModalBalance.textContent = `$${formatCurrency(appState.balance)} USD`;

    const elError = document.getElementById('invest-modal-error');
    const btnSubmit = document.getElementById('invest-modal-submit');

    if (appState.balance >= selectedPlanPrice) {
      elError.classList.add('hidden');
      btnSubmit.removeAttribute('disabled');
      btnSubmit.className = 'flex-1 bg-indigo-650 text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-indigo-600 cursor-pointer';
    } else {
      elError.classList.remove('hidden');
      btnSubmit.setAttribute('disabled', 'true');
      btnSubmit.className = 'flex-1 bg-indigo-650 opacity-45 cursor-not-allowed text-white py-2.5 rounded-xl text-xs font-semibold';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  };

  window.closeInvestModal = function () {
    const modal = document.getElementById('invest-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  // See All Logs modal
  window.openLogsModal = function (title, data) {
    const modal = document.getElementById('logs-modal');
    if (!modal) return;

    document.getElementById('logs-modal-title').textContent = title;

    // Fill the logs lists
    const container = document.getElementById('logs-modal-container');
    container.innerHTML = '';

    data.forEach(item => {
      const row = document.createElement('div');
      row.className = 'flex justify-between items-center py-3 border-b border-slate-800 text-sm';
      row.innerHTML = `
        <div>
          <p class="font-medium text-slate-200">${item.col1}</p>
          <p class="text-xs text-slate-500">${item.date}</p>
        </div>
        <div class="text-right">
          <p class="font-semibold text-slate-205">${item.col2}</p>
          <span class="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 mt-1">${item.status}</span>
        </div>
      `;
      container.appendChild(row);
    });

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  };

  window.closeLogsModal = function () {
    const modal = document.getElementById('logs-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  // Invite Button Copy Action
  const copyBtn = document.getElementById('copy-invite-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = 'http://mybusiness.com/register?ref=03325700270';
      navigator.clipboard.writeText(code).then(() => {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = 'Copied!';
        copyBtn.classList.replace('bg-indigo-650', 'bg-emerald-600');
        setTimeout(() => {
          copyBtn.innerText = originalText;
          copyBtn.classList.replace('bg-emerald-600', 'bg-indigo-650');
        }, 1500);
      });
    });
  }

  // Invest Form submit
  const investForm = document.getElementById('invest-form');
  if (investForm) {
    investForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (appState.balance >= selectedPlanPrice) {
        appState.balance -= selectedPlanPrice;
        appState.lockedEarnings += selectedPlanPrice;

        // Add to active profit or simulate incremental profit
        appState.totalProfit += (selectedPlanPrice * 0.11); // Add initial simulated profit

        alert(`Investment of $${formatCurrency(selectedPlanPrice)} in ${selectedPlanName} completed successfully!`);
        closeInvestModal();
        saveState();
      } else {
        alert('Insufficient balance.');
      }
    });
  }
}

// 4. Interactive subpages helper
function initSubPages() {
  // Deposit Amount Input Actions
  const presetAmounts = document.querySelectorAll('.preset-deposit-amount');
  const depositInput = document.getElementById('deposit-amount-input');

  if (presetAmounts && depositInput) {
    presetAmounts.forEach(btn => {
      btn.addEventListener('click', () => {
        depositInput.value = btn.getAttribute('data-val');
      });
    });
  }

  // Deposit Request Form
  const depositForm = document.getElementById('deposit-form');
  if (depositForm) {
    depositForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = parseFloat(depositInput.value);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid deposit amount.');
        return;
      }

      const token = localStorage.getItem('my_business_token');
      if (!token) return;

      const methodSelect = document.getElementById('deposit-method-select');
      const txnInput = document.getElementById('deposit-txn-input');
      const fileInput = document.getElementById('deposit-screenshot-input');

      if (!fileInput || !fileInput.files[0]) {
        alert("Please attach a screenshot of your payment.");
        return;
      }
      if (!methodSelect || !methodSelect.value) {
        alert("Please select a payment method.");
        return;
      }

      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('pMethodName', methodSelect.value);
      formData.append('txnId', txnInput ? txnInput.value : 'N/A');
      formData.append('notes', 'Added via Dashboard');
      formData.append('screenshot', fileInput.files[0]);

      try {
        const btn = e.target.querySelector('button[type="submit"]');
        const oldText = btn.innerText;
        btn.innerText = 'Submitting...';
        btn.disabled = true;

        const res = await fetch(`${API_URL}/wallet/deposit`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        btn.innerText = oldText;
        btn.disabled = false;

        if (res.ok) {
          alert(`Recharge request processed! Your deposit of $${formatCurrency(amount)} was submitted for review.`);
          depositInput.value = '';
          if (txnInput) txnInput.value = '';
          if (fileInput) fileInput.value = '';
          await loadState();
          window.switchTabPanel('dashboard');
        } else {
          const data = await res.json();
          alert('Error: ' + (data.error || 'Failed to submit'));
        }
      } catch (err) {
        console.error(err);
        alert('Server error connecting to backend.');
      }
    });
  }

  // Withdraw Request Form
  const withdrawForm = document.getElementById('withdraw-form');
  if (withdrawForm) {
    withdrawForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const withdrawInput = document.getElementById('withdraw-amount-input') || withdrawForm.querySelector('input[type="number"]');
      const amount = parseFloat(withdrawInput.value);

      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid withdrawal amount.');
        return;
      }

      if (amount < 10) {
        alert('Minimum withdrawal amount is $10.00.');
        return;
      }

      if (appState.balance < amount) {
        alert(`Insufficient funds. Your current withdrawable balance is $${formatCurrency(appState.balance)}.`);
        return;
      }

      const token = localStorage.getItem('my_business_token');
      if (!token) return;

      const methodSelect = document.getElementById('withdraw-method-select');
      const titleInput = document.getElementById('withdraw-title-input');
      const accountInput = document.getElementById('withdraw-account-input');

      const payload = {
        amount,
        methodName: methodSelect ? methodSelect.value : 'Bank Transfer',
        accountTitle: titleInput ? titleInput.value : 'N/A',
        accountNumber: accountInput ? accountInput.value : 'N/A',
        notes: 'Requested via UI'
      };

      try {
        const btn = e.target.querySelector('button[type="submit"]');
        const oldText = btn.innerText;
        btn.innerText = 'Submitting...';
        btn.disabled = true;

        const res = await fetch(`${API_URL}/wallet/withdraw`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        btn.innerText = oldText;
        btn.disabled = false;

        if (res.ok) {
          alert(`Withdrawal request processed. $${formatCurrency(amount)} was submitted!`);
          withdrawInput.value = '';
          if (titleInput) titleInput.value = '';
          if (accountInput) accountInput.value = '';
          methodSelect.value = '';
          await loadState();
          window.switchTabPanel('dashboard');
        } else {
          const data = await res.json();
          alert('Error: ' + (data.error || 'Submission failed'));
        }
      } catch (err) {
        console.error(err);
        alert('Server error connecting to backend.');
      }
    });
  }
}

// Open deposits log see all
window.seeAllDeposits = function () {
  const formattedLogs = appState.deposits.map(dep => ({
    col1: dep.name,
    col2: `$${formatCurrency(dep.amount)}`,
    status: dep.status,
    date: dep.date
  }));
  window.openLogsModal('Deposits Log (All)', formattedLogs);
};

// Open withdraws log see all
window.seeAllWithdraws = function () {
  const formattedLogs = appState.withdraws.map(wd => ({
    col1: `${wd.method} Payout`,
    col2: `$${formatCurrency(wd.amount)}`,
    status: wd.status,
    date: wd.date
  }));
  window.openLogsModal('Withdrawals Log (All)', formattedLogs);
};

// Auth Tab switching switcher (Login / Signup)
window.toggleAuthMode = function (mode) {
  const slider = document.getElementById('auth-form-slider');
  const glow = document.getElementById('auth-tab-glow');
  const btnLogin = document.getElementById('tab-login');
  const btnSignup = document.getElementById('tab-signup');
  const subtitle = document.getElementById('auth-subtitle');

  // Clear any existing errors
  document.getElementById('auth-error-box').classList.add('hidden');

  if (mode === 'login') {
    slider.style.transform = 'translateX(0)';
    glow.style.left = '4px';

    // Select styling Classes
    btnLogin.classList.add('text-white');
    btnLogin.classList.remove('text-slate-500');
    btnSignup.classList.add('text-slate-500');
    btnSignup.classList.remove('text-white');

    subtitle.textContent = "Login to your dashboard to manage capital operations";
  } else {
    slider.style.transform = 'translateX(-50%)';
    glow.style.left = 'calc(50% + 2px)';

    // Select styling Classes
    btnLogin.classList.add('text-slate-500');
    btnLogin.classList.remove('text-white');
    btnSignup.classList.add('text-white');
    btnSignup.classList.remove('text-slate-500');

    subtitle.textContent = "Create your new account to start investing today";
  }
};

// Password Visibility toggle switcher
window.togglePasswordVisibility = function (inputId, btn) {
  const input = document.getElementById(inputId);
  if (input) {
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈';
    } else {
      input.type = 'password';
      btn.textContent = '👁' + '️';
    }
  }
};

// Login submit handler
window.handleLogin = async function (e) {
  e.preventDefault();

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  const errorBox = document.getElementById('auth-error-box');
  const errorMsg = document.getElementById('auth-error-msg');

  errorBox.classList.add('hidden');

  const btn = e.target.querySelector('button[type="submit"]');
  const btnText = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');

  btn.setAttribute('disabled', 'true');
  btnText.textContent = "Verifying...";
  spinner.classList.remove('hidden');

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showAdvancedToast("Login Failed", data.error || data.errors[0].msg, "error");
      errorMsg.textContent = data.error || data.errors[0].msg;
      errorBox.classList.remove('hidden');
      errorBox.classList.add('animate-shake');
      setTimeout(() => errorBox.classList.remove('animate-shake'), 400);
      btn.removeAttribute('disabled');
      btnText.textContent = "Sign In";
      spinner.classList.add('hidden');
      return;
    }

    // Success
    showAdvancedToast("Welcome Back!", "Successfully logged in to your account.", "success");
    localStorage.setItem('my_business_token', data.token);

    btn.removeAttribute('disabled');
    btnText.textContent = "Sign In";
    spinner.classList.add('hidden');

    // Show dashboard immediately — no waiting
    showDashboard();

    // Load user data in background
    loadState();

  } catch (err) {
    console.error(err);
    showAdvancedToast("Server Error", "Could not connect to backend.", "error");
    btn.removeAttribute('disabled');
    btnText.textContent = "Sign In";
    spinner.classList.add('hidden');
  }
};

// Signup registration submit handler
window.handleSignup = async function (e) {
  e.preventDefault();

  const nameInput = document.getElementById('signup-name');
  const emailInput = document.getElementById('signup-email');
  const passwordInput = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('signup-confirm-password');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  const errorBox = document.getElementById('auth-error-box');
  const errorMsg = document.getElementById('auth-error-msg');

  // Helper to show inline error
  function showError(msg) {
    errorMsg.textContent = msg;
    errorBox.classList.remove('hidden');
    errorBox.classList.add('animate-shake');
    setTimeout(() => errorBox.classList.remove('animate-shake'), 400);
  }

  // Clear previous errors
  errorBox.classList.add('hidden');
  errorMsg.textContent = '';

  // --- Frontend Validation ---
  if (!name) {
    showError('Full name is required.');
    showAdvancedToast("Missing Info", "Please enter your full name.", "error");
    return;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('Please enter a valid email address.');
    showAdvancedToast("Invalid Email", "Please enter a valid email address.", "error");
    return;
  }

  if (!password || password.length < 6) {
    showError('Password must be at least 6 characters.');
    showAdvancedToast("Weak Password", "Password must be at least 6 characters.", "error");
    return;
  }

  if (password !== confirmPassword) {
    showError('Passwords do not match. Please re-enter.');
    showAdvancedToast("Passwords Mismatch", "Password and Confirm Password do not match.", "error");
    return;
  }

  const termsCheckbox = document.getElementById('signup-terms');
  if (termsCheckbox && !termsCheckbox.checked) {
    showError('You must accept the Terms of Service.');
    showAdvancedToast("Action Required", "Please accept the Terms of Service to continue.", "error");
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  const btnText = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');

  btn.setAttribute('disabled', 'true');
  btnText.textContent = "Creating Account...";
  if (spinner) spinner.classList.remove('hidden');

  try {
    console.log('[Signup] Sending request to:', `${API_URL}/auth/register`);
    console.log('[Signup] Payload:', { name, email, passwordLength: password.length });

    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    console.log('[Signup] Response status:', res.status);

    let data;
    try {
      data = await res.json();
      console.log('[Signup] Response data:', data);
    } catch (jsonErr) {
      console.error('[Signup] Failed to parse JSON response:', jsonErr);
      const rawText = await res.text().catch(() => 'No response body');
      console.error('[Signup] Raw response:', rawText);
      const errMsg = 'Server error - invalid response. Please try again.';
      showError(errMsg);
      showAdvancedToast("Server Error", errMsg, "error");
      btn.removeAttribute('disabled');
      btnText.textContent = "Register Account";
      if (spinner) spinner.classList.add('hidden');
      return;
    }

    if (!res.ok) {
      const errMsg = data.error || (data.errors && data.errors[0] && data.errors[0].msg) || `Registration failed (${res.status}). Please try again.`;
      console.error('[Signup] Registration error:', errMsg);
      showError(errMsg);
      showAdvancedToast("Registration Failed", errMsg, "error");
      btn.removeAttribute('disabled');
      btnText.textContent = "Register Account";
      if (spinner) spinner.classList.add('hidden');
      return;
    }

    if (!data.token) {
      const errMsg = 'Registration failed  no token received. Please try again.';
      console.error('[Signup] No token in response:', data);
      showError(errMsg);
      showAdvancedToast("Error", errMsg, "error");
      btn.removeAttribute('disabled');
      btnText.textContent = "Register Account";
      if (spinner) spinner.classList.add('hidden');
      return;
    }

    console.log('[Signup] Registration SUCCESS! Token received.');
    showAdvancedToast("Account Created!", "Registration successful. Entering dashboard...", "success");
    localStorage.setItem('my_business_token', data.token);

    // Clean forms
    nameInput.value = '';
    emailInput.value = '';
    passwordInput.value = '';
    confirmPasswordInput.value = '';
    if (termsCheckbox) termsCheckbox.checked = false;

    btn.removeAttribute('disabled');
    btnText.textContent = "Register Account";
    if (spinner) spinner.classList.add('hidden');

    // Show dashboard
    showDashboard();

    // Load user data in background
    loadState();

  } catch (err) {
    console.error('[Signup] Network/fetch error:', err);
    const netMsg = 'Could not connect to server. Please check your internet connection and try again.';
    showError(netMsg);
    showAdvancedToast("Connection Error", netMsg, "error");
    btn.removeAttribute('disabled');
    btnText.textContent = "Register Account";
    if (spinner) spinner.classList.add('hidden');
  }
};

// Logout session user handler
window.logoutUser = function () {
  const confirmLogout = confirm("Are you sure you want to log out of your session?");
  if (!confirmLogout) return;

  const authLayout = document.getElementById('auth-layout');
  const dashLayout = document.getElementById('dashboard-layout');

  // Transition out dashboard
  dashLayout.style.transition = 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
  dashLayout.style.opacity = '0';
  dashLayout.style.transform = 'scale(1.04)';

  setTimeout(() => {
    // Clear session
    localStorage.removeItem('my_business_token');

    dashLayout.classList.add('hidden');

    // Clean input blocks
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';

    // Hide error cards
    document.getElementById('auth-error-box').classList.add('hidden');

    // Prepare auth page
    authLayout.classList.remove('hidden');
    authLayout.style.opacity = '0';
    authLayout.style.transform = 'scale(0.96)';

    setTimeout(() => {
      authLayout.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      authLayout.style.opacity = '1';
      authLayout.style.transform = 'scale(1)';
    }, 50);

  }, 500);
};


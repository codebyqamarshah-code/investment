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
  balance: 1000.00,
  totalDeposit: 1500.00,
  totalWithdraw: 1050.00,
  totalProfit: 120.00,
  lockedEarnings: 1500.00,
  deposits: [],
  withdraws: []
};

// Update user details on both Header and Profile section in DOM
function updateDOMUserInfo(name, phone) {
  let initials = "JS";
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
  if (elHId) elHId.textContent = `ID: ${phone}`;

  // Profile Elements
  const elPInitial = document.getElementById('user-profile-initial');
  const elPName = document.getElementById('user-profile-name');
  const elPMeta = document.getElementById('user-profile-meta');
  if (elPInitial) elPInitial.textContent = initials;
  if (elPName) elPName.textContent = name;
  if (elPMeta) elPMeta.textContent = `ID: ${phone} | Member since May 2026`;

  // Referral Link
  const elRef = document.getElementById('user-referral-link');
  if (elRef) {
    elRef.innerHTML = `http://mybusiness.com/register?ref=${phone}`;
  }
}

// Load state from localStorage on startup
function loadState() {
  // Initialize users database in localStorage if not exists
  let usersStr = localStorage.getItem('my_business_users');
  let users = [];
  if (!usersStr) {
    users = [
      {
        email: "demo@example.com",
        password: "password123",
        name: "John Smith",
        phone: "03325700270",
        state: {
          balance: 1000.00,
          totalDeposit: 1500.00,
          totalWithdraw: 1050.00,
          totalProfit: 120.00,
          lockedEarnings: 1500.00,
          deposits: [
            { name: 'John Smith', amount: 500.00, status: 'Completed', date: '2 May 2026' },
            { name: 'Michael Lee', amount: 1000.00, status: 'Completed', date: '2 May 2026' },
            { name: 'David Brown', amount: 750.00, status: 'Completed', date: '1 May 2026' },
            { name: 'James Wilson', amount: 1250.00, status: 'Completed', date: '1 May 2026' },
            { name: 'Robert Taylor', amount: 650.00, status: 'Completed', date: '30 Apr 2026' }
          ],
          withdraws: [
            { amount: 200.00, method: 'Jazzcash', status: 'Completed', date: '2 May 2026' },
            { amount: 350.00, method: 'Easypaisa', status: 'Completed', date: '2 May 2026' },
            { amount: 150.00, method: 'Jazzcash', status: 'Completed', date: '1 May 2026' },
            { amount: 500.00, method: 'Bank Transfer', status: 'Completed', date: '1 May 2026' },
            { amount: 250.00, method: 'Easypaisa', status: 'Completed', date: '30 Apr 2026' }
          ]
        }
      }
    ];
    localStorage.setItem('my_business_users', JSON.stringify(users));
  } else {
    users = JSON.parse(usersStr);
  }

  // Check logged in session
  const loggedInEmail = localStorage.getItem('my_business_logged_in_user');
  if (loggedInEmail) {
    const currentUser = users.find(u => u.email === loggedInEmail);
    if (currentUser) {
      appState = currentUser.state;
      // Show dashboard, hide auth (instant, no loading delay on startup)
      document.getElementById('auth-layout').classList.add('hidden');
      const elDash = document.getElementById('dashboard-layout');
      elDash.classList.remove('hidden');
      elDash.style.opacity = '1';
      elDash.style.transform = 'scale(1)';
      
      updateDOMUserInfo(currentUser.name, currentUser.phone);
      updateUI();
      return;
    }
  }

  // Not logged in: show auth, hide dashboard
  document.getElementById('auth-layout').classList.remove('hidden');
  document.getElementById('dashboard-layout').classList.add('hidden');
  window.toggleAuthMode('signup');
}

// Save state to localStorage and update persistent users table
function saveState() {
  const loggedInEmail = localStorage.getItem('my_business_logged_in_user');
  if (loggedInEmail) {
    const users = JSON.parse(localStorage.getItem('my_business_users') || '[]');
    const userIndex = users.findIndex(u => u.email === loggedInEmail);
    if (userIndex !== -1) {
      users[userIndex].state = appState;
      localStorage.setItem('my_business_users', JSON.stringify(users));
    }
  }
  updateUI();
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

// Document Load Listener
document.addEventListener('DOMContentLoaded', () => {
  loadState();
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
  window.switchTabPanel = function(tabId) {
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
    depositForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const amount = parseFloat(depositInput.value);
      if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid deposit amount.');
        return;
      }
      
      // Perform deposit
      appState.balance += amount;
      appState.totalDeposit += amount;
      
      // Add deposit log entry
      appState.deposits.unshift({
        name: 'John Smith',
        amount: amount,
        status: 'Completed',
        date: getCurrentDateString()
      });
      
      alert(`Recharge request processed. Deposit of $${formatCurrency(amount)} was successfully credited!`);
      depositInput.value = '';
      saveState();
      window.switchTabPanel('dashboard');
    });
  }

  // Withdraw Request Form
  const withdrawForm = document.getElementById('withdraw-form');
  if (withdrawForm) {
    withdrawForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const withdrawInput = withdrawForm.querySelector('input[type="number"]');
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
      
      // Perform withdraw
      appState.balance -= amount;
      appState.totalWithdraw += amount;
      
      // Add withdrawal log entry
      appState.withdraws.unshift({
        amount: amount,
        method: 'Jazzcash',
        status: 'Completed',
        date: getCurrentDateString()
      });
      
      alert(`Withdrawal request processed. $${formatCurrency(amount)} was sent to your active account!`);
      withdrawInput.value = '';
      saveState();
      window.switchTabPanel('dashboard');
    });
  }
}

// Open deposits log see all
window.seeAllDeposits = function() {
  const formattedLogs = appState.deposits.map(dep => ({
    col1: dep.name,
    col2: `$${formatCurrency(dep.amount)}`,
    status: dep.status,
    date: dep.date
  }));
  window.openLogsModal('Deposits Log (All)', formattedLogs);
};

// Open withdraws log see all
window.seeAllWithdraws = function() {
  const formattedLogs = appState.withdraws.map(wd => ({
    col1: `${wd.method} Payout`,
    col2: `$${formatCurrency(wd.amount)}`,
    status: wd.status,
    date: wd.date
  }));
  window.openLogsModal('Withdrawals Log (All)', formattedLogs);
};

// Auth Tab switching switcher (Login / Signup)
window.toggleAuthMode = function(mode) {
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
window.togglePasswordVisibility = function(inputId, btn) {
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
window.handleLogin = function(e) {
  e.preventDefault();
  
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  
  const errorBox = document.getElementById('auth-error-box');
  const successBox = document.getElementById('auth-success-box');
  const errorMsg = document.getElementById('auth-error-msg');
  
  errorBox.classList.add('hidden');
  successBox.classList.add('hidden');
  
  // Find user details in local storage array
  const users = JSON.parse(localStorage.getItem('my_business_users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);
  
  const btn = e.target.querySelector('button[type="submit"]');
  const btnText = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  
  if (!user) {
    showAdvancedToast("Login Failed", "Invalid email or wrong password.", "error");
    errorMsg.textContent = "Invalid email or wrong password.";
    errorBox.classList.remove('hidden');
    errorBox.classList.add('animate-shake');
    setTimeout(() => {
      errorBox.classList.remove('animate-shake');
    }, 400);
    return;
  }
  
  // Show spinner
  btn.setAttribute('disabled', 'true');
  btnText.textContent = "Verifying...";
  spinner.classList.remove('hidden');
  
  setTimeout(() => {
    // Show advanced Toast for success
    showAdvancedToast("Welcome Back!", "Successfully logged in to your account.", "success");
    
    // Set active session
    localStorage.setItem('my_business_logged_in_user', email);
    appState = user.state;
    
    // Wait for Toast, then redirect to home
    setTimeout(() => {
      const authLayout = document.getElementById('auth-layout');
      const dashLayout = document.getElementById('dashboard-layout');
      
      authLayout.style.opacity = '0';
      authLayout.style.transform = 'scale(0.96)';
      
      setTimeout(() => {
        authLayout.classList.add('hidden');
        
        dashLayout.classList.remove('hidden');
        dashLayout.style.opacity = '0';
        dashLayout.style.transform = 'scale(1.04)';
        dashLayout.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        
        btn.removeAttribute('disabled');
        btnText.textContent = "Sign In";
        spinner.classList.add('hidden');
        
        updateDOMUserInfo(user.name, user.phone);
        updateUI();
        
        setTimeout(() => {
          dashLayout.style.opacity = '1';
          dashLayout.style.transform = 'scale(1)';
        }, 50);
        
      }, 600);
    }, 1500); // wait for popup duration before hiding auth
    
  }, 800);
};

// Signup registration submit handler
window.handleSignup = function(e) {
  e.preventDefault();
  
  const nameInput = document.getElementById('signup-name');
  const emailInput = document.getElementById('signup-email');
  const phoneInput = document.getElementById('signup-phone');
  const passwordInput = document.getElementById('signup-password');
  
  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;
  
  const errorBox = document.getElementById('auth-error-box');
  const successBox = document.getElementById('auth-success-box');
  const errorMsg = document.getElementById('auth-error-msg');
  const successMsg = document.getElementById('auth-success-msg');
  
  errorBox.classList.add('hidden');
  successBox.classList.add('hidden');
  
  const termsCheckbox = document.getElementById('signup-terms');
  if (termsCheckbox && !termsCheckbox.checked) {
    showAdvancedToast("Action Required", "Please accept the Terms of Service to continue.", "error");
    errorBox.classList.remove('hidden');
    errorBox.classList.add('animate-shake');
    setTimeout(() => errorBox.classList.remove('animate-shake'), 400);
    return;
  }
  
  if (password.length < 6) {
    showAdvancedToast("Registration Failed", "Password must be at least 6 characters.", "error");
    errorBox.classList.remove('hidden');
    errorBox.classList.add('animate-shake');
    setTimeout(() => errorBox.classList.remove('animate-shake'), 400);
    return;
  }
  
  const users = JSON.parse(localStorage.getItem('my_business_users') || '[]');
  
  // Check unique email
  if (users.some(u => u.email === email)) {
    showAdvancedToast("Registration Failed", "Email is already registered.", "error");
    errorBox.classList.remove('hidden');
    errorBox.classList.add('animate-shake');
    setTimeout(() => errorBox.classList.remove('animate-shake'), 400);
    return;
  }
  
  const btn = e.target.querySelector('button[type="submit"]');
  const btnText = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  
  // Disable and show spinner
  btn.setAttribute('disabled', 'true');
  btnText.textContent = "Creating Account...";
  spinner.classList.remove('hidden');
  
  setTimeout(() => {
    // Show success toast
    showAdvancedToast("Account Created!", "Registration successful. Entering dashboard...", "success");

    // Create new user state
    const newUser = {
      email: email,
      password: password,
      name: name,
      phone: phone,
      state: {
        balance: 50.00,
        totalDeposit: 50.00,
        totalWithdraw: 0.00,
        totalProfit: 0.00,
        lockedEarnings: 0.00,
        deposits: [
          { name: 'System Sign Up Bonus', amount: 50.00, status: 'Completed', date: getCurrentDateString() }
        ],
        withdraws: []
      }
    };
    
    users.push(newUser);
    localStorage.setItem('my_business_users', JSON.stringify(users));
    localStorage.setItem('my_business_logged_in_user', email);
    
    setTimeout(() => {
      // Transition
      const authLayout = document.getElementById('auth-layout');
      const dashLayout = document.getElementById('dashboard-layout');
      
      authLayout.style.opacity = '0';
      authLayout.style.transform = 'scale(0.96)';
      
      setTimeout(() => {
        authLayout.classList.add('hidden');
        
        // Clean forms
        nameInput.value = '';
        emailInput.value = '';
        phoneInput.value = '';
        passwordInput.value = '';
        
        dashLayout.classList.remove('hidden');
        dashLayout.style.opacity = '0';
        dashLayout.style.transform = 'scale(1.04)';
        dashLayout.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        
        btn.removeAttribute('disabled');
        btnText.textContent = "Register Account";
        spinner.classList.add('hidden');
        
        appState = newUser.state;
        updateDOMUserInfo(newUser.name, newUser.phone);
        updateUI();
        
        setTimeout(() => {
          dashLayout.style.opacity = '1';
          dashLayout.style.transform = 'scale(1)';
        }, 50);
        
      }, 600);
    }, 1500); // 1.5s delay to show popup then redirect
    
  }, 800);
};

// Logout session user handler
window.logoutUser = function() {
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
    localStorage.removeItem('my_business_logged_in_user');
    
    dashLayout.classList.add('hidden');
    
    // Clean input blocks
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    
    // Hide error cards
    document.getElementById('auth-error-box').classList.add('hidden');
    document.getElementById('auth-success-box').classList.add('hidden');
    
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


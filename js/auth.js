// ============================================
// Authentication Module
// Handles user registration, login, logout, and session management
// ============================================

// Get user data from browser storage (localStorage)
// If no data exists, start with empty array
const users = JSON.parse(localStorage.getItem('avocado_users')) || [];
// Get currently logged-in user from browser storage (or null if nobody logged in)
let currentUser = JSON.parse(localStorage.getItem('avocado_current_user')) || null;

// REGISTRATION 
// This function runs when user clicks "Register" button
function handleRegister(event) {
  // Prevent page from refreshing when form is submitted
  event.preventDefault();

  // Get the values that user typed in the form
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const uniEmail = document.getElementById('reg-uni-email').value;
  const password = document.getElementById('reg-password').value;
  const passwordConfirm = document.getElementById('reg-password-confirm').value;

  // Check if university email contains .edu (all university emails must have this)
  if (!uniEmail.includes('@') || !uniEmail.includes('.edu')) {
    showAlert('error', 'Please use a valid university email (must contain .edu)');
    return;
  }

  // Check if passwords match
  if (password !== passwordConfirm) {
    showAlert('error', 'Passwords do not match');
    return;
  }

  // Check if password is long enough
  if (password.length < 6) {
    showAlert('error', 'Password must be at least 6 characters');
    return;
  }

  // Send registration data to backend API
  fetch('./backend/api.php?endpoint=auth&action=register', {
    method: 'POST',  // Use POST to send data to server
    headers: {
      'Content-Type': 'application/json'  // Tell server we're sending JSON data
    },
    // Convert JavaScript object to JSON format
    body: JSON.stringify({
      name: name,
      personal_email: email,
      uni_email: uniEmail,
      password: password
    })
  })
  .then(response => response.json())  // Convert server response to JSON
  .then(data => {
    // Check if registration was successful
    if (data.message || data.user_id) {
      // Show success message to user
      showAlert('success', 'Registration successful! A verification email has been sent to ' + uniEmail);
      
      // Wait 1.5 seconds then show email verification dialog
      setTimeout(() => {
        closeRegisterModal();  // Close registration form
        openVerificationModal(data.user_id);  // Show verification form
      }, 1500);
    } else {
      // Show error message if something went wrong
      showAlert('error', data.error || 'Registration failed');
    }
  })
  // If network error or server is down, show message
  .catch(error => {
    console.error('Registration error:', error);
    showAlert('error', 'An error occurred during registration. Make sure your server is running.');
  });
}

// LOGIN  
// This function runs when user clicks "Login" button
function handleLogin(event) {
  event.preventDefault();

  // Get email and password that user typed in
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  // Send login data to backend API
  fetch('./backend/api.php?endpoint=auth&action=login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  })
  .then(response => response.json())
  .then(data => {
    // Check if login was successful
    if (data.message && data.user) {
      // Save user information locally so they stay logged in
      currentUser = {
        id: data.user.user_id,
        name: data.user.name,
        email: data.user.email,
        uni_email: data.user.uni_email,
        role: data.user.role_id,
        avatar_color: data.user.avatar_color
      };

      // Save to browser storage so user stays logged in even after refresh
      localStorage.setItem('avocado_current_user', JSON.stringify(currentUser));
      // Save authentication token for secure API requests
      localStorage.setItem('auth_token', data.token);
      
      // Welcome message
      showAlert('success', 'Welcome back, ' + currentUser.name + '!');
      
      // Close login dialog and update the page
      setTimeout(() => {
        closeLoginModal();
        updateUserUI();  // Show user's profile info on page
      }, 1000);
    } else {
      // Show error if email/password was wrong
      showAlert('error', data.error || 'Login failed');
    }
  })
  .catch(error => {
    console.error('Login error:', error);
    showAlert('error', 'An error occurred during login. Make sure your server is running.');
  });
}

// LOGOUT
// This function runs when user clicks "Logout" button
function handleLogout() {
  // Clear the current user (nobody is logged in anymore)
  currentUser = null;
  // Remove user data from browser storage
  localStorage.removeItem('avocado_current_user');
  // Close user menu if it's open
  closeUserMenu();
  // Update the page to show logged-out state
  updateUserUI();
  // Show logout message
  showAlert('success', 'You have been logged out');
}

// VERIFICATION 
function openVerificationModal(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;

  const modal = document.createElement('div');
  modal.className = 'modal active';
  modal.id = 'verification-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title">Verify Your Email</h2>
      </div>
      <p style="margin-bottom: 16px; color: #666; font-size: 14px;">
        A verification code has been sent to <strong>${user.uni_email}</strong>
      </p>
      <div class="form-group">
        <label for="verification-code">Enter Verification Code</label>
        <input type="text" id="verification-code" placeholder="6-digit code" maxlength="6">
      </div>
      <button class="btn btn-primary btn-block btn-lg" onclick="verifyEmail('${user.verification_token}')">
        Verify Email
      </button>
      <p class="text-center" style="margin-top: 16px; font-size: 12px;">
        <a href="#" onclick="resendVerificationCode('${userId}')">Didn't receive code?</a>
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  // Mock: Auto-fill token for demo
  setTimeout(() => {
    document.getElementById('verification-code').value = user.verification_token.substring(0, 6);
  }, 500);
}

function verifyEmail(token) {
  const code = document.getElementById('verification-code').value;
  
  if (code.length !== 6) {
    showAlert('error', 'Invalid code format');
    return;
  }

  // Find user by token
  const user = users.find(u => u.verification_token === token);
  if (!user) return;

  user.is_verified = true;
  localStorage.setItem('avocado_users', JSON.stringify(users));

  const modal = document.getElementById('verification-modal');
  if (modal) modal.remove();

  showAlert('success', 'Email verified! You can now sign in.');
}

function resendVerificationCode(userId) {
  const user = users.find(u => u.id === parseInt(userId));
  if (!user) return;

  user.verification_token = generateToken();
  localStorage.setItem('avocado_users', JSON.stringify(users));

  showAlert('info', 'Verification code resent to ' + user.uni_email);
}

// UI HELPERS 
function openUserMenu() {
  const modal = document.getElementById('user-menu-modal');
  const content = document.getElementById('user-menu-content');

  if (currentUser) {
    content.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div class="user-profile" style="width: 60px; height: 60px; margin: 0 auto;">
          ${currentUser.name.charAt(0).toUpperCase()}
        </div>
        <p style="margin-top: 12px; font-weight: 600;">${currentUser.name}</p>
        <p style="font-size: 12px; color: #666;">${currentUser.role}</p>
      </div>
      <a href="pages/profile.html" class="sidebar-item" style="padding: 12px 0;">
        👤 My Profile
      </a>
      <a href="pages/my-items.html" class="sidebar-item" style="padding: 12px 0;">
        📦 My Items
      </a>
      <a href="pages/my-rentals.html" class="sidebar-item" style="padding: 12px 0;">
        🔄 My Rentals
      </a>
      <a href="pages/messages.html" class="sidebar-item" style="padding: 12px 0;">
        💬 Messages
      </a>
      <a href="#" class="sidebar-item" style="padding: 12px 0;" onclick="handleLogout(); return false;">
        🚪 Sign Out
      </a>
    `;
  } else {
    content.innerHTML = `
      <button class="btn btn-primary btn-block btn-lg" onclick="openLoginModal()">
        Sign In
      </button>
      <button class="btn btn-secondary btn-block" style="margin-top: 8px; background-color: var(--color-background);" onclick="openRegisterModal()">
        Create Account
      </button>
    `;
  }

  modal.classList.add('active');
}

function closeUserMenu() {
  document.getElementById('user-menu-modal').classList.remove('active');
}

function openLoginModal() {
  closeUserMenu();
  document.getElementById('login-modal').classList.add('active');
}

function closeLoginModal() {
  document.getElementById('login-modal').classList.remove('active');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

function openRegisterModal() {
  closeUserMenu();
  closeLoginModal();
  document.getElementById('register-modal').classList.add('active');
}

function closeRegisterModal() {
  document.getElementById('register-modal').classList.remove('active');
  document.getElementById('reg-name').value = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-uni-email').value = '';
  document.getElementById('reg-password').value = '';
  document.getElementById('reg-password-confirm').value = '';
}

function switchToLogin() {
  closeRegisterModal();
  openLoginModal();
  return false;
}

function switchToRegister() {
  closeLoginModal();
  openRegisterModal();
  return false;
}

function updateUserUI() {
  const userBtn = document.getElementById('user-profile-btn');
  const userInitial = document.getElementById('user-initial');

  if (currentUser) {
    userInitial.textContent = currentUser.name.charAt(0).toUpperCase();
  } else {
    userInitial.textContent = '👤';
  }
}

// UTILITIES
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateAvatarColor() {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function showAlert(type, message) {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.style.position = 'fixed';
  alert.style.top = '20px';
  alert.style.right = '20px';
  alert.style.maxWidth = '400px';
  alert.style.zIndex = '10000';
  alert.style.animation = 'slideDown 0.3s ease-out';

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  alert.innerHTML = `
    <span>${icons[type]}</span>
    <span>${message}</span>
  `;

  document.body.appendChild(alert);

  setTimeout(() => {
    alert.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => alert.remove(), 300);
  }, 3000);
}

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', updateUserUI);

// Close modals when clicking outside
document.addEventListener('click', function(event) {
  const userMenuModal = document.getElementById('user-menu-modal');
  if (event.target === userMenuModal) {
    closeUserMenu();
  }

  const loginModal = document.getElementById('login-modal');
  if (event.target === loginModal) {
    closeLoginModal();
  }

  const registerModal = document.getElementById('register-modal');
  if (event.target === registerModal) {
    closeRegisterModal();
  }
});

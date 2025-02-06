import client from './client.js';

export async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await client.authenticate({
      strategy: 'local',
      email,
      password
    });
    
    // Hide login/register containers and show main container
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('main-container').classList.remove('hidden');
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed: ' + error.message);
  }
}

export async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    // Create the user
    await client.service('users').create({
      email,
      password
    });

    // Log them in automatically
    await client.authenticate({
      strategy: 'local',
      email,
      password
    });

    // Hide login/register containers and show main container
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('main-container').classList.remove('hidden');
  } catch (error) {
    console.error('Registration error:', error);
    alert('Registration failed: ' + error.message);
  }
}

export function checkAuth() {
  client.authenticate()
    .then(() => {
      // Already authenticated, show main container
      document.getElementById('login-container').classList.add('hidden');
      document.getElementById('register-container').classList.add('hidden');
      document.getElementById('main-container').classList.remove('hidden');
    })
    .catch(() => {
      // Not authenticated, show login container
      document.getElementById('login-container').classList.remove('hidden');
      document.getElementById('register-container').classList.add('hidden');
      document.getElementById('main-container').classList.add('hidden');
    });
}

// In auth.js
export function toggleForms() {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    
    loginContainer.classList.toggle('hidden');
    registerContainer.classList.toggle('hidden');
  }
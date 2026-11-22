/**
 * Teletalk Job SaaS - Admin Dashboard Controller & API Connector
 */

const API_BASE = window.location.origin.includes('8000') 
  ? 'http://127.0.0.1:8000/api/v1' 
  : 'http://127.0.0.1:8000/api/v1';

// Shared utility to format currency
function formatBDT(amount) {
  return '৳ ' + parseFloat(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
}

// Check local auth state
function getAuthToken() {
  return localStorage.getItem('bdjob_admin_token') || 'demo_token';
}

// Generic API fetcher with graceful mock fallback
async function fetchWithFallback(endpoint, mockData) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[Admin API] Offline or unreachable (${endpoint}), loading demo dataset:`, err);
  }
  return mockData;
}

// Modal open/close helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// Copy to clipboard helper
function copyToClipboard(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btnElement ? btnElement.innerText : '';
    if (btnElement) {
      btnElement.innerText = 'Copied!';
      setTimeout(() => { btnElement.innerText = originalText; }, 2000);
    } else {
      alert('Copied to clipboard: ' + text);
    }
  });
}

let currentAliases = {};

function showMessage(text, type = 'success') {
  const messageArea = document.getElementById('messageArea');
  messageArea.innerHTML = `<div class="message ${type}">${text}</div>`;
  setTimeout(() => {
    messageArea.innerHTML = '';
  }, 3000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

async function loadTargetEmail() {
  const response = await chrome.runtime.sendMessage({ action: 'getTargetEmail' });
  if (response.targetEmail) {
    document.getElementById('targetEmail').value = response.targetEmail;
  }
}

async function loadSettings() {
  const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
  if (response) {
    document.getElementById('compatibilityMode').checked = response.compatibilityMode || false;
    document.getElementById('aliasFormat').value = response.aliasFormat || 'standard';
  }
}

async function loadAliases() {
  const response = await chrome.runtime.sendMessage({ action: 'getAliases' });
  currentAliases = response.aliases || {};
  
  const aliasesList = document.getElementById('aliasesList');
  
  if (Object.keys(currentAliases).length === 0) {
    aliasesList.innerHTML = `
      <div class="empty-state">
        <p>No aliases created yet. Visit any website and click the @ button next to an email field to generate your first alias!</p>
      </div>
    `;
    return;
  }
  
  aliasesList.innerHTML = '';
  
  Object.entries(currentAliases).forEach(([domain, data]) => {
    const aliasItem = document.createElement('div');
    aliasItem.className = 'alias-item';
    aliasItem.innerHTML = `
      <div class="alias-info">
        <div class="alias-domain">${domain}</div>
        <div class="alias-email">${data.alias}</div>
        <div class="alias-meta">
          Created: ${formatDate(data.createdAt)} | 
          Last used: ${formatDate(data.lastUsed)}
        </div>
      </div>
      <div class="alias-actions">
        <button class="btn-secondary btn-small copy-btn" data-alias="${data.alias}">Copy</button>
        <button class="btn-danger btn-small delete-btn" data-domain="${domain}">Delete</button>
      </div>
    `;
    aliasesList.appendChild(aliasItem);
  });
  
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const alias = e.target.dataset.alias;
      try {
        await navigator.clipboard.writeText(alias);
        e.target.textContent = 'Copied!';
        setTimeout(() => {
          e.target.textContent = 'Copy';
        }, 2000);
      } catch (err) {
        showMessage('Failed to copy to clipboard', 'error');
      }
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const domain = e.target.dataset.domain;
      if (confirm(`Are you sure you want to delete the alias for ${domain}?`)) {
        const response = await chrome.runtime.sendMessage({ 
          action: 'deleteAlias', 
          domain: domain 
        });
        if (response.success) {
          showMessage('Alias deleted successfully');
          loadAliases();
        } else {
          showMessage('Failed to delete alias', 'error');
        }
      }
    });
  });
}

function exportToCSV() {
  const headers = ['Domain', 'Alias', 'Created At', 'Last Used'];
  const rows = [headers];
  
  Object.entries(currentAliases).forEach(([domain, data]) => {
    rows.push([
      domain,
      data.alias,
      formatDate(data.createdAt),
      formatDate(data.lastUsed)
    ]);
  });
  
  const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `email-aliases-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  
  URL.revokeObjectURL(url);
  showMessage('Aliases exported successfully');
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('firstInstall') === 'true') {
    document.getElementById('welcomeMessage').style.display = 'block';
  }
  
  await loadTargetEmail();
  await loadSettings();
  await loadAliases();
  
  document.getElementById('saveEmailBtn').addEventListener('click', async () => {
    const email = document.getElementById('targetEmail').value;
    
    if (!email || !email.includes('@')) {
      showMessage('Please enter a valid email address', 'error');
      return;
    }
    
    const response = await chrome.runtime.sendMessage({ 
      action: 'setTargetEmail', 
      email: email 
    });
    
    if (response.success) {
      showMessage('Target email saved successfully');
      document.getElementById('welcomeMessage').style.display = 'none';
    } else {
      showMessage('Failed to save email', 'error');
    }
  });
  
  document.getElementById('exportBtn').addEventListener('click', exportToCSV);
  
  document.getElementById('refreshBtn').addEventListener('click', () => {
    loadAliases();
    showMessage('Aliases refreshed');
  });
  
  // Compatibility settings listeners
  document.getElementById('compatibilityMode').addEventListener('change', async (e) => {
    const response = await chrome.runtime.sendMessage({ 
      action: 'setSettings', 
      compatibilityMode: e.target.checked 
    });
    
    if (response.success) {
      showMessage('Compatibility mode updated');
    } else {
      showMessage('Failed to update settings', 'error');
    }
  });
  
  document.getElementById('aliasFormat').addEventListener('change', async (e) => {
    const response = await chrome.runtime.sendMessage({ 
      action: 'setSettings', 
      aliasFormat: e.target.value 
    });
    
    if (response.success) {
      showMessage('Default alias format updated');
    } else {
      showMessage('Failed to update settings', 'error');
    }
  });
});
document.addEventListener('DOMContentLoaded', async () => {
  const contentDiv = document.getElementById('content');
  const settingsLink = document.getElementById('settingsLink');
  
  settingsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
  
  try {
    const targetEmailResponse = await chrome.runtime.sendMessage({ action: 'getTargetEmail' });
    
    if (!targetEmailResponse.targetEmail) {
      contentDiv.innerHTML = `
        <div class="no-target">
          <p>Welcome! Please set up your target email address to start using DataVault.</p>
          <button class="setup-btn" id="setupBtn">Set Up Now</button>
        </div>
      `;
      
      document.getElementById('setupBtn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
      });
      return;
    }
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const domain = new URL(tab.url).hostname;
    
    const aliasResponse = await chrome.runtime.sendMessage({ 
      action: 'getAlias', 
      domain: domain 
    });
    
    const aliasesResponse = await chrome.runtime.sendMessage({ action: 'getAliases' });
    const aliases = aliasesResponse.aliases || {};
    const aliasCount = Object.keys(aliases).length;
    
    const settingsResponse = await chrome.runtime.sendMessage({ action: 'getSettings' });
    const { compatibilityMode, aliasFormat } = settingsResponse;
    
    let siteSection = '';
    if (aliasResponse.alias) {
      siteSection = `
        <div class="current-site">
          <h2>Current Site</h2>
          <div class="site-info">
            <div>${domain}</div>
            <div class="alias-display">
              <span class="alias-text">${aliasResponse.alias}</span>
              <button class="copy-btn" data-alias="${aliasResponse.alias}">Copy</button>
            </div>
          </div>
        </div>
      `;
    } else {
      siteSection = `
        <div class="current-site">
          <h2>Current Site</h2>
          <div class="site-info">
            <div>${domain}</div>
            <div style="color: #666; font-size: 13px; margin-top: 8px;">
              No alias yet. Click the @ button on any email field to generate one.
            </div>
          </div>
        </div>
      `;
    }
    
    const formatLabels = {
      'standard': 'Standard (+)',
      'dots': 'Dots (.)',
      'clean': 'Clean'
    };
    
    contentDiv.innerHTML = `
      <div class="status active">
        ✓ Active - Target: ${targetEmailResponse.targetEmail}
      </div>
      ${siteSection}
      <div style="margin: 16px 0; padding: 12px; background-color: #f5f5f5; border-radius: 8px;">
        <div style="font-size: 13px; color: #666; margin-bottom: 8px;">
          Alias Format: <strong>${formatLabels[aliasFormat]}</strong>
        </div>
        <label style="display: flex; align-items: center; font-size: 13px; cursor: pointer;">
          <input type="checkbox" id="compatToggle" ${compatibilityMode ? 'checked' : ''} style="margin-right: 6px;">
          Compatibility Mode ${compatibilityMode ? '(On)' : '(Off)'}
        </label>
      </div>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${aliasCount}</div>
          <div class="stat-label">Total Aliases</div>
        </div>
      </div>
    `;
    
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
          console.error('Failed to copy:', err);
        }
      });
    });
    
    // Add compatibility toggle listener
    const compatToggle = document.getElementById('compatToggle');
    if (compatToggle) {
      compatToggle.addEventListener('change', async (e) => {
        await chrome.runtime.sendMessage({ 
          action: 'setSettings', 
          compatibilityMode: e.target.checked 
        });
        // Reload to show updated state
        window.location.reload();
      });
    }
    
  } catch (error) {
    contentDiv.innerHTML = `
      <div class="status inactive">
        Error: ${error.message}
      </div>
    `;
  }
});
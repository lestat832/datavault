let processedFields = new WeakSet();

function findEmailFields() {
  const selectors = [
    'input[type="email"]',
    'input[name*="email" i]',
    'input[id*="email" i]',
    'input[placeholder*="email" i]',
    'input[autocomplete="email"]'
  ];
  
  const fields = document.querySelectorAll(selectors.join(', '));
  return Array.from(fields).filter(field => !processedFields.has(field));
}

function createAliasButton() {
  const button = document.createElement('div');
  button.className = 'email-alias-button';
  button.innerHTML = '@ Generate Alias';
  button.title = 'Click to generate email alias';
  return button;
}

function createRegenerateButton() {
  const button = document.createElement('div');
  button.className = 'email-alias-regenerate';
  button.innerHTML = '↻ Try Different Format';
  button.title = 'Generate alias without special characters';
  return button;
}

function insertAliasButton(field) {
  if (processedFields.has(field)) return;
  
  processedFields.add(field);
  
  const button = createAliasButton();
  
  field.style.position = 'relative';
  field.parentElement.style.position = 'relative';
  
  let currentFormat = null;
  const formatSequence = ['standard', 'dots', 'clean'];
  
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const response = await chrome.runtime.sendMessage({
      action: 'generateAlias',
      domain: window.location.hostname,
      format: currentFormat
    });
    
    if (response.alias) {
      field.value = response.alias;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      
      button.innerHTML = '✓ Alias Generated';
      button.classList.add('success');
      
      // Show regenerate button if standard format was used
      if (response.format === 'standard') {
        const regenerateBtn = createRegenerateButton();
        regenerateBtn.style.top = button.style.top;
        regenerateBtn.style.left = `${parseInt(button.style.left) + button.offsetWidth + 5}px`;
        
        regenerateBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Cycle through formats
          const currentIndex = formatSequence.indexOf(currentFormat || 'standard');
          currentFormat = formatSequence[(currentIndex + 1) % formatSequence.length];
          
          const newResponse = await chrome.runtime.sendMessage({
            action: 'generateAlias',
            domain: window.location.hostname,
            format: currentFormat
          });
          
          if (newResponse.alias) {
            field.value = newResponse.alias;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Update tooltip to show current format
            regenerateBtn.title = `Current format: ${currentFormat}. Click for next format.`;
          }
        });
        
        field.parentElement.appendChild(regenerateBtn);
        
        setTimeout(() => {
          regenerateBtn.remove();
        }, 10000);
      }
      
      setTimeout(() => {
        button.innerHTML = '@ Generate Alias';
        button.classList.remove('success');
      }, 3000);
    }
  });
  
  field.parentElement.appendChild(button);
  
  const rect = field.getBoundingClientRect();
  const parentRect = field.parentElement.getBoundingClientRect();
  
  button.style.top = `${rect.top - parentRect.top + (rect.height - button.offsetHeight) / 2}px`;
  button.style.left = `${rect.right - parentRect.left + 5}px`;
}

async function checkForSavedAlias() {
  const domain = window.location.hostname;
  const response = await chrome.runtime.sendMessage({
    action: 'getAlias',
    domain: domain
  });
  
  if (response.alias) {
    const emailFields = findEmailFields();
    emailFields.forEach(field => {
      if (!field.value) {
        field.value = response.alias;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        
        const indicator = document.createElement('div');
        indicator.className = 'email-alias-indicator';
        indicator.innerHTML = '✓ Alias auto-filled';
        field.parentElement.appendChild(indicator);
        
        setTimeout(() => {
          indicator.remove();
        }, 3000);
      }
    });
  }
}

function init() {
  const emailFields = findEmailFields();
  emailFields.forEach(insertAliasButton);
  
  checkForSavedAlias();
}

init();

const observer = new MutationObserver(() => {
  const newFields = findEmailFields();
  newFields.forEach(insertAliasButton);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkForAliasFields') {
    const fields = findEmailFields();
    sendResponse({ hasFields: fields.length > 0 });
  }
});
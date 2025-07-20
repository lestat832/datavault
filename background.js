const STORAGE_KEYS = {
  TARGET_EMAIL: 'targetEmail',
  ALIASES: 'aliases',
  FIRST_INSTALL: 'firstInstall',
  COMPATIBILITY_MODE: 'compatibilityMode',
  ALIAS_FORMAT: 'aliasFormat',
  SITE_FORMATS: 'siteFormats'
};

const ALIAS_FORMATS = {
  STANDARD: 'standard',    // user+site-random@domain.com
  DOTS: 'dots',           // user.site.random@domain.com  
  CLEAN: 'clean'          // usersiterandom@domain.com
};

chrome.runtime.onInstalled.addListener(async () => {
  const { firstInstall } = await chrome.storage.local.get(STORAGE_KEYS.FIRST_INSTALL);
  
  if (!firstInstall) {
    chrome.storage.local.set({ 
      [STORAGE_KEYS.FIRST_INSTALL]: true,
      [STORAGE_KEYS.ALIASES]: {},
      [STORAGE_KEYS.COMPATIBILITY_MODE]: false,
      [STORAGE_KEYS.ALIAS_FORMAT]: ALIAS_FORMATS.STANDARD,
      [STORAGE_KEYS.SITE_FORMATS]: {}
    });
    
    chrome.tabs.create({ url: 'options.html?firstInstall=true' });
  }
});

function generateRandomString(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function cleanDomainName(domain) {
  return domain
    .replace(/^www\./, '')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]/gi, '');
}

async function generateAlias(domain, format = null) {
  const { targetEmail, aliasFormat, siteFormats, compatibilityMode } = await chrome.storage.local.get([
    STORAGE_KEYS.TARGET_EMAIL,
    STORAGE_KEYS.ALIAS_FORMAT,
    STORAGE_KEYS.SITE_FORMATS,
    STORAGE_KEYS.COMPATIBILITY_MODE
  ]);
  
  if (!targetEmail) {
    throw new Error('Target email not set');
  }
  
  // Determine which format to use
  let useFormat = format;
  if (!useFormat) {
    // Check if we have a saved format for this site
    if (siteFormats && siteFormats[domain]) {
      useFormat = siteFormats[domain];
    } else if (compatibilityMode) {
      useFormat = ALIAS_FORMATS.DOTS;
    } else {
      useFormat = aliasFormat || ALIAS_FORMATS.STANDARD;
    }
  }
  
  const cleanDomain = cleanDomainName(domain);
  const randomString = generateRandomString(6);
  const emailParts = targetEmail.split('@');
  const baseEmail = emailParts[0];
  const emailDomain = emailParts[1];
  
  let alias;
  switch (useFormat) {
    case ALIAS_FORMATS.DOTS:
      alias = `${baseEmail}.${cleanDomain}.${randomString}@${emailDomain}`;
      break;
    case ALIAS_FORMATS.CLEAN:
      alias = `${baseEmail}${cleanDomain}${randomString}@${emailDomain}`;
      break;
    case ALIAS_FORMATS.STANDARD:
    default:
      alias = `${baseEmail}+${cleanDomain}-${randomString}@${emailDomain}`;
      break;
  }
  
  return { alias, format: useFormat };
}

async function saveAlias(domain, alias) {
  const { aliases } = await chrome.storage.local.get(STORAGE_KEYS.ALIASES);
  const updatedAliases = { ...aliases };
  
  updatedAliases[domain] = {
    alias: alias,
    createdAt: new Date().toISOString(),
    lastUsed: new Date().toISOString()
  };
  
  await chrome.storage.local.set({ [STORAGE_KEYS.ALIASES]: updatedAliases });
}

async function getAliasForDomain(domain) {
  const { aliases } = await chrome.storage.local.get(STORAGE_KEYS.ALIASES);
  
  if (aliases && aliases[domain]) {
    aliases[domain].lastUsed = new Date().toISOString();
    await chrome.storage.local.set({ [STORAGE_KEYS.ALIASES]: aliases });
    return aliases[domain].alias;
  }
  
  return null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'generateAlias') {
    (async () => {
      try {
        const { targetEmail } = await chrome.storage.local.get(STORAGE_KEYS.TARGET_EMAIL);
        
        if (!targetEmail) {
          sendResponse({ error: 'Please set your target email in the extension settings' });
          return;
        }
        
        const result = await generateAlias(request.domain, request.format);
        await saveAlias(request.domain, result.alias);
        
        // Save the format that worked for this site
        if (request.format) {
          const { siteFormats } = await chrome.storage.local.get(STORAGE_KEYS.SITE_FORMATS);
          const updatedFormats = { ...siteFormats };
          updatedFormats[request.domain] = request.format;
          await chrome.storage.local.set({ [STORAGE_KEYS.SITE_FORMATS]: updatedFormats });
        }
        
        sendResponse({ alias: result.alias, format: result.format });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }
  
  if (request.action === 'getAlias') {
    (async () => {
      try {
        const alias = await getAliasForDomain(request.domain);
        sendResponse({ alias });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }
  
  if (request.action === 'getAliases') {
    (async () => {
      try {
        const { aliases } = await chrome.storage.local.get(STORAGE_KEYS.ALIASES);
        sendResponse({ aliases: aliases || {} });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }
  
  if (request.action === 'deleteAlias') {
    (async () => {
      try {
        const { aliases } = await chrome.storage.local.get(STORAGE_KEYS.ALIASES);
        const updatedAliases = { ...aliases };
        delete updatedAliases[request.domain];
        await chrome.storage.local.set({ [STORAGE_KEYS.ALIASES]: updatedAliases });
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }
  
  if (request.action === 'getTargetEmail') {
    (async () => {
      try {
        const { targetEmail } = await chrome.storage.local.get(STORAGE_KEYS.TARGET_EMAIL);
        sendResponse({ targetEmail });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }
  
  if (request.action === 'setTargetEmail') {
    (async () => {
      try {
        await chrome.storage.local.set({ [STORAGE_KEYS.TARGET_EMAIL]: request.email });
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }
  
  if (request.action === 'getSettings') {
    (async () => {
      try {
        const settings = await chrome.storage.local.get([
          STORAGE_KEYS.COMPATIBILITY_MODE,
          STORAGE_KEYS.ALIAS_FORMAT
        ]);
        sendResponse({ 
          compatibilityMode: settings.compatibilityMode || false,
          aliasFormat: settings.aliasFormat || ALIAS_FORMATS.STANDARD
        });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }
  
  if (request.action === 'setSettings') {
    (async () => {
      try {
        const updates = {};
        if (request.compatibilityMode !== undefined) {
          updates[STORAGE_KEYS.COMPATIBILITY_MODE] = request.compatibilityMode;
        }
        if (request.aliasFormat !== undefined) {
          updates[STORAGE_KEYS.ALIAS_FORMAT] = request.aliasFormat;
        }
        await chrome.storage.local.set(updates);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }
});
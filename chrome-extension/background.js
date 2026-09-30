// ERP PassVault Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  console.log('ERP PassVault Extension installed successfully!');
  // Initialize default passwords if none exist
  chrome.storage.local.get(['erp_passwords'], (res) => {
    if (!res.erp_passwords || !Array.isArray(res.erp_passwords) || res.erp_passwords.length === 0) {
      const DEFAULT_ITEMS = [
        {
          id: 'pw_001',
          code: 'MK-001',
          title: 'Google Workspace Công ty',
          category: 'email',
          url: 'https://mail.google.com',
          username: 'admin@congty-h161.com.vn',
          password: 'Gg#Workspace$2026!Secure',
          pinOr2FA: '2FA kích hoạt qua Google Authenticator',
          tags: ['Công việc', 'Admin'],
          securityScore: 95,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pw_002',
          code: 'MK-002',
          title: 'Hệ thống Quản trị ERP Doanh Nghiệp',
          category: 'work',
          url: 'https://erp.h161.internal',
          username: 'admin.leminhcong',
          password: 'Erp@Pro2026#SuperMaster',
          pinOr2FA: 'PIN: 987654',
          tags: ['ERP', 'Tổng Giám Đốc'],
          securityScore: 100,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pw_003',
          code: 'MK-003',
          title: 'Máy chủ Cloud Production VPS (HCM)',
          category: 'server',
          url: 'https://cloud.digitalocean.com',
          username: 'root@103.142.25.188',
          password: 'VpS#Root!H161$Tech2026',
          tags: ['Server', 'DevOps'],
          securityScore: 90,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pw_004',
          code: 'MK-004',
          title: 'Tài khoản Ngân hàng VCB Corporate',
          category: 'finance',
          url: 'https://vcbdigibiz.vietcombank.com.vn',
          username: 'VCB_H161_CORP',
          password: 'Vcb#Enterprise@999!',
          tags: ['Tài chính', 'Ngân hàng'],
          securityScore: 95,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pw_005',
          code: 'MK-005',
          title: 'Fanpage & Facebook Business Manager',
          category: 'social',
          url: 'https://business.facebook.com',
          username: 'marketing.h161@gmail.com',
          password: 'Fb#Marketing2026@Meta',
          tags: ['Marketing'],
          securityScore: 85,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pw_006',
          code: 'MK-006',
          title: 'Tài khoản GitHub Enterprise',
          category: 'software',
          url: 'https://github.com/h161-corp',
          username: 'techlead-h161',
          password: 'Git#SecureDeploy!2026$',
          tags: ['Tech'],
          securityScore: 90,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      chrome.storage.local.set({ erp_passwords: DEFAULT_ITEMS });
    }
  });
});

// Update badge count for active tab based on matching domain
async function updateTabBadge(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('edge://')) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  try {
    const domain = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    chrome.storage.local.get(['erp_passwords'], (res) => {
      const items = res.erp_passwords || [];
      const matches = items.filter((item) => {
        if (!item.url) return false;
        try {
          const itemDomain = new URL(item.url.startsWith('http') ? item.url : 'https://' + item.url).hostname.replace(/^www\./, '').toLowerCase();
          return domain.includes(itemDomain) || itemDomain.includes(domain);
        } catch {
          return item.url.toLowerCase().includes(domain);
        }
      });

      if (matches.length > 0) {
        chrome.action.setBadgeText({ tabId, text: String(matches.length) });
        chrome.action.setBadgeBackgroundColor({ tabId, color: '#3b82f6' });
      } else {
        chrome.action.setBadgeText({ tabId, text: '' });
      }
    });
  } catch (err) {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

// Tab listeners for badge updating
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && tab.url) {
      updateTabBadge(activeInfo.tabId, tab.url);
    }
  } catch {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab && tab.url) {
    updateTabBadge(tabId, tab.url);
  }
});

// Listen to messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ status: 'ok' });
    return true;
  }

  // Get all passwords
  if (request.action === 'GET_PASSWORDS') {
    chrome.storage.local.get(['erp_passwords'], (res) => {
      sendResponse({ passwords: res.erp_passwords || [] });
    });
    return true;
  }

  // Get matching passwords for domain/URL
  if (request.action === 'GET_MATCHING_PASSWORDS') {
    const domain = (request.domain || '').toLowerCase();
    chrome.storage.local.get(['erp_passwords'], (res) => {
      const all = res.erp_passwords || [];
      const matches = all.filter((item) => {
        if (!domain) return false;
        if (!item.url) return false;
        try {
          const itemDomain = new URL(item.url.startsWith('http') ? item.url : 'https://' + item.url).hostname.replace(/^www\./, '').toLowerCase();
          return domain.includes(itemDomain) || itemDomain.includes(domain);
        } catch {
          return (item.url || '').toLowerCase().includes(domain);
        }
      });
      sendResponse({ matches });
    });
    return true;
  }

  // Save / Update credential from content script or popup
  if (request.action === 'SAVE_PASSWORD') {
    const { payload } = request;
    if (!payload || !payload.password) {
      sendResponse({ success: false, error: 'Thiếu mật khẩu' });
      return true;
    }

    chrome.storage.local.get(['erp_passwords'], (res) => {
      const items = res.erp_passwords || [];
      const now = new Date().toISOString();

      // Check if item exists with same username and domain
      const targetDomain = payload.domain || (payload.url ? new URL(payload.url.startsWith('http') ? payload.url : 'https://' + payload.url).hostname.replace(/^www\./, '').toLowerCase() : '');
      
      let existingIndex = -1;
      if (payload.id) {
        existingIndex = items.findIndex((i) => i.id === payload.id);
      } else if (targetDomain && payload.username) {
        existingIndex = items.findIndex((i) => {
          if ((i.username || '').toLowerCase() !== (payload.username || '').toLowerCase()) return false;
          if (!i.url) return false;
          try {
            const iDomain = new URL(i.url.startsWith('http') ? i.url : 'https://' + i.url).hostname.replace(/^www\./, '').toLowerCase();
            return iDomain.includes(targetDomain) || targetDomain.includes(iDomain);
          } catch {
            return (i.url || '').toLowerCase().includes(targetDomain);
          }
        });
      }

      let savedItem;
      if (existingIndex >= 0) {
        // Update existing
        savedItem = {
          ...items[existingIndex],
          ...payload,
          password: payload.password,
          updatedAt: now,
        };
        items[existingIndex] = savedItem;
      } else {
        // Create new item
        const nextCodeNum = items.length + 1;
        const code = `MK-${String(nextCodeNum).padStart(3, '0')}`;
        savedItem = {
          id: payload.id || `pw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          code,
          title: payload.title || payload.domain || 'Tài khoản Website',
          category: payload.category || 'web',
          url: payload.url || (payload.domain ? `https://${payload.domain}` : ''),
          username: payload.username || '',
          password: payload.password,
          pinOr2FA: payload.pinOr2FA || '',
          note: payload.note || 'Tự động lưu từ trình duyệt',
          tags: payload.tags || ['Tự động lưu'],
          securityScore: payload.securityScore || 85,
          createdAt: now,
          updatedAt: now,
        };
        items.unshift(savedItem);
      }

      chrome.storage.local.set({ erp_passwords: items }, () => {
        if (sender.tab && sender.tab.id && sender.tab.url) {
          updateTabBadge(sender.tab.id, sender.tab.url);
        }
        sendResponse({ success: true, item: savedItem });
      });
    });
    return true;
  }

  // Delete credential
  if (request.action === 'DELETE_PASSWORD') {
    const { id } = request;
    chrome.storage.local.get(['erp_passwords'], (res) => {
      const items = (res.erp_passwords || []).filter((i) => i.id !== id);
      chrome.storage.local.set({ erp_passwords: items }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  return true;
});

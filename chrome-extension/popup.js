// ERP PassVault Popup Script

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
  },
];

let allPasswords = [];
let activeTabDomain = '';
let activeTabUrl = '';
let activeTabTitle = '';
let currentCategory = 'all';
let currentSearch = '';
let showDomainOnly = false;
let revealedIds = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initGenerator();
  initSync();
  initAccountModal();
  await detectActiveTab();
  await loadPasswords();
  renderPasswordList();

  // Search input
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('btn-clear-search');
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase().trim();
    clearBtn.classList.toggle('hidden', !currentSearch);
    renderPasswordList();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearch = '';
    clearBtn.classList.add('hidden');
    renderPasswordList();
  });

  // Category pills
  document.querySelectorAll('.cat-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      currentCategory = pill.dataset.cat;
      showDomainOnly = false;
      renderPasswordList();
    });
  });

  // Open ERP Web button
  document.getElementById('btn-open-erp').addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:5173/mat-khau' });
  });

  // Lock button
  document.getElementById('btn-lock-vault').addEventListener('click', () => {
    revealedIds.clear();
    renderPasswordList();
    showToast('🔒 Đã khóa bảo vệ và ẩn tất cả mật khẩu');
  });

  // Filter Domain Only Button
  document.getElementById('btn-show-domain-only')?.addEventListener('click', () => {
    showDomainOnly = !showDomainOnly;
    const btn = document.getElementById('btn-show-domain-only');
    btn.textContent = showDomainOnly ? 'Xem tất cả' : 'Khớp trang';
    renderPasswordList();
  });

  // Quick Add for Current Domain
  document.getElementById('btn-add-for-domain')?.addEventListener('click', () => {
    openAccountModal({
      title: activeTabTitle || activeTabDomain,
      url: activeTabUrl,
      category: 'web',
      username: '',
      password: '',
    });
  });

  // Quick Add Header Button
  document.getElementById('btn-quick-add')?.addEventListener('click', () => {
    openAccountModal({
      title: activeTabTitle || (activeTabDomain ? `Tài khoản ${activeTabDomain}` : ''),
      url: activeTabUrl || '',
      category: 'web',
      username: '',
      password: '',
    });
  });
});

// Detect current browser tab URL and domain
async function detectActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs[0] && tabs[0].url) {
      activeTabUrl = tabs[0].url;
      activeTabTitle = tabs[0].title || '';
      try {
        const parsed = new URL(activeTabUrl);
        activeTabDomain = parsed.hostname.replace(/^www\./, '');
        const domainBox = document.getElementById('domain-match-box');
        const domainLabel = document.getElementById('active-tab-domain');
        if (domainBox && domainLabel && activeTabDomain && !activeTabUrl.startsWith('chrome://') && !activeTabUrl.startsWith('edge://')) {
          domainLabel.textContent = activeTabDomain;
          domainBox.classList.remove('hidden');
        }
      } catch {}
    }
  } catch (e) {
    console.warn('Could not query active tab:', e);
  }
}

// Storage helpers
async function loadPasswords() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['erp_passwords', 'erp_last_sync'], (res) => {
        if (res.erp_passwords && Array.isArray(res.erp_passwords) && res.erp_passwords.length > 0) {
          allPasswords = res.erp_passwords;
        } else {
          allPasswords = DEFAULT_ITEMS;
          chrome.storage.local.set({ erp_passwords: DEFAULT_ITEMS });
        }
        if (res.erp_last_sync) {
          const syncBadge = document.getElementById('sync-time-badge');
          if (syncBadge) syncBadge.textContent = 'Đã sync: ' + res.erp_last_sync;
        }
        updateCountBadge();
        resolve();
      });
    } else {
      allPasswords = DEFAULT_ITEMS;
      updateCountBadge();
      resolve();
    }
  });
}

function updateCountBadge() {
  const badge = document.getElementById('vault-count-badge');
  if (badge) badge.textContent = `${allPasswords.length} tài khoản`;
}

// Render list
function renderPasswordList() {
  const container = document.getElementById('password-list-container');
  if (!container) return;

  let items = [...allPasswords];

  // Domain matching check
  const isDomainMatching = (item) => {
    if (!activeTabDomain || !item.url) return false;
    try {
      const itemDomain = new URL(item.url.startsWith('http') ? item.url : 'https://' + item.url).hostname.replace(/^www\./, '').toLowerCase();
      return activeTabDomain.includes(itemDomain) || itemDomain.includes(activeTabDomain);
    } catch {
      return (item.url || '').toLowerCase().includes(activeTabDomain);
    }
  };

  // Domain matching sort priority
  if (activeTabDomain) {
    items.sort((a, b) => {
      const aMatch = isDomainMatching(a);
      const bMatch = isDomainMatching(b);
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  // Filter by domain only
  if (showDomainOnly && activeTabDomain) {
    items = items.filter((item) => isDomainMatching(item));
  }

  // Category filter
  if (currentCategory !== 'all') {
    items = items.filter((i) => i.category === currentCategory);
  }

  // Search query filter
  if (currentSearch) {
    items = items.filter((i) => {
      const t = (i.title || '').toLowerCase();
      const u = (i.username || '').toLowerCase();
      const url = (i.url || '').toLowerCase();
      const code = (i.code || '').toLowerCase();
      return t.includes(currentSearch) || u.includes(currentSearch) || url.includes(currentSearch) || code.includes(currentSearch);
    });
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 36px 12px; color: var(--text-muted); font-size: 12px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 8px; opacity: 0.5;">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        Không tìm thấy tài khoản nào phù hợp.
      </div>
    `;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const isRevealed = revealedIds.has(item.id);
      const isMatch = isDomainMatching(item);

      return `
        <div class="vault-item-card" data-id="${item.id}" style="${isMatch ? 'border-color: #3b82f6; background: rgba(59,130,246,0.09);' : ''}">
          <div class="vault-item-top">
            <div class="item-title-row">
              <span class="item-title">${escapeHtml(item.title)}</span>
              ${isMatch ? '<span class="match-badge">★ Khớp trang</span>' : ''}
            </div>
            <span class="cat-tag">${escapeHtml(getCategoryName(item.category))}</span>
          </div>

          <div class="item-creds">
            <div class="cred-row">
              <span class="cred-label">User:</span>
              <span class="cred-val" title="${escapeHtml(item.username)}">${escapeHtml(item.username)}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Pass:</span>
              <span class="cred-val font-mono">${isRevealed ? escapeHtml(item.password) : '••••••••••••'}</span>
            </div>
            ${item.pinOr2FA ? `
              <div class="cred-row">
                <span class="cred-label">2FA/PIN:</span>
                <span class="cred-val" style="color: #f59e0b;">${escapeHtml(item.pinOr2FA)}</span>
              </div>
            ` : ''}
          </div>

          <div class="card-actions">
            <div style="display: flex; gap: 4px; align-items: center;">
              <button class="mini-btn btn-copy-user" data-val="${escapeHtml(item.username)}" title="Sao chép tên đăng nhập">
                Copy User
              </button>
              <button class="mini-btn btn-copy-pass" data-val="${escapeHtml(item.password)}" title="Sao chép mật khẩu">
                Copy Pass
              </button>
              <button class="mini-btn btn-toggle-pass" data-id="${item.id}" title="${isRevealed ? 'Ẩn' : 'Hiện'} mật khẩu">
                ${isRevealed ? 'Ẩn' : 'Hiện'}
              </button>
              <button class="mini-btn btn-edit-item" data-id="${item.id}" title="Chỉnh sửa tài khoản">
                ✏️
              </button>
              <button class="mini-btn btn-delete-item" data-id="${item.id}" title="Xóa tài khoản">
                🗑️
              </button>
            </div>
            <button class="mini-btn btn-autofill" data-user="${escapeHtml(item.username)}" data-pass="${escapeHtml(item.password)}" title="Tự động điền vào trang này">
              ⚡ Điền ngay
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  attachItemEvents();
}

function attachItemEvents() {
  // Copy Username
  document.querySelectorAll('.btn-copy-user').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(btn.dataset.val, 'Đã chép Tên đăng nhập');
    });
  });

  // Copy Password
  document.querySelectorAll('.btn-copy-pass').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      copyToClipboard(btn.dataset.val, 'Đã chép Mật khẩu');
    });
  });

  // Toggle reveal
  document.querySelectorAll('.btn-toggle-pass').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      if (revealedIds.has(id)) {
        revealedIds.delete(id);
      } else {
        revealedIds.add(id);
      }
      renderPasswordList();
    });
  });

  // Edit item
  document.querySelectorAll('.btn-edit-item').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const target = allPasswords.find((p) => p.id === id);
      if (target) {
        openAccountModal(target);
      }
    });
  });

  // Delete item
  document.querySelectorAll('.btn-delete-item').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const target = allPasswords.find((p) => p.id === id);
      if (target && confirm(`Bạn có chắc chắn muốn xóa tài khoản "${target.title}"?`)) {
        allPasswords = allPasswords.filter((p) => p.id !== id);
        chrome.storage.local.set({ erp_passwords: allPasswords }, () => {
          updateCountBadge();
          renderPasswordList();
          showToast('🗑️ Đã xóa tài khoản khỏi Vault');
        });
      }
    });
  });

  // Auto fill
  document.querySelectorAll('.btn-autofill').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const user = btn.dataset.user;
      const pass = btn.dataset.pass;
      await triggerAutoFill(user, pass);
    });
  });
}

// Trigger Autofill via content script
async function triggerAutoFill(username, password) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      showToast('❌ Không tìm thấy tab trình duyệt đang mở');
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: 'AUTO_FILL', username, password },
      (response) => {
        if (chrome.runtime.lastError) {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              files: ['content.js'],
            },
            () => {
              chrome.tabs.sendMessage(tab.id, { action: 'AUTO_FILL', username, password });
              showToast('⚡ Đã gửi lệnh điền tự động!');
            }
          );
        } else {
          showToast('⚡ Đã tự động điền thông tin đăng nhập!');
        }
      }
    );
  } catch (err) {
    console.error('Autofill error:', err);
    showToast('⚠️ Không thể điền vào trang này');
  }
}

// Quick Add / Edit Account Modal
function initAccountModal() {
  const modal = document.getElementById('account-form-modal');
  const closeBtn = document.getElementById('btn-modal-close');
  const cancelBtn = document.getElementById('btn-modal-cancel');
  const form = document.getElementById('vault-account-form');
  const genPassBtn = document.getElementById('btn-form-gen-pass');
  const togglePassBtn = document.getElementById('btn-form-toggle-pass');
  const passInput = document.getElementById('form-password');

  const closeModal = () => modal.classList.add('hidden');

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  genPassBtn.addEventListener('click', () => {
    const generated = generatePasswordString(16, true, true, true, true, false);
    passInput.value = generated;
    passInput.type = 'text';
    showToast('✨ Đã tạo mật khẩu mạnh!');
  });

  togglePassBtn.addEventListener('click', () => {
    passInput.type = passInput.type === 'password' ? 'text' : 'password';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('form-item-id').value;
    const title = document.getElementById('form-title').value.trim();
    const url = document.getElementById('form-url').value.trim();
    const category = document.getElementById('form-category').value;
    const username = document.getElementById('form-username').value.trim();
    const password = document.getElementById('form-password').value;
    const pinOr2FA = document.getElementById('form-pin').value.trim();

    if (!title || !username || !password) {
      showToast('⚠️ Vui lòng điền đủ các trường bắt buộc');
      return;
    }

    const now = new Date().toISOString();

    if (id) {
      // Edit existing
      allPasswords = allPasswords.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            title,
            url,
            category,
            username,
            password,
            pinOr2FA,
            updatedAt: now,
          };
        }
        return item;
      });
      showToast('✅ Đã cập nhật tài khoản thành công!');
    } else {
      // Add new
      const nextNum = allPasswords.length + 1;
      const newItem = {
        id: `pw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        code: `MK-${String(nextNum).padStart(3, '0')}`,
        title,
        url,
        category,
        username,
        password,
        pinOr2FA,
        tags: ['Thủ công'],
        securityScore: 90,
        createdAt: now,
        updatedAt: now,
      };
      allPasswords.unshift(newItem);
      showToast('✅ Đã thêm tài khoản mới vào Vault!');
    }

    chrome.storage.local.set({ erp_passwords: allPasswords }, () => {
      updateCountBadge();
      renderPasswordList();
      closeModal();
    });
  });
}

function openAccountModal(item = null) {
  const modal = document.getElementById('account-form-modal');
  const modalTitle = document.getElementById('modal-form-title');
  const idInput = document.getElementById('form-item-id');
  const titleInput = document.getElementById('form-title');
  const urlInput = document.getElementById('form-url');
  const catInput = document.getElementById('form-category');
  const userInput = document.getElementById('form-username');
  const passInput = document.getElementById('form-password');
  const pinInput = document.getElementById('form-pin');

  if (item && item.id) {
    modalTitle.textContent = 'Chỉnh sửa tài khoản';
    idInput.value = item.id;
    titleInput.value = item.title || '';
    urlInput.value = item.url || '';
    catInput.value = item.category || 'web';
    userInput.value = item.username || '';
    passInput.value = item.password || '';
    passInput.type = 'password';
    pinInput.value = item.pinOr2FA || '';
  } else {
    modalTitle.textContent = 'Thêm tài khoản mới';
    idInput.value = '';
    titleInput.value = item?.title || '';
    urlInput.value = item?.url || '';
    catInput.value = item?.category || 'web';
    userInput.value = item?.username || '';
    passInput.value = item?.password || '';
    passInput.type = 'password';
    pinInput.value = '';
  }

  modal.classList.remove('hidden');
}

// Navigation Tabs
function initTabs() {
  document.querySelectorAll('.nav-tab').forEach((tabBtn) => {
    tabBtn.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

      tabBtn.classList.add('active');
      const target = document.getElementById(tabBtn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// Generator
function initGenerator() {
  const slider = document.getElementById('slider-length');
  const lengthVal = document.getElementById('gen-length-val');
  const refreshBtn = document.getElementById('btn-refresh-gen');
  const copyBtn = document.getElementById('btn-copy-gen');
  const fillToPageBtn = document.getElementById('btn-fill-gen-to-page');

  const checkUpper = document.getElementById('check-upper');
  const checkLower = document.getElementById('check-lower');
  const checkNumbers = document.getElementById('check-numbers');
  const checkSymbols = document.getElementById('check-symbols');
  const checkAmbiguous = document.getElementById('check-exclude-ambiguous');

  function runGenerate() {
    const len = parseInt(slider.value, 10);
    lengthVal.textContent = len;

    const result = generatePasswordString(
      len,
      checkUpper.checked,
      checkLower.checked,
      checkNumbers.checked,
      checkSymbols.checked,
      checkAmbiguous.checked
    );

    const display = document.getElementById('generated-password-display');
    if (display) display.textContent = result;

    // Strength calculation
    let score = 0;
    if (len >= 12) score += 40;
    if (checkUpper.checked && checkLower.checked) score += 20;
    if (checkNumbers.checked) score += 20;
    if (checkSymbols.checked) score += 20;

    const fill = document.getElementById('strength-bar-fill');
    const label = document.getElementById('strength-label');
    if (fill && label) {
      fill.style.width = score + '%';
      if (score >= 80) {
        fill.style.backgroundColor = 'var(--accent-success)';
        label.textContent = `Rất mạnh (${score}%)`;
        label.style.color = 'var(--accent-success)';
      } else if (score >= 60) {
        fill.style.backgroundColor = 'var(--accent-warning)';
        label.textContent = `Trung bình (${score}%)`;
        label.style.color = 'var(--accent-warning)';
      } else {
        fill.style.backgroundColor = 'var(--accent-danger)';
        label.textContent = `Yếu (${score}%)`;
        label.style.color = 'var(--accent-danger)';
      }
    }
  }

  slider.addEventListener('input', runGenerate);
  [checkUpper, checkLower, checkNumbers, checkSymbols, checkAmbiguous].forEach((cb) => {
    cb.addEventListener('change', runGenerate);
  });
  refreshBtn.addEventListener('click', runGenerate);

  copyBtn.addEventListener('click', () => {
    const pass = document.getElementById('generated-password-display').textContent;
    copyToClipboard(pass, 'Đã chép Mật khẩu mới!');
  });

  fillToPageBtn?.addEventListener('click', async () => {
    const pass = document.getElementById('generated-password-display').textContent;
    await triggerAutoFill('', pass);
  });

  runGenerate();
}

function generatePasswordString(len, upper, lower, numbers, symbols, ambiguous) {
  let chars = '';
  if (lower) chars += ambiguous ? 'abcdefghijkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  if (upper) chars += ambiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (numbers) chars += ambiguous ? '23456789' : '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let result = '';
  const cryptoObj = window.crypto || window.msCrypto;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const buffer = new Uint32Array(len);
    cryptoObj.getRandomValues(buffer);
    for (let i = 0; i < len; i++) {
      result += chars[buffer[i] % chars.length];
    }
  } else {
    for (let i = 0; i < len; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}

// Sync & Import / Export
function initSync() {
  const tokenInput = document.getElementById('sync-token-input');
  const applyTokenBtn = document.getElementById('btn-apply-sync-token');
  const exportBtn = document.getElementById('btn-export-vault');
  const importFileInput = document.getElementById('file-import-vault');

  applyTokenBtn.addEventListener('click', () => {
    const raw = tokenInput.value.trim();
    if (!raw) {
      showToast('⚠️ Vui lòng dán mã Sync Token JSON!');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const items = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Không có danh sách tài khoản');
      }

      allPasswords = items;
      const nowStr = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
      chrome.storage.local.set({ erp_passwords: allPasswords, erp_last_sync: nowStr });
      updateCountBadge();
      renderPasswordList();
      tokenInput.value = '';
      showToast(`✅ Đã đồng bộ thành công ${items.length} tài khoản!`);
    } catch (err) {
      showToast('❌ Mã Sync Token không hợp lệ!');
    }
  });

  exportBtn.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allPasswords, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `erp_passvault_export_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
    showToast('💾 Đã xuất file sao lưu JSON!');
  });

  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const items = Array.isArray(parsed) ? parsed : parsed.items;
        if (Array.isArray(items) && items.length > 0) {
          allPasswords = items;
          chrome.storage.local.set({ erp_passwords: allPasswords });
          updateCountBadge();
          renderPasswordList();
          showToast(`✅ Đã nhập thành công ${items.length} tài khoản!`);
        }
      } catch (e) {
        showToast('❌ File JSON không đúng định dạng!');
      }
    };
    reader.readAsText(file);
  });
}

function copyToClipboard(text, msg) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast(msg || 'Đã sao chép vào bộ nhớ đệm');
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast-message');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2200);
}

function getCategoryName(cat) {
  const map = {
    work: 'Công việc',
    email: 'Email',
    web: 'Website',
    social: 'Mạng XH',
    server: 'Server',
    finance: 'Tài chính',
    software: 'Phần mềm',
    other: 'Khác',
  };
  return map[cat] || 'Tài khoản';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

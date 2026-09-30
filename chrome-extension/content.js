// ERP PassVault Content Script
// Handles auto-fill, login/register detection, quick-save prompt, and inline password helper

(function () {
  'use strict';

  // Prevent double injection
  if (window.__ERP_PASSVAULT_INJECTED__) return;
  window.__ERP_PASSVAULT_INJECTED__ = true;

  // Listen to messages from popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'AUTO_FILL') {
      const { username, password } = request;
      const filled = performAutoFill(username, password);
      sendResponse({ success: filled });
    } else if (request.action === 'PING') {
      sendResponse({ status: 'ok' });
    }
    return true;
  });

  // Init form submission & input listeners
  initFormListeners();
  initInlinePasswordHelpers();

  /* ==========================================================================
     1. AUTO-FILL ENGINE
     ========================================================================== */

  function performAutoFill(username, password) {
    let filledPassword = false;
    let filledUsername = false;

    // 1. Find password inputs
    const passwordInputs = Array.from(
      document.querySelectorAll('input[type="password"]')
    ).filter((el) => isVisible(el));

    if (passwordInputs.length > 0) {
      const passEl = passwordInputs[0];
      setNativeValue(passEl, password);
      filledPassword = true;

      // 2. Find closest username/email field prior to password input
      const form = passEl.closest('form') || document.body;
      const allInputs = Array.from(
        form.querySelectorAll(
          'input[type="text"], input[type="email"], input[type="tel"], input:not([type])'
        )
      ).filter((el) => isVisible(el) && el !== passEl);

      if (allInputs.length > 0 && username) {
        const bestUsernameInput =
          allInputs.find((input) => {
            const name = (input.name || input.id || input.placeholder || input.getAttribute('autocomplete') || '').toLowerCase();
            return (
              name.includes('user') ||
              name.includes('email') ||
              name.includes('login') ||
              name.includes('account') ||
              name.includes('phone') ||
              name.includes('tai-khoan') ||
              name.includes('ten')
            );
          }) || allInputs[0];

        if (bestUsernameInput) {
          setNativeValue(bestUsernameInput, username);
          filledUsername = true;
        }
      }
    } else {
      // If no password input found, try username inputs
      const usernameInputs = Array.from(
        document.querySelectorAll('input[type="text"], input[type="email"]')
      ).filter((el) => isVisible(el));

      if (usernameInputs.length > 0 && username) {
        setNativeValue(usernameInputs[0], username);
        filledUsername = true;
      }
    }

    showToastBanner(
      filledUsername || filledPassword
        ? '⚡ Đã tự động điền tài khoản từ ERP PassVault!'
        : '⚠️ Không tìm thấy ô đăng nhập phù hợp trên trang này',
      filledUsername || filledPassword ? 'success' : 'warning'
    );
    return filledUsername || filledPassword;
  }

  // React / Vue / Modern framework value setter
  function setNativeValue(element, value) {
    if (!element) return;
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  }

  function isVisible(el) {
    return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  }

  /* ==========================================================================
     2. AUTO-DETECT FORM SUBMISSIONS & PROMPT TO SAVE PASSWORD
     ========================================================================== */

  let lastCapturedCreds = null;

  function initFormListeners() {
    // 1. Listen for standard form submits
    document.addEventListener('submit', handleFormSubmit, true);

    // 2. Listen for Enter key on password fields
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Enter') {
          const target = e.target;
          if (target && target.tagName === 'INPUT') {
            const form = target.closest('form');
            if (form) {
              captureFormCredentials(form);
            } else {
              capturePageCredentials();
            }
          }
        }
      },
      true
    );

    // 3. Listen for clicks on submit / login / signup buttons
    document.addEventListener(
      'click',
      (e) => {
        const target = e.target;
        if (!target) return;
        const btn = target.closest('button, input[type="submit"], [role="button"], a');
        if (!btn) return;

        const text = (btn.textContent || btn.value || btn.getAttribute('aria-label') || '').toLowerCase();
        const isActionBtn =
          text.includes('đăng nhập') ||
          text.includes('login') ||
          text.includes('sign in') ||
          text.includes('signin') ||
          text.includes('đăng ký') ||
          text.includes('register') ||
          text.includes('sign up') ||
          text.includes('signup') ||
          text.includes('tạo tài khoản') ||
          text.includes('submit') ||
          text.includes('tiếp tục') ||
          text.includes('continue') ||
          text.includes('xác nhận') ||
          text.includes('confirm') ||
          btn.type === 'submit';

        if (isActionBtn) {
          const form = btn.closest('form');
          if (form) {
            captureFormCredentials(form);
          } else {
            capturePageCredentials();
          }
        }
      },
      true
    );
  }

  function handleFormSubmit(e) {
    const form = e.target;
    if (form && form.tagName === 'FORM') {
      captureFormCredentials(form);
    }
  }

  function captureFormCredentials(form) {
    try {
      const passInputs = Array.from(form.querySelectorAll('input[type="password"]')).filter((i) => i.value && i.value.trim().length > 0);
      if (passInputs.length === 0) return;

      const password = passInputs[0].value;
      if (!password || password.length < 2) return;

      // Find username
      const textInputs = Array.from(
        form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input:not([type])')
      ).filter((i) => i.value && i.value.trim().length > 0);

      let username = '';
      if (textInputs.length > 0) {
        const best =
          textInputs.find((input) => {
            const name = (input.name || input.id || input.placeholder || '').toLowerCase();
            return (
              name.includes('user') ||
              name.includes('email') ||
              name.includes('login') ||
              name.includes('account') ||
              name.includes('phone')
            );
          }) || textInputs[0];
        username = best.value.trim();
      }

      promptSavePassword({
        username,
        password,
        url: window.location.href,
        domain: window.location.hostname.replace(/^www\./, ''),
        title: document.title || window.location.hostname,
      });
    } catch (err) {
      console.warn('ERP PassVault form capture error:', err);
    }
  }

  function capturePageCredentials() {
    try {
      const passInputs = Array.from(document.querySelectorAll('input[type="password"]')).filter(
        (i) => isVisible(i) && i.value && i.value.trim().length > 0
      );
      if (passInputs.length === 0) return;

      const password = passInputs[0].value;
      if (!password || password.length < 2) return;

      const textInputs = Array.from(
        document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]')
      ).filter((i) => isVisible(i) && i.value && i.value.trim().length > 0);

      let username = textInputs.length > 0 ? textInputs[0].value.trim() : '';

      promptSavePassword({
        username,
        password,
        url: window.location.href,
        domain: window.location.hostname.replace(/^www\./, ''),
        title: document.title || window.location.hostname,
      });
    } catch (err) {
      console.warn('ERP PassVault page capture error:', err);
    }
  }

  function promptSavePassword(creds) {
    if (!creds || !creds.password) return;

    // Avoid multiple prompts in quick succession for identical values
    if (
      lastCapturedCreds &&
      lastCapturedCreds.username === creds.username &&
      lastCapturedCreds.password === creds.password &&
      Date.now() - lastCapturedCreds.time < 5000
    ) {
      return;
    }
    lastCapturedCreds = { ...creds, time: Date.now() };

    // Small delay to let page transition or form submission execute
    setTimeout(() => {
      renderSavePromptModal(creds);
    }, 600);
  }

  /* ==========================================================================
     3. FLOATING SAVE MODAL PROMPT
     ========================================================================== */

  function renderSavePromptModal(creds) {
    const existing = document.getElementById('erp-passvault-save-prompt');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'erp-passvault-save-prompt';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      background: #0f172a;
      color: #f8fafc;
      border: 1px solid #334155;
      border-radius: 14px;
      box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(59, 130, 246, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      z-index: 2147483647;
      overflow: hidden;
      animation: erpSlideDown 0.3s ease-out forwards;
      line-height: 1.5;
    `;

    // Add inline keyframe animation if not already present
    if (!document.getElementById('erp-passvault-anim-styles')) {
      const style = document.createElement('style');
      style.id = 'erp-passvault-anim-styles';
      style.textContent = `
        @keyframes erpSlideDown {
          from { opacity: 0; transform: translateY(-16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `;
      document.head.appendChild(style);
    }

    container.innerHTML = `
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 12px 14px; border-bottom: 1px solid #334155; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 26px; height: 26px; border-radius: 6px; background: linear-gradient(135deg, #3b82f6, #6366f1); display: flex; align-items: center; justify-content: center; color: #fff;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div>
            <div style="font-weight: 700; font-size: 13px; color: #f8fafc;">ERP PassVault</div>
            <div style="font-size: 10px; color: #94a3b8;">Lưu tài khoản vào kho bảo mật?</div>
          </div>
        </div>
        <button id="erp-prompt-close" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; padding: 4px; line-height: 1;">&times;</button>
      </div>

      <div style="padding: 14px; display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #60a5fa; background: rgba(59, 130, 246, 0.1); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.2);">
          <span>🌐</span>
          <strong style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(creds.domain)}</strong>
        </div>

        <div>
          <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 3px; font-weight: 600;">TÊN ĐĂNG NHẬP / EMAIL:</label>
          <input type="text" id="erp-prompt-username" value="${escapeHtml(creds.username || '')}" placeholder="Nhập tên đăng nhập hoặc email..." style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; color: #f8fafc; font-size: 12px; outline: none;">
        </div>

        <div>
          <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 3px; font-weight: 600;">MẬT KHẨU:</label>
          <div style="position: relative; display: flex; align-items: center;">
            <input type="password" id="erp-prompt-password" value="${escapeHtml(creds.password || '')}" style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 30px 6px 10px; color: #f8fafc; font-size: 12px; font-family: monospace; outline: none;">
            <button type="button" id="erp-prompt-toggle-pass" style="position: absolute; right: 6px; background: none; border: none; color: #94a3b8; cursor: pointer; padding: 2px; font-size: 11px;">👁️</button>
          </div>
        </div>

        <div>
          <label style="display: block; font-size: 10px; color: #94a3b8; margin-bottom: 3px; font-weight: 600;">DANH MỤC:</label>
          <select id="erp-prompt-category" style="width: 100%; box-sizing: border-box; background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 8px; color: #f8fafc; font-size: 11px; outline: none;">
            <option value="web">Website cá nhân / Dịch vụ</option>
            <option value="work">Công việc & ERP</option>
            <option value="email">Hộp thư Email</option>
            <option value="social">Mạng xã hội</option>
            <option value="server">Máy chủ & Cloud</option>
            <option value="finance">Tài chính & Ngân hàng</option>
            <option value="software">Bản quyền phần mềm</option>
          </select>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 4px;">
          <button id="erp-prompt-btn-save" style="flex: 1; background: #3b82f6; hover: background: #2563eb; color: #ffffff; border: none; border-radius: 6px; padding: 8px 12px; font-weight: 600; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; box-shadow: 0 2px 6px rgba(59,130,246,0.3);">
            💾 Lưu vào Vault
          </button>
          <button id="erp-prompt-btn-cancel" style="background: #334155; color: #cbd5e1; border: none; border-radius: 6px; padding: 8px 12px; font-weight: 500; font-size: 12px; cursor: pointer;">
            Bỏ qua
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Event listeners for prompt
    const closeBtn = container.querySelector('#erp-prompt-close');
    const cancelBtn = container.querySelector('#erp-prompt-btn-cancel');
    const saveBtn = container.querySelector('#erp-prompt-btn-save');
    const togglePassBtn = container.querySelector('#erp-prompt-toggle-pass');
    const passInput = container.querySelector('#erp-prompt-password');
    const userInput = container.querySelector('#erp-prompt-username');
    const catSelect = container.querySelector('#erp-prompt-category');

    const dismiss = () => {
      container.style.opacity = '0';
      container.style.transform = 'translateY(-10px)';
      container.style.transition = 'all 0.2s ease';
      setTimeout(() => container.remove(), 250);
    };

    closeBtn.addEventListener('click', dismiss);
    cancelBtn.addEventListener('click', dismiss);

    togglePassBtn.addEventListener('click', () => {
      if (passInput.type === 'password') {
        passInput.type = 'text';
      } else {
        passInput.type = 'password';
      }
    });

    saveBtn.addEventListener('click', () => {
      const finalUser = userInput.value.trim();
      const finalPass = passInput.value;
      const finalCat = catSelect.value;

      if (!finalPass) {
        alert('Vui lòng nhập mật khẩu');
        return;
      }

      saveBtn.textContent = 'Đang lưu...';
      saveBtn.disabled = true;

      chrome.runtime.sendMessage(
        {
          action: 'SAVE_PASSWORD',
          payload: {
            title: creds.title || creds.domain,
            domain: creds.domain,
            url: creds.url,
            username: finalUser,
            password: finalPass,
            category: finalCat,
          },
        },
        (response) => {
          dismiss();
          if (response && response.success) {
            showToastBanner(`✅ Đã lưu tài khoản ${finalUser || creds.domain} vào ERP PassVault!`, 'success');
          } else {
            showToastBanner('⚠️ Không thể lưu tài khoản vào ERP PassVault', 'warning');
          }
        }
      );
    });
  }

  /* ==========================================================================
     4. INLINE PASSWORD FIELD HELPER (KEY ICON & QUICK DROPDOWN)
     ========================================================================== */

  function initInlinePasswordHelpers() {
    // Monitor password fields added dynamically or initially present
    function attachHelperToPasswordInputs() {
      const passInputs = Array.from(document.querySelectorAll('input[type="password"]')).filter(
        (el) => !el.dataset.erpH161Attached && isVisible(el)
      );

      passInputs.forEach((passInput) => {
        passInput.dataset.erpH161Attached = 'true';
        createInlineBadge(passInput);
      });
    }

    attachHelperToPasswordInputs();

    // Observe mutations
    const observer = new MutationObserver(() => {
      attachHelperToPasswordInputs();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function createInlineBadge(passInput) {
    const wrapper = passInput.parentElement;
    if (!wrapper) return;

    // Ensure wrapper has relative positioning if needed
    const rect = passInput.getBoundingClientRect();
    if (rect.width < 50 || rect.height < 20) return;

    const btn = document.createElement('div');
    btn.className = 'erp-passvault-inline-btn';
    btn.title = 'ERP PassVault: Điền hoặc tạo mật khẩu';
    btn.style.cssText = `
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      background: #3b82f6;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 99999;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      transition: transform 0.15s, background 0.15s;
      opacity: 0.85;
    `;
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    `;

    function updatePosition() {
      if (!passInput.isConnected || !isVisible(passInput)) {
        btn.style.display = 'none';
        return;
      }
      btn.style.display = 'flex';
      const inputRect = passInput.getBoundingClientRect();
      btn.style.top = `${window.scrollY + inputRect.top + (inputRect.height - 20) / 2}px`;
      btn.style.left = `${window.scrollX + inputRect.right - 26}px`;
    }

    document.body.appendChild(btn);
    updatePosition();

    window.addEventListener('resize', updatePosition, { passive: true });
    window.addEventListener('scroll', updatePosition, { passive: true });

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.15)';
      btn.style.opacity = '1';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.opacity = '0.85';
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openInlineDropdown(passInput, btn);
    });
  }

  function openInlineDropdown(passInput, anchorBtn) {
    const existing = document.getElementById('erp-passvault-dropdown');
    if (existing) {
      existing.remove();
      return;
    }

    const domain = window.location.hostname.replace(/^www\./, '');

    chrome.runtime.sendMessage({ action: 'GET_MATCHING_PASSWORDS', domain }, (res) => {
      const matches = (res && res.matches) || [];

      const menu = document.createElement('div');
      menu.id = 'erp-passvault-dropdown';
      menu.style.cssText = `
        position: absolute;
        width: 260px;
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 10px;
        box-shadow: 0 12px 28px rgba(0,0,0,0.5);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 11px;
        z-index: 2147483647;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        animation: erpSlideDown 0.2s ease-out forwards;
      `;

      const anchorRect = anchorBtn.getBoundingClientRect();
      menu.style.top = `${window.scrollY + anchorRect.bottom + 6}px`;
      menu.style.left = `${window.scrollX + Math.max(10, anchorRect.right - 260)}px`;

      let matchesHtml = '';
      if (matches.length > 0) {
        matchesHtml = `
          <div style="font-size: 10px; color: #60a5fa; font-weight: 700; padding: 4px 6px; border-bottom: 1px solid #1e293b;">
            TÀI KHOẢN KHỚP TRANG (${matches.length})
          </div>
          ${matches
            .map(
              (m) => `
            <div class="erp-menu-item erp-match-item" data-user="${escapeHtml(m.username)}" data-pass="${escapeHtml(m.password)}" style="padding: 6px 8px; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; transition: background 0.15s;">
              <div style="font-weight: 600; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(m.title || m.username)}</div>
              <div style="font-size: 10px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(m.username)}</div>
            </div>
          `
            )
            .join('')}
          <div style="height: 1px; background: #1e293b; margin: 2px 0;"></div>
        `;
      }

      menu.innerHTML = `
        ${matchesHtml}
        <div class="erp-menu-item erp-gen-pass-btn" style="padding: 7px 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; color: #38bdf8; font-weight: 600;">
          <span>✨</span>
          <span>Tạo mật khẩu mạnh tự động</span>
        </div>
        <div class="erp-menu-item erp-save-now-btn" style="padding: 7px 8px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; color: #10b981; font-weight: 600;">
          <span>💾</span>
          <span>Lưu tài khoản này vào Vault</span>
        </div>
      `;

      document.body.appendChild(menu);

      // Hover styling
      menu.querySelectorAll('.erp-menu-item').forEach((item) => {
        item.addEventListener('mouseenter', () => (item.style.backgroundColor = '#1e293b'));
        item.addEventListener('mouseleave', () => (item.style.backgroundColor = 'transparent'));
      });

      // Handle match click
      menu.querySelectorAll('.erp-match-item').forEach((item) => {
        item.addEventListener('click', () => {
          const u = item.dataset.user;
          const p = item.dataset.pass;
          performAutoFill(u, p);
          menu.remove();
        });
      });

      // Handle Generate Password
      menu.querySelector('.erp-gen-pass-btn')?.addEventListener('click', () => {
        const generated = generateStrongPassword(16);
        setNativeValue(passInput, generated);

        // Also fill any confirm password inputs in the same form
        const form = passInput.closest('form') || document.body;
        const allPassInputs = Array.from(form.querySelectorAll('input[type="password"]'));
        allPassInputs.forEach((inp) => {
          if (inp !== passInput) setNativeValue(inp, generated);
        });

        navigator.clipboard.writeText(generated);
        showToastBanner('✨ Đã điền và sao chép mật khẩu mới vào clipboard!', 'success');
        menu.remove();
      });

      // Handle Save now
      menu.querySelector('.erp-save-now-btn')?.addEventListener('click', () => {
        const form = passInput.closest('form');
        if (form) {
          captureFormCredentials(form);
        } else {
          capturePageCredentials();
        }
        menu.remove();
      });

      // Close on outside click
      const closeDropdownHandler = (e) => {
        if (!menu.contains(e.target) && e.target !== anchorBtn) {
          menu.remove();
          document.removeEventListener('click', closeDropdownHandler);
        }
      };
      setTimeout(() => document.addEventListener('click', closeDropdownHandler), 100);
    });
  }

  function generateStrongPassword(length = 16) {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*()_+-=[]{}';
    let result = '';
    const cryptoObj = window.crypto || window.msCrypto;
    if (cryptoObj && cryptoObj.getRandomValues) {
      const buffer = new Uint32Array(length);
      cryptoObj.getRandomValues(buffer);
      for (let i = 0; i < length; i++) {
        result += chars[buffer[i] % chars.length];
      }
    } else {
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return result;
  }

  /* ==========================================================================
     5. TOAST BANNER NOTIFICATION
     ========================================================================== */

  function showToastBanner(message, type = 'success') {
    const existing = document.getElementById('erp-passvault-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'erp-passvault-banner';
    banner.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      background: ${type === 'success' ? '#0f172a' : type === 'warning' ? '#b45309' : '#e11d48'};
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      border: 1px solid rgba(255,255,255,0.15);
    `;

    banner.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${type === 'success' ? '#10b981' : '#ffffff'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${escapeHtml(message)}</span>
    `;

    document.body.appendChild(banner);

    setTimeout(() => {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-10px)';
      setTimeout(() => banner.remove(), 300);
    }, 2500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();

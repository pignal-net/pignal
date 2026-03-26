/* pignal - theme toggle (light / dark / auto) */
(function () {
  var STORAGE_KEY = 'pignal-theme';
  var html = document.documentElement;

  function getStored() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setTheme(theme) {
    if (theme === 'auto') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', theme);
    }
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* noop */ }
    updateButtons(theme);
  }

  /* SVG icon strings for theme toggle (16x16, stroke-based, hardcoded constants) */
  var ICON_SUN = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="3"></circle><path d="M8 1.5v1M8 13.5v1M1.5 8h1M13.5 8h1M3.4 3.4l.7.7M11.9 11.9l.7.7M3.4 12.6l.7-.7M11.9 4.1l.7-.7"></path></svg>';
  var ICON_MOON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 8.5a5.5 5.5 0 1 1-6-6 4.5 4.5 0 0 0 6 6z"></path></svg>';
  var ICON_MONITOR = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1.5" y="2" width="13" height="9" rx="1.5"></rect><path d="M5.5 14h5M8 11v3"></path></svg>';

  function updateButtons(theme) {
    var buttons = document.querySelectorAll('.theme-toggle');
    var svgContent, label;
    if (theme === 'dark') {
      svgContent = ICON_SUN;
      label = 'Switch to auto mode';
    } else if (theme === 'light') {
      svgContent = ICON_MOON;
      label = 'Switch to dark mode';
    } else {
      svgContent = ICON_MONITOR;
      label = 'Switch to light mode';
    }
    for (var i = 0; i < buttons.length; i++) {
      /* SVG strings are hardcoded constants above — safe to use as markup */
      buttons[i].textContent = '';
      var tpl = document.createElement('template');
      tpl.innerHTML = svgContent;
      buttons[i].appendChild(tpl.content.cloneNode(true));
      buttons[i].setAttribute('aria-label', label);
    }
  }

  function toggle() {
    var current = html.getAttribute('data-theme') || 'auto';
    var next = current === 'light' ? 'dark' : current === 'dark' ? 'auto' : 'light';
    setTheme(next);
  }

  // Apply stored preference on load (default to auto — respects system preference)
  var stored = getStored();
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    setTheme(stored);
  } else {
    setTheme('auto');
  }

  // Bind click handlers (event delegation)
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.theme-toggle')) {
      e.preventDefault();
      toggle();
    }
  });
})();

/* pignal - toast notification system */
(function () {
  var container = document.createElement('div');
  container.className = 'toast-container';
  document.body.appendChild(container);

  function showToast(message, type) {
    var el = document.createElement('div');
    el.className = 'toast toast-' + (type || 'success');
    el.textContent = message;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    container.appendChild(el);

    setTimeout(function () {
      el.classList.add('toast-removing');
      el.addEventListener('animationend', function () {
        el.remove();
      });
    }, 4000);
  }

  // HTMX event: HX-Trigger sends { "showToast": { "message": "...", "type": "success|error" } }
  document.addEventListener('showToast', function (e) {
    var detail = e.detail || {};
    showToast(detail.message || 'Done', detail.type || 'success');
  });

  // Auto-dismiss server-rendered flash messages after 5s
  var flashes = document.querySelectorAll('.flash');
  for (var i = 0; i < flashes.length; i++) {
    (function (el) {
      setTimeout(function () {
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '0';
        setTimeout(function () { el.remove(); }, 300);
      }, 5000);
    })(flashes[i]);
  }

  // Reset forms with data-reset-on-success after successful HTMX request
  document.addEventListener('htmx:afterRequest', function (e) {
    if (e.detail.successful && e.detail.elt && e.detail.elt.tagName === 'FORM' &&
        e.detail.elt.hasAttribute('data-reset-on-success')) {
      e.detail.elt.reset();
    }
  });
})();

/* pignal - reading progress bar (source page / shared page) */
(function () {
  var article = document.querySelector('.source-article');
  if (!article) return;

  var bar = document.createElement('div');
  bar.className = 'reading-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Reading progress');
  document.body.appendChild(bar);

  var ticking = false;
  function updateProgress() {
    var rect = article.getBoundingClientRect();
    var articleTop = rect.top + window.scrollY;
    var articleHeight = rect.height;
    var scrolled = window.scrollY - articleTop;
    var viewHeight = window.innerHeight;
    var progress = Math.max(0, Math.min(1, scrolled / (articleHeight - viewHeight)));
    bar.style.transform = 'scaleX(' + progress + ')';
    bar.setAttribute('aria-valuenow', Math.round(progress * 100));
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () { updateProgress(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  updateProgress();
})();

/* pignal - back to top button */
(function () {
  var btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.textContent = '\u2191'; // ↑ arrow
  btn.type = 'button';
  document.body.appendChild(btn);

  var visible = false;
  function toggle() {
    var show = window.scrollY > 400;
    if (show !== visible) {
      visible = show;
      btn.classList.toggle('visible', show);
    }
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () { toggle(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  toggle();
})();

/* pignal - color picker sync (settings page) */
document.addEventListener('input', function (e) {
  if (e.target && e.target.matches && e.target.matches('input[type="color"][data-sync]')) {
    var target = document.querySelector(e.target.getAttribute('data-sync'));
    if (target) target.value = e.target.value;
  }
});

/* pignal - source action bar (copy page / copy markdown) */
(function () {
  function toast(message, type) {
    document.dispatchEvent(new CustomEvent('showToast', {
      detail: { message: message, type: type || 'success' }
    }));
  }

  document.addEventListener('click', function (e) {
    var target = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
    if (!target) return;

    var action = target.getAttribute('data-action');

    if (action === 'copy-page') {
      e.preventDefault();
      var content = document.querySelector('.source-article .content');
      if (content) {
        var text = content.innerText || content.textContent || '';
        navigator.clipboard.writeText(text).then(function () {
          toast('Page copied to clipboard');
        }).catch(function () {
          toast('Failed to copy to clipboard', 'error');
        });
      }
      var details = target.closest('details');
      if (details) details.removeAttribute('open');
    }

    if (action === 'copy-markdown') {
      e.preventDefault();
      var url = target.getAttribute('data-url');
      if (url) {
        fetch(url)
          .then(function (r) { return r.text(); })
          .then(function (md) {
            return navigator.clipboard.writeText(md);
          })
          .then(function () {
            toast('Markdown copied to clipboard');
          })
          .catch(function () {
            toast('Failed to copy markdown', 'error');
          });
      }
      var dd = target.closest('details');
      if (dd) dd.removeAttribute('open');
    }
  });
})();

/* pignal - workspace save bar (dirty tracking + batch save) */
(function () {
  var saveBar = document.getElementById('ws-save-bar');
  if (!saveBar) return;

  var countEl = document.getElementById('ws-save-bar-count');
  var discardBtn = document.getElementById('ws-save-bar-discard');
  var saveBtn = document.getElementById('ws-save-bar-save');
  var dirtyWorkspaces = {};

  function updateBar() {
    var ids = Object.keys(dirtyWorkspaces);
    var count = ids.length;
    if (countEl) countEl.textContent = String(count);
    var textEl = saveBar.querySelector('.save-bar-text');
    if (textEl && countEl) {
      while (textEl.firstChild) textEl.removeChild(textEl.firstChild);
      textEl.appendChild(countEl);
      textEl.appendChild(document.createTextNode(' unsaved workspace' + (count === 1 ? '' : 's')));
    }
    if (count > 0) {
      saveBar.removeAttribute('hidden');
    } else {
      saveBar.setAttribute('hidden', '');
    }
  }

  function checkDirty(el) {
    var wsId = el.getAttribute('data-ws-id');
    var field = el.getAttribute('data-ws-field');
    if (!wsId || !field) return;
    var original = el.getAttribute('data-original');
    var current = el.value;
    if (current !== original) {
      if (!dirtyWorkspaces[wsId]) dirtyWorkspaces[wsId] = {};
      dirtyWorkspaces[wsId][field] = true;
    } else if (dirtyWorkspaces[wsId]) {
      delete dirtyWorkspaces[wsId][field];
      if (Object.keys(dirtyWorkspaces[wsId]).length === 0) {
        delete dirtyWorkspaces[wsId];
      }
    }
    updateBar();
  }

  document.addEventListener('input', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-ws-id')) {
      checkDirty(e.target);
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-ws-id')) {
      checkDirty(e.target);
    }
  });

  if (discardBtn) {
    discardBtn.addEventListener('click', function () {
      var fields = document.querySelectorAll('[data-ws-id]');
      for (var i = 0; i < fields.length; i++) {
        fields[i].value = fields[i].getAttribute('data-original');
      }
      dirtyWorkspaces = {};
      updateBar();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      var wsIds = Object.keys(dirtyWorkspaces);
      if (wsIds.length === 0) return;

      var workspaces = [];
      for (var i = 0; i < wsIds.length; i++) {
        var wsId = wsIds[i];
        var fields = document.querySelectorAll('[data-ws-id="' + wsId + '"]');
        if (fields.length === 0) {
          delete dirtyWorkspaces[wsId];
          continue;
        }
        var ws = { id: wsId };
        for (var j = 0; j < fields.length; j++) {
          ws[fields[j].getAttribute('data-ws-field')] = fields[j].value;
        }
        workspaces.push(ws);
      }

      if (workspaces.length === 0) { updateBar(); return; }

      var csrfToken = '';
      var match = document.cookie.match(/pignal_csrf=([^;]+)/);
      if (match) csrfToken = match[1];

      saveBtn.setAttribute('aria-busy', 'true');
      saveBtn.disabled = true;

      fetch('/pignal/workspaces/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ workspaces: workspaces })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var saved = data.saved || [];
          var errors = data.errors || {};

          for (var j = 0; j < saved.length; j++) {
            var els = document.querySelectorAll('[data-ws-id="' + saved[j] + '"]');
            for (var k = 0; k < els.length; k++) {
              els[k].setAttribute('data-original', els[k].value);
            }
            delete dirtyWorkspaces[saved[j]];
          }

          var errorKeys = Object.keys(errors);
          if (saved.length > 0 && errorKeys.length === 0) {
            toast(saved.length + ' workspace' + (saved.length === 1 ? '' : 's') + ' saved', 'success');
          } else if (saved.length > 0 && errorKeys.length > 0) {
            toast(saved.length + ' saved, ' + errorKeys.length + ' failed', 'error');
          } else if (errorKeys.length > 0) {
            toast(errors[errorKeys[0]], 'error');
          }

          updateBar();
        })
        .catch(function () {
          toast('Network error — changes not saved', 'error');
        })
        .finally(function () {
          saveBtn.removeAttribute('aria-busy');
          saveBtn.disabled = false;
        });
    });
  }

  // Clean up dirty state when a workspace is deleted via HTMX
  document.addEventListener('htmx:afterRequest', function (e) {
    if (!e.detail.successful) return;
    var target = e.detail.target;
    if (target && target.id && target.id.indexOf('ws-') === 0) {
      var wsId = target.id.slice(3);
      if (dirtyWorkspaces[wsId]) {
        delete dirtyWorkspaces[wsId];
        updateBar();
      }
    }
  });

  function toast(message, type) {
    document.dispatchEvent(new CustomEvent('showToast', {
      detail: { message: message, type: type || 'success' }
    }));
  }
})();

/* pignal - settings reset to defaults */
(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.reset-defaults-btn') : null;
    if (!btn) return;

    var keys;
    try { keys = JSON.parse(btn.getAttribute('data-reset-keys')); } catch (_e) { return; }
    if (!Array.isArray(keys) || keys.length === 0) return;

    var defaultsEl = document.getElementById('setting-defaults');
    if (!defaultsEl) return;
    var defaults;
    try { defaults = JSON.parse(defaultsEl.textContent || '{}'); } catch (_e2) { return; }

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!(key in defaults)) continue;
      var el = document.querySelector('[data-setting-key="' + key + '"]');
      if (!el) continue;

      el.value = defaults[key];
      // Trigger input event so dirty tracking picks up the change
      el.dispatchEvent(new Event('input', { bubbles: true }));

      // Sync color picker if applicable
      var colorPicker = document.querySelector('input[type="color"][data-sync="#' + el.id + '"]');
      if (colorPicker) {
        colorPicker.value = defaults[key] || '#000000';
      }
    }
  });
})();

/* pignal - settings save bar (dirty tracking + batch save) */
(function () {
  var saveBar = document.getElementById('save-bar');
  if (!saveBar) return;

  var countEl = document.getElementById('save-bar-count');
  var discardBtn = document.getElementById('save-bar-discard');
  var saveBtn = document.getElementById('save-bar-save');
  var dirtyKeys = {};

  function updateBar() {
    var keys = Object.keys(dirtyKeys);
    var count = keys.length;
    if (countEl) {
      countEl.textContent = String(count);
    }
    var textEl = saveBar.querySelector('.save-bar-text');
    if (textEl && countEl) {
      while (textEl.firstChild) {
        textEl.removeChild(textEl.firstChild);
      }
      textEl.appendChild(countEl);
      textEl.appendChild(document.createTextNode(' unsaved change' + (count === 1 ? '' : 's')));
    }
    if (count > 0) {
      saveBar.removeAttribute('hidden');
    } else {
      saveBar.setAttribute('hidden', '');
    }
  }

  function checkDirty(el) {
    var key = el.getAttribute('data-setting-key');
    if (!key) return;
    var original = el.getAttribute('data-original');
    var current = el.value;
    if (current !== original) {
      dirtyKeys[key] = true;
    } else {
      delete dirtyKeys[key];
    }
    updateBar();
  }

  // Event delegation for input/change on setting fields
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.matches) return;

    // Color picker: defer so the sync handler updates the text input first
    if (el.matches('input[type="color"][data-sync]')) {
      setTimeout(function () {
        var syncTarget = document.querySelector(el.getAttribute('data-sync'));
        if (syncTarget) checkDirty(syncTarget);
      }, 0);
      return;
    }

    if (el.hasAttribute('data-setting-key')) {
      checkDirty(el);
    }
  });

  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el && el.hasAttribute && el.hasAttribute('data-setting-key')) {
      checkDirty(el);
    }
  });

  // Discard: reset all dirty fields to original values
  if (discardBtn) {
    discardBtn.addEventListener('click', function () {
      var fields = document.querySelectorAll('[data-setting-key]');
      for (var i = 0; i < fields.length; i++) {
        var el = fields[i];
        var key = el.getAttribute('data-setting-key');
        if (dirtyKeys[key]) {
          var original = el.getAttribute('data-original');
          el.value = original;
          // Also reset color picker visual via reverse data-sync lookup
          var colorPicker = document.querySelector('input[type="color"][data-sync="#' + el.id + '"]');
          if (colorPicker) {
            colorPicker.value = original || colorPicker.getAttribute('data-original') || '#000000';
          }
        }
      }
      dirtyKeys = {};
      updateBar();
    });
  }

  // Save All: collect dirty values and POST to /settings/batch
  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      var changes = {};
      var fields = document.querySelectorAll('[data-setting-key]');
      for (var i = 0; i < fields.length; i++) {
        var el = fields[i];
        var key = el.getAttribute('data-setting-key');
        if (dirtyKeys[key]) {
          changes[key] = el.value;
        }
      }

      if (Object.keys(changes).length === 0) return;

      // Read CSRF token from cookie
      var csrfToken = '';
      var match = document.cookie.match(/pignal_csrf=([^;]+)/);
      if (match) csrfToken = match[1];

      saveBtn.setAttribute('aria-busy', 'true');
      saveBtn.disabled = true;

      fetch('/pignal/settings/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ changes: changes })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          var saved = data.saved || [];
          var errors = data.errors || {};

          // Update data-original for saved keys and remove from dirty
          for (var j = 0; j < saved.length; j++) {
            var savedKey = saved[j];
            var el = document.querySelector('[data-setting-key="' + savedKey + '"]');
            if (el) {
              el.setAttribute('data-original', el.value);
            }
            delete dirtyKeys[savedKey];
          }

          // Build toast message
          var errorKeys = Object.keys(errors);
          if (saved.length > 0 && errorKeys.length === 0) {
            toast(saved.length + ' setting' + (saved.length === 1 ? '' : 's') + ' saved', 'success');
          } else if (saved.length > 0 && errorKeys.length > 0) {
            toast(saved.length + ' saved, ' + errorKeys.length + ' failed', 'error');
          } else if (errorKeys.length > 0) {
            var firstError = errors[errorKeys[0]];
            toast(errorKeys[0] + ': ' + firstError, 'error');
          }

          updateBar();
        })
        .catch(function () {
          toast('Network error — changes not saved', 'error');
        })
        .finally(function () {
          saveBtn.removeAttribute('aria-busy');
          saveBtn.disabled = false;
        });
    });
  }

  function toast(message, type) {
    document.dispatchEvent(new CustomEvent('showToast', {
      detail: { message: message, type: type || 'success' }
    }));
  }
})();

/* pignal - global navigation loading spinner */
(function () {
  var loader = document.getElementById('nav-loading');
  var main = document.getElementById('main-content');
  var footer = document.getElementById('main-footer');
  if (!loader || !main) return;

  function showNavLoader() {
    loader.removeAttribute('hidden');
    main.hidden = true;
    if (footer) footer.hidden = true;
  }

  function hideAll() {
    loader.setAttribute('hidden', '');
    main.hidden = false;
    if (footer) footer.hidden = false;
  }

  document.addEventListener('click', function (e) {
    var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;

    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
    if (link.getAttribute('target') === '_blank') return;
    if (link.hasAttribute('hx-get') || link.hasAttribute('hx-post')) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (href === window.location.pathname + window.location.search) return;

    showNavLoader();
  });

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) hideAll();
  });
})();

/* pignal - toggle visibility: swap between two elements (supports checkbox toggle) */
document.addEventListener('change', function (e) {
  var el = e.target;
  if (!el || !el.hasAttribute || !el.hasAttribute('data-toggle-target')) return;
  var hideId = el.getAttribute('data-toggle-target');
  var showId = el.getAttribute('data-toggle-target-alt');
  var hideEl = document.getElementById(hideId);
  var showEl = showId ? document.getElementById(showId) : null;
  var isChecked = el.type === 'checkbox' ? el.checked : true;
  if (isChecked) {
    if (hideEl) hideEl.hidden = true;
    if (showEl) {
      showEl.hidden = false;
      var input = showEl.querySelector('input:not([type="hidden"])');
      if (input) input.focus();
    }
  } else {
    if (hideEl) hideEl.hidden = false;
    if (showEl) showEl.hidden = true;
  }
});
/* Also handle click for non-checkbox toggle elements */
document.addEventListener('click', function (e) {
  var btn = e.target && e.target.closest ? e.target.closest('[data-toggle-target]') : null;
  if (!btn || btn.type === 'checkbox') return;
  var hideId = btn.getAttribute('data-toggle-target');
  var showId = btn.getAttribute('data-toggle-target-alt');
  var hideEl = document.getElementById(hideId);
  var showEl = showId ? document.getElementById(showId) : null;
  if (hideEl) hideEl.hidden = true;
  if (showEl) {
    showEl.hidden = false;
    var input = showEl.querySelector('input:not([type="hidden"])');
    if (input) input.focus();
  }
});

/* pignal - bulk selection for managed lists */
(function () {
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (!el) return;

    // Individual checkbox toggled
    if (el.hasAttribute('data-bulk-select')) {
      var list = el.closest('[data-managed-list]');
      if (!list) return;
      var checked = list.querySelectorAll('[data-bulk-select]:checked');
      var total = list.querySelectorAll('[data-bulk-select]');
      var bar = list.querySelector('.bulk-bar');
      var count = bar ? bar.querySelector('.bulk-count') : null;
      var selectAll = list.querySelector('[data-bulk-select-all]');
      var hasChecked = checked.length > 0;
      if (bar) bar.hidden = !hasChecked;
      if (count) count.textContent = String(checked.length);
      if (selectAll) selectAll.checked = checked.length === total.length && total.length > 0;
      // Show all checkboxes when any is selected
      if (hasChecked) { list.classList.add('bulk-active'); } else { list.classList.remove('bulk-active'); }
    }

    // Select-all checkbox toggled
    if (el.hasAttribute('data-bulk-select-all')) {
      var list = el.closest('[data-managed-list]');
      if (!list) return;
      var boxes = list.querySelectorAll('[data-bulk-select]');
      for (var i = 0; i < boxes.length; i++) {
        boxes[i].checked = el.checked;
      }
      var bar = list.querySelector('.bulk-bar');
      var count = bar ? bar.querySelector('.bulk-count') : null;
      var checked = el.checked ? boxes.length : 0;
      if (bar) bar.hidden = checked === 0;
      if (count) count.textContent = String(checked);
      if (el.checked) { list.classList.add('bulk-active'); } else { list.classList.remove('bulk-active'); }
    }
  });

  // Reset bulk state when HTMX replaces list content (search, filter, etc.)
  document.addEventListener('htmx:afterSwap', function (e) {
    var target = e.detail.target;
    if (!target || !target.id || !target.id.match(/-results$/)) return;
    var list = target.closest('[data-managed-list]');
    if (!list) return;
    var bar = list.querySelector('.bulk-bar');
    var count = bar ? bar.querySelector('.bulk-count') : null;
    var selectAll = list.querySelector('[data-bulk-select-all]');
    if (bar) bar.hidden = true;
    if (count) count.textContent = '0';
    if (selectAll) selectAll.checked = false;
    list.classList.remove('bulk-active');
  });
})();

/* pignal - custom confirm dialog (replaces browser confirm()) */
(function () {
  var overlay = null;
  var titleEl = null;
  var messageEl = null;
  var cancelBtn = null;
  var okBtn = null;
  var pendingAction = null;

  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    var dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';

    titleEl = document.createElement('div');
    titleEl.className = 'confirm-title';
    titleEl.textContent = 'Confirm';

    messageEl = document.createElement('div');
    messageEl.className = 'confirm-message';

    var actions = document.createElement('div');
    actions.className = 'confirm-actions';

    cancelBtn = document.createElement('button');
    cancelBtn.className = 'outline';
    cancelBtn.textContent = 'Close';
    cancelBtn.type = 'button';

    okBtn = document.createElement('button');
    okBtn.className = 'btn';
    okBtn.textContent = 'Confirm';
    okBtn.type = 'button';

    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    dialog.appendChild(titleEl);
    dialog.appendChild(messageEl);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    cancelBtn.addEventListener('click', dismiss);
    okBtn.addEventListener('click', function () {
      var fn = pendingAction;
      dismiss();
      if (fn) fn();
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) dismiss();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
        e.preventDefault();
        dismiss();
      }
    });
  }

  function dismiss() {
    if (overlay) overlay.classList.remove('active');
    pendingAction = null;
  }

  function show(message, destructive, callback) {
    ensureOverlay();
    titleEl.textContent = destructive ? 'Are you sure?' : 'Confirm';
    messageEl.textContent = message;
    if (destructive) {
      okBtn.className = 'btn';
      okBtn.style.background = 'var(--color-error)';
      okBtn.style.borderColor = 'var(--color-error)';
      okBtn.style.color = '#fff';
    } else {
      okBtn.className = 'btn';
      okBtn.style.background = '';
      okBtn.style.borderColor = '';
      okBtn.style.color = '';
    }
    pendingAction = callback;
    overlay.classList.add('active');
    okBtn.focus();
  }

  // Intercept HTMX hx-confirm — show our dialog instead of browser confirm()
  document.addEventListener('htmx:confirm', function (e) {
    var el = e.detail.elt;
    if (!el.hasAttribute('hx-confirm')) return;
    e.preventDefault();
    var message = el.getAttribute('hx-confirm');
    var destructive = el.hasAttribute('data-destructive');
    show(message, destructive, function () {
      e.detail.issueRequest(true);
    });
  });

  // Intercept data-confirm clicks (non-HTMX elements)
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-confirm]') : null;
    if (!btn) return;
    // Skip if it also has hx-confirm (handled by htmx:confirm above)
    if (btn.hasAttribute('hx-confirm')) return;
    e.preventDefault();
    e.stopPropagation();
    var message = btn.getAttribute('data-confirm');
    var destructive = btn.hasAttribute('data-destructive');
    show(message, destructive, function () {
      if (btn.tagName === 'A' && btn.href) {
        window.location.href = btn.href;
      } else if (btn.form) {
        btn.form.requestSubmit(btn);
      }
    });
  });
})();

/* pignal - HTMX form dialog (auto-open when #app-dialog-content receives content) */
(function () {
  function closeDialog() {
    var dialog = document.getElementById('app-dialog');
    if (dialog) {
      dialog.classList.remove('active');
      var content = document.getElementById('app-dialog-content');
      if (content) content.textContent = '';
    }
  }

  // Auto-open dialog when HTMX swaps content into #app-dialog-content
  document.addEventListener('htmx:afterSwap', function (e) {
    if (e.detail.target && e.detail.target.id === 'app-dialog-content') {
      var dialog = document.getElementById('app-dialog');
      if (dialog && e.detail.target.textContent.trim()) {
        dialog.classList.add('active');
        // Focus first input in dialog
        var input = e.detail.target.querySelector('input:not([type="hidden"]), select, textarea');
        if (input) setTimeout(function () { input.focus(); }, 50);
      }
    }
  });

  // Close dialog on closeDialog event (fired by server via HX-Trigger)
  document.addEventListener('closeDialog', function () {
    closeDialog();
  });

  // Close dialog on [data-close-dialog] button click
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-close-dialog]') : null;
    if (btn) {
      e.preventDefault();
      closeDialog();
    }
  });

  // Close dialog on overlay click (click on #app-dialog itself, not its children)
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'app-dialog') {
      closeDialog();
    }
  });

  // Close dialog on Escape (if confirm dialog is not open)
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var confirmOverlay = document.querySelector('.confirm-overlay.active:not(#app-dialog)');
      if (confirmOverlay) return; // confirm dialog takes priority
      var dialog = document.getElementById('app-dialog');
      if (dialog && dialog.classList.contains('active')) {
        e.preventDefault();
        closeDialog();
      }
    }
  });
})();

/* pignal - form dropdown (replaces native <select>) */
(function () {
  // Track portal listbox (moved to body for dialogs)
  var portalListbox = null;
  var portalDropdown = null;

  function closeAll(except) {
    var open = document.querySelectorAll('.form-dropdown[data-open]');
    for (var i = 0; i < open.length; i++) {
      if (open[i] !== except) open[i].removeAttribute('data-open');
    }
    removePortal();
  }

  function removePortal() {
    if (portalListbox && portalListbox.parentNode === document.body) {
      document.body.removeChild(portalListbox);
    }
    // Restore original listbox display (CSS will control via [data-open])
    if (portalDropdown) {
      var orig = portalDropdown.querySelector('.form-dropdown-list');
      if (orig) orig.style.display = '';
    }
    portalListbox = null;
    portalDropdown = null;
  }

  function openDropdown(dropdown) {
    closeAll(dropdown);
    dropdown.setAttribute('data-open', '');

    // For dropdowns inside a dialog: portal the listbox to <body> to escape overflow clipping
    if (dropdown.closest('.app-dialog-panel')) {
      var listbox = dropdown.querySelector('.form-dropdown-list');
      var trigger = dropdown.querySelector('.form-dropdown-trigger');
      if (!listbox || !trigger) return;

      var rect = trigger.getBoundingClientRect();
      // Clone the listbox and portal it to body
      // Hide the original listbox so only the portal shows
      listbox.style.display = 'none';

      var clone = listbox.cloneNode(true);
      clone.style.display = 'block';
      clone.style.position = 'fixed';
      clone.style.left = rect.left + 'px';
      clone.style.top = (rect.bottom + 4) + 'px';
      clone.style.width = rect.width + 'px';
      clone.style.right = 'auto';
      clone.style.margin = '0';
      clone.style.zIndex = '10000';
      document.body.appendChild(clone);
      portalListbox = clone;
      portalDropdown = dropdown;
    }
  }

  function selectOption(btn, dropdown) {
    var hidden = dropdown.querySelector('input[type="hidden"]');
    var label = dropdown.querySelector('.form-dropdown-label');
    if (hidden) hidden.value = btn.getAttribute('data-value') || '';
    if (label) label.textContent = btn.getAttribute('data-label') || '';
    // Update aria-selected on all items (buttons and links)
    var allItems = dropdown.querySelectorAll('.form-dropdown-list button, .form-dropdown-list a');
    var selectedValue = btn.getAttribute('data-value');
    for (var i = 0; i < allItems.length; i++) {
      if (allItems[i].getAttribute('data-value') === selectedValue) {
        allItems[i].setAttribute('aria-selected', 'true');
      } else {
        allItems[i].removeAttribute('aria-selected');
      }
    }
    dropdown.removeAttribute('data-open');
    removePortal();
  }

  // Toggle on trigger click
  document.addEventListener('click', function (e) {
    var trigger = e.target && e.target.closest ? e.target.closest('.form-dropdown-trigger') : null;
    if (!trigger) return;
    var dropdown = trigger.closest('.form-dropdown');
    if (!dropdown) return;
    e.preventDefault();
    e.stopPropagation();
    if (dropdown.hasAttribute('data-open')) {
      dropdown.removeAttribute('data-open');
      removePortal();
    } else {
      openDropdown(dropdown);
    }
  });

  // Option selection — handle both buttons and links in dropdown lists
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest
      ? (e.target.closest('.form-dropdown-list button') || e.target.closest('.form-dropdown-list a'))
      : null;
    if (!btn) return;

    // Row-action dropdowns contain forms with submit buttons — let them submit normally.
    // Only intercept clicks for select-style form dropdowns (not action menus).
    var parentDropdown = btn.closest('.form-dropdown');
    if (parentDropdown && parentDropdown.classList.contains('row-actions-dd')) {
      // Close the dropdown, but let the form/HTMX handle the action
      parentDropdown.removeAttribute('data-open');
      removePortal();
      return;
    }

    // For buttons (form dropdowns): prevent default and stop propagation
    // For links (filter dropdowns with hx-get): just update the label, let HTMX handle navigation
    var isLink = btn.tagName === 'A';
    if (!isLink) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Check if this is a portal listbox click
    if (portalListbox && portalListbox.contains(btn) && portalDropdown) {
      // Row-action portals: close dropdown, let form/HTMX handle the action
      if (portalDropdown.classList.contains('row-actions-dd')) {
        portalDropdown.removeAttribute('data-open');
        removePortal();
        return;
      }
      selectOption(btn, portalDropdown);
      return;
    }

    // Regular (non-portal) dropdown
    var dropdown = btn.closest('.form-dropdown');
    if (dropdown) selectOption(btn, dropdown);
  });

  // Close on click outside
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.form-dropdown')) return;
    if (portalListbox && portalListbox.contains(e.target)) return;
    closeAll();
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });

  // Close portal when the DIALOG PANEL scrolls (position becomes stale)
  // But NOT when scrolling inside the portal listbox itself
  document.addEventListener('scroll', function (e) {
    if (!portalListbox) return;
    // Ignore scroll inside the portal listbox (user scrolling options)
    if (portalListbox.contains(e.target)) return;
    // Ignore scroll inside the original dropdown listbox
    if (portalDropdown && portalDropdown.contains(e.target)) return;
    closeAll();
  }, true);
})();

/* pignal - HTMX accessibility — announce content updates to screen readers */
(function () {
  var liveRegion = document.createElement('div');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('role', 'status');
  liveRegion.className = 'sr-only';
  liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
  document.body.appendChild(liveRegion);

  var clearTimer;
  document.body.addEventListener('htmx:afterSettle', function () {
    clearTimeout(clearTimer);
    liveRegion.textContent = 'Content updated';
    clearTimer = setTimeout(function () { liveRegion.textContent = ''; }, 3000);
  });
})();

/* pignal - header scroll border */
(function () {
  var header = document.querySelector('.source-header') || document.querySelector('header');
  if (!header) return;
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        header.classList.toggle('header-scrolled', window.scrollY > 20);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* pignal - source page filter bar active state management */
(function () {
  document.addEventListener('click', function (e) {
    // Filter chip: toggle active among siblings in filter-bar-chips
    var chip = e.target && e.target.closest ? e.target.closest('.filter-chip') : null;
    if (chip) {
      var bar = chip.closest('.filter-bar-chips');
      if (bar) {
        bar.querySelectorAll('.filter-chip').forEach(function (el) { el.classList.remove('active'); });
        chip.classList.add('active');
      }
    }

    // Dropdown item: mark active and update parent chip
    var dropdownItem = e.target && e.target.closest ? e.target.closest('.ws-dropdown-item') : null;
    if (dropdownItem) {
      var dropdown = dropdownItem.closest('.ws-dropdown');
      if (dropdown) {
        dropdown.querySelectorAll('.ws-dropdown-item').forEach(function (el) { el.classList.remove('active'); });
        dropdownItem.classList.add('active');
        // Also mark the parent workspace chip as active
        var bar2 = dropdown.closest('.filter-bar-chips');
        if (bar2) {
          bar2.querySelectorAll('.filter-chip').forEach(function (el) { el.classList.remove('active'); });
          var parentChip = dropdown.querySelector('.filter-chip');
          if (parentChip) parentChip.classList.add('active');
        }
      }
    }

    // Tag clear: remove the tag chip element immediately on click
    var tagClear = e.target && e.target.closest ? e.target.closest('.filter-tag-chip') : null;
    if (tagClear) {
      var tagEl = tagClear.closest('.filter-bar-tag');
      if (tagEl) tagEl.remove();
    }

    // Sort tab: toggle active
    var sortTab = e.target && e.target.closest ? e.target.closest('.feed-tab') : null;
    if (sortTab) {
      var tabContainer = sortTab.closest('.feed-tabs');
      if (tabContainer) {
        tabContainer.querySelectorAll('.feed-tab').forEach(function (el) { el.classList.remove('feed-tab-active'); });
        sortTab.classList.add('feed-tab-active');
      }
    }

    // Click outside dropdowns: close by blurring (mobile)
    if (!e.target || !e.target.closest || !e.target.closest('.ws-dropdown')) {
      document.querySelectorAll('.ws-dropdown').forEach(function (el) {
        if (el.contains(document.activeElement)) {
          document.activeElement.blur();
        }
      });
    }
  });
})();

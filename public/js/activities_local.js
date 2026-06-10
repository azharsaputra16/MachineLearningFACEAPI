document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'work_activities_v1';

  const inputEl = document.getElementById('activityNameInput');
  const addBtnEl = document.getElementById('addActivityBtn');

  // Integrasi session flag dari dashboard-work-timer.html
  // - activityLocked: setelah 1 aktivitas ditambahkan, input/tombol ditutup
  // - isStarted: harus klik "Mulai Kerja" dulu agar boleh input
  const session = window.__workSession || (window.__workSession = { isStarted: false, activityLocked: false });

  function applySessionLock() {
    const shouldDisable = !session.isStarted || session.activityLocked;
    if (inputEl) inputEl.disabled = shouldDisable;
    if (addBtnEl) addBtnEl.disabled = shouldDisable;
  }

  const listWrap = document.getElementById('activitiesListWrap');
  const activeLabel = document.getElementById('activeActivityLabel');

  // Timer elements (to show active activity in "Aktivitas Saat Ini")
  const sessionArea = document.getElementById('activeActivityInTimer');
  const sessionLabel = document.getElementById('activeActivityInTimerLabel');

  if (!inputEl || !addBtnEl || !listWrap || !activeLabel) return;

  const state = loadState();

  function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { items: [], activeId: null };

      const parsed = JSON.parse(raw);
      return {
        items: Array.isArray(parsed.items) ? parsed.items : [],
        activeId: parsed.activeId ?? null,
      };
    } catch {
      return { items: [], activeId: null };
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function hasAnyActivity() {
    return Array.isArray(state.items) && state.items.length > 0;
  }

  // Lock rule: setelah ada 1 aktivitas dalam sesi ini, tambah tidak boleh lagi.
  function syncLockFromState() {
    session.activityLocked = hasAnyActivity();
    applySessionLock();
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#039;');
  }

  function getActiveName() {
    const found = state.items.find((x) => x.id === state.activeId);
    return found ? found.name : null;
  }

  function renderActive() {
    const activeName = getActiveName();
    if (!activeName) {
      activeLabel.textContent = 'Belum memilih aktivitas';
      if (sessionArea) sessionArea.textContent = '—';
      if (sessionLabel) sessionLabel.textContent = 'Aktivitas Saat Ini:';
      return;
    }

    activeLabel.textContent = activeName;
    if (sessionArea) sessionArea.textContent = activeName;
  }

  function renderList() {
    if (state.items.length === 0) {
      listWrap.innerHTML = '';
      return;
    }

    listWrap.innerHTML = state.items
      .map((it) => {
        const checked = it.id === state.activeId;
        const safeName = escapeHtml(it.name);
        return `
          <div class="activity-item" data-id="${it.id}" style="display:flex; align-items:center; justify-content:space-between; gap: 1rem; padding: 0.9rem 1rem; background: #f8f9fa; border-radius: 14px; border: 1px solid #e9ecef; margin-bottom: 0.75rem;">
            <label style="display:flex; align-items:center; gap: 0.75rem; min-width: 0;">
              <input type="checkbox" class="activity-checkbox" ${checked ? 'checked' : ''} />
              <span class="activity-name" style="font-weight: 700; color: #333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${safeName}</span>
            </label>
            <button class="btn btn-small btn-danger" data-action="delete" style="padding: 0.6rem 1rem; border-radius: 12px;">Hapus</button>
          </div>
        `;
      })
      .join('');

    // Events
    listWrap.querySelectorAll('.activity-checkbox').forEach((cb) => {
      cb.addEventListener('change', () => {
        const wrap = cb.closest('.activity-item');
        if (!wrap) return;
        const id = wrap.getAttribute('data-id');
        state.activeId = id;
        saveState();
        renderActive();
        // re-render to update checkbox checked state
        renderList();
      });
    });

    listWrap.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const wrap = btn.closest('.activity-item');
        if (!wrap) return;
        const id = wrap.getAttribute('data-id');
        const toDelete = state.items.find((x) => x.id === id);
        if (!toDelete) return;

        if (!confirm(`Hapus aktivitas: ${toDelete.name}?`)) return;

        state.items = state.items.filter((x) => x.id !== id);
        if (state.activeId === id) state.activeId = null;
        saveState();

        // Jika aktivitas kosong, lock dilepas
        syncLockFromState();

        renderActive();
        renderList();
      });
    });
  }

  function addActivity() {
    // enforce: harus sudah started dan belum lock (1 aktivitas per sesi)
    if (!session.isStarted || session.activityLocked) {
      applySessionLock();
      return;
    }

    const name = (inputEl.value || '').trim();
    if (!name) {
      alert('Aktivitas tidak boleh kosong');
      inputEl.focus();
      return;
    }

    // memastikan hanya 1 aktivitas
    state.items = [];
    state.items.push({ id: uid(), name });
    state.activeId = state.items[0].id;

    saveState();
    inputEl.value = '';

    syncLockFromState();

    renderActive();
    renderList();
  }

  addBtnEl.addEventListener('click', (e) => {
    e.preventDefault();
    addActivity();
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addActivity();
    }
  });

  // init UI state
  renderActive();
  renderList();

  syncLockFromState();
  applySessionLock();
});


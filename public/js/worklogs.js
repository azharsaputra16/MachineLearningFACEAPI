document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.nama_panggilan) return;

  const namaPanggilan = currentUser.nama_panggilan;

  const els = {
    listWrap: document.getElementById('worklogsListWrap'),
    dateLabel: document.getElementById('worklogsDateLabel'),
  };
  if (!els.listWrap) return;

  const todayStr = new Date().toISOString().slice(0, 10);

  if (els.dateLabel) els.dateLabel.textContent = todayStr;

  async function loadWorklogs() {
    els.listWrap.innerHTML = '<div class="muted">Loading...</div>';

    const res = await fetch(`../api/worklog_list.php?nama_panggilan=${encodeURIComponent(namaPanggilan)}&work_date=${encodeURIComponent(todayStr)}`);
    const json = await res.json();

    if (!json.success) {
      els.listWrap.innerHTML = `<div class="muted">Gagal load: ${json.error || res.status}</div>`;
      return;
    }

    const items = json.items || [];
    if (items.length === 0) {
      els.listWrap.innerHTML = '<div class="muted">Belum ada aktivitas hari ini.</div>';
      return;
    }

    els.listWrap.innerHTML = items
      .map(
        (it) => `
          <div class="worklog-item" data-id="${it.id}">
            <div class="worklog-desc">${escapeHtml(it.description || '')}</div>
            <div class="worklog-meta">${formatDuration(it.seconds_worked || 0)} • ${formatMoney(it.earning || 0)}</div>
            <div class="worklog-actions">
              <button class="btn btn-small btn-secondary" data-action="edit" data-id="${it.id}">Edit</button>
              <button class="btn btn-small btn-danger" data-action="delete" data-id="${it.id}">Hapus</button>
            </div>
          </div>
        `
      )
      .join('');

    els.listWrap.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Hapus aktivitas ini?')) return;

        const res = await fetch('../api/worklog_delete.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        const json = await res.json();
        if (!json.success) {
          alert('Gagal hapus: ' + (json.error || res.status));
          return;
        }
        await loadWorklogs();
      });
    });

    els.listWrap.querySelectorAll('button[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const card = els.listWrap.querySelector(`.worklog-item[data-id="${id}"]`);
        if (!card) return;

        const desc = prompt('Edit deskripsi aktivitas:', card.querySelector('.worklog-desc')?.textContent || '');
        if (desc === null) return;

        // Untuk versi sederhana: seconds & earning tidak diubah dari UI (tetap dari sesi).
        // Tapi tetap kita kirim seconds/earning current dari card.
        // Parse number dari teks meta: fallback 0.
        const meta = card.querySelector('.worklog-meta')?.textContent || '';
        const seconds = extractSeconds(meta);
        const earning = extractMoney(meta);

        const res = await fetch('../api/worklog_update.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: Number(id),
            description: desc.trim(),
            seconds_worked: seconds,
            earning: earning
          })
        });

        const json = await res.json();
        if (!json.success) {
          alert('Gagal edit: ' + (json.error || res.status));
          return;
        }
        await loadWorklogs();
      });
    });
  }

  // Helpers
  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '<')
      .replaceAll('>', '>')
      .replaceAll('"', '"')
      .replaceAll("'", '&#039;');
  }

  function formatDuration(seconds) {
    const sec = Number(seconds) || 0;
    const mins = Math.floor(sec / 60);
    const remainSec = sec % 60;
    if (mins <= 0) return `${sec}s`;
    return `${mins} menit${remainSec ? ` ${remainSec}s` : ''}`;
  }

  function formatMoney(val) {
    const num = Number(val) || 0;
    return `Rp ${num.toLocaleString()}`;
  }

  function extractSeconds(text) {
    // Cari pola "X menit" atau "Xs"
    const m1 = text.match(/(\d+)\s*menit/);
    if (m1) {
      const mins = Number(m1[1]);
      const m2 = text.match(/\s(\d+)s/);
      const extra = m2 ? Number(m2[1]) : 0;
      return mins * 60 + extra;
    }
    const m3 = text.match(/(\d+)s/);
    return m3 ? Number(m3[1]) : 0;
  }

  function extractMoney(text) {
    // cari digit sebelum ,
    const cleaned = String(text).replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(/,/g, '.');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
  }

  loadWorklogs();
});



document.addEventListener('DOMContentLoaded', function () {

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!currentUser.id) {
        alert("User belum login!");
        window.location.href = 'ml-index.html';
        return;
    }

    const userId = currentUser.id;
    const namaPanggilan = currentUser.nama_panggilan || '';


    function updateDashboard(data) {
        const totalSeconds = Number(data.total_seconds ?? 0) || 0;
        const totalEarning = Number(data.total_earning ?? 0) || 0;

        document.getElementById('saldoKerja').textContent = `Rp ${totalEarning.toLocaleString()}`;

        const hours = Math.floor(totalSeconds / 3600);
        const days = Math.floor(hours / 24);

        document.getElementById('jamKerja').textContent = `${hours} jam`;
        document.getElementById('waktuKerja').textContent = `${days} hari`;

        document.getElementById('bonus').textContent = `Rp ${(totalEarning * 0.1).toLocaleString()}`;
        document.getElementById('userGreeting').textContent = `Selamat datang, ${currentUser.nama_panggilan || 'User'}`;
    }

    fetch(`../api/get_workdata.php?user_id=${userId}&nama_panggilan=${encodeURIComponent(namaPanggilan)}`)
        .then(res => res.json())
        .then(updateDashboard)
        .catch(() => updateDashboard({}));

    document.getElementById('logoutBtn').onclick = function () {
        localStorage.clear();
        window.location.href = 'ml-index.html';
    };

    // ==========================
    // Worklogs Table (Dashboard)
    // ==========================
    const worklogsLoading = document.getElementById('worklogsLoading');
    const worklogsEmpty = document.getElementById('worklogsEmpty');
    const worklogsTable = document.getElementById('worklogsTable');
    const worklogsTableBody = document.getElementById('worklogsTableBody');

    function formatDuration(seconds) {
        const sec = Number(seconds) || 0;
        const mins = Math.floor(sec / 60);
        const remainSec = sec % 60;
        if (mins <= 0) return `${sec}s`;
        if (mins < 60) return `${mins} menit${remainSec ? ` ${remainSec}s` : ''}`;
        const hours = Math.floor(mins / 60);
        const rMins = mins % 60;
        return `${hours} jam${rMins ? ` ${rMins} menit` : ''}`;
    }

    function formatMoney(val) {
        const num = Number(val) || 0;
        return `Rp ${num.toLocaleString()}`;
    }

    function escapeHtml(str) {
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '<')
            .replaceAll('>', '>')
            .replaceAll('"', '"')
            .replaceAll("'", '&#039;');
    }




    async function loadWorklogs() {
        console.log('[dashboard] loadWorklogs start, namaPanggilan=', namaPanggilan);
        if (!namaPanggilan) {


            if (worklogsLoading) worklogsLoading.textContent = 'Nama panggilan tidak ditemukan';
            if (worklogsEmpty) worklogsEmpty.style.display = 'block';
            return;
        }

        if (worklogsLoading) worklogsLoading.style.display = 'block';
        if (worklogsEmpty) worklogsEmpty.style.display = 'none';
        if (worklogsTable) worklogsTable.style.display = 'none';
        if (worklogsTableBody) worklogsTableBody.innerHTML = '';

        try {
            let res;
            try {
                res = await fetch(`../api/worklog_list.php?nama_panggilan=${encodeURIComponent(namaPanggilan)}`);
            } catch (err) {
                console.error('worklog_list fetch failed (network):', err);
                throw err;
            }

            let json;
            try {
                json = await res.json();
            } catch (err) {
                console.error('worklog_list fetch failed (invalid JSON):', err);
                throw err;
            }

            if (!res.ok) {
                console.error('worklog_list http error:', res.status, json);
            }




            if (!json.success) {

                if (worklogsLoading) worklogsLoading.textContent = `Gagal load: ${json.error || res.status}`;
                return;
            }

            const items = json.items || [];

            if (!items.length) {
                if (worklogsLoading) worklogsLoading.style.display = 'none';
                if (worklogsEmpty) worklogsEmpty.style.display = 'block';
                return;
            }

            if (worklogsLoading) worklogsLoading.style.display = 'none';
            if (worklogsEmpty) worklogsEmpty.style.display = 'none';
            if (worklogsTable) worklogsTable.style.display = 'table';

            worklogsTableBody.innerHTML = items.map((it) => {
                const id = it.id;
                const date = it.work_date || '';
                const desc = escapeHtml(it.description || '');
                const duration = formatDuration(it.seconds_worked || 0);
                const earning = formatMoney(it.earning || 0);

                return `
                    <tr>
                        <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">${escapeHtml(date)}</td>
                        <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">${desc}</td>
                        <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">${escapeHtml(duration)}</td>
                        <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">${escapeHtml(earning)}</td>
                        <td style="padding: 0.75rem; border-bottom: 1px solid #eee; text-align:center;">
                            <button class="btn btn-small btn-danger" data-action="delete" data-id="${id}" style="padding: 0.5rem 0.9rem; border-radius: 10px; background:#e53e3e; color:white; border:none; cursor:pointer;">Hapus</button>
                        </td>
                    </tr>
                `;
            }).join('');

            // attach delete handlers
            worklogsTableBody.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (!id) return;
                    if (!confirm('Hapus aktivitas ini?')) return;

                    const delRes = await fetch('../api/worklog_delete.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: Number(id) })
                    });

                    const delJson = await delRes.json();
                    if (!delJson.success) {
                        alert('Gagal hapus: ' + (delJson.error || delRes.status));
                        return;
                    }

                    await loadWorklogs();

                });
            });
        } catch (e) {
            if (worklogsLoading) {
                worklogsLoading.textContent = 'Gagal memuat data.';
            }
        }
    }

    // ==========================
    // Withdraw (Tarik Uang)
    // ==========================
    async function refreshDashboard() {
        const res = await fetch(`../api/get_workdata.php?user_id=${userId}&nama_panggilan=${encodeURIComponent(namaPanggilan)}`);
        const json = await res.json();
        updateDashboard(json);
        return json;
    }

    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', async () => {
            const ok = confirm('Apakah Anda yakin ingin menarik seluruh saldo kerja?');
            if (!ok) return;

            if (!namaPanggilan) {
                alert('Nama panggilan tidak ditemukan.');
                return;
            }

            try {
                // Get latest saldo_kerja and jam_kerja
                const latest = await refreshDashboard();
                const saldoKerja = Number(latest.total_earning ?? 0) || 0;
                const bonus = saldoKerja * 0.1;

                if (saldoKerja === 0 && bonus === 0) {
                    alert('Tidak ada saldo yang dapat ditarik.');
                    return;
                }

                const withdrawRes = await fetch('../api/withdraw_work.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nama_panggilan: namaPanggilan })
                });

                const withdrawJson = await withdrawRes.json();
                if (!withdrawJson.success) {
                    alert(withdrawJson.error || 'Gagal melakukan penarikan.');
                    return;
                }

                await refreshDashboard();
                alert('Penarikan berhasil. Uang akan masuk ke rekening kerja Anda.');
            } catch (e) {
                console.error('withdraw failed:', e);
                alert('Terjadi kesalahan saat melakukan penarikan.');
            }
        });
    }

    loadWorklogs();

});




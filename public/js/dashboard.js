document.addEventListener('DOMContentLoaded', function () {

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if (!currentUser.id) {
        alert("User belum login!");
        window.location.href = 'ml-index.html';
        return;
    }

    const userId = currentUser.id;

    function updateDashboard(data) {
        const totalSeconds = data.total_seconds || 0;
        const totalEarning = parseFloat(data.total_earning || 0);

        document.getElementById('saldoKerja').textContent = `Rp ${totalEarning.toLocaleString()}`;

        const hours = Math.floor(totalSeconds / 3600);
        const days = Math.floor(hours / 24);

        document.getElementById('jamKerja').textContent = `${hours} jam`;
        document.getElementById('waktuKerja').textContent = `${days} hari`;

        document.getElementById('bonus').textContent = `Rp ${(totalEarning * 0.1).toLocaleString()}`;
        document.getElementById('userGreeting').textContent = `Selamat datang, ${currentUser.nama_panggilan}`;
    }

fetch(`../api/get_workdata.php?user_id=${userId}`)
        .then(res => res.json())
        .then(updateDashboard)
        .catch(() => updateDashboard({}));

    document.getElementById('logoutBtn').onclick = function () {
        localStorage.clear();
        window.location.href = 'ml-index.html';
    };

});

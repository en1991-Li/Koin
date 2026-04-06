// 初始化圖標
lucide.createIcons();

// 初始化圖表 (對照 IMG_1144)
const ctx = document.getElementById('mainChart').getContext('2d');
new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['3/17', '3/18', '3/19', '3/20', '3/21', '3/22', '3/23', '3/24', '3/25', '3/26'],
        datasets: [{
            data: [1000, 8000, 7500, 7200, 7000, 6800, 6500, 6200, 6000, 6000],
            borderColor: '#a78bfa',
            borderWidth: 3,
            pointRadius: 0,
            fill: false,
            tension: 0.4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { display: true, grid: { display: false } }, y: { display: false } }
    }
});

// 分頁控制
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    lucide.createIcons();
}

// 實時更新新增頁面的大數字
document.getElementById('in-amount').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) || 0;
    const display = document.getElementById('add-display-amount');
    display.innerText = val.toLocaleString();
    
    const isCredit = document.getElementById('in-is-credit').checked;
    display.className = 'val ' + (isCredit ? 'text-red' : 'text-green');
});

// 模擬專案列表數據 (IMG_1150)
const projects = [
    { name: '生活開銷', amount: 28647, icon: 'wine' },
    { name: '投資理財', amount: 0, icon: 'trending-up' },
    { name: '工作', amount: 0, icon: 'briefcase' },
    { name: '玩樂', amount: 30, icon: 'film', color: 'text-red' }
];

function renderProjects() {
    const container = document.getElementById('project-list');
    container.innerHTML = projects.map(p => `
        <div class="project-row">
            <div style="display:flex; align-items:center; gap:15px;">
                <div class="icon-circle" style="background:#2a2a3c; padding:10px; border-radius:50%">
                    <i data-lucide="${p.icon}" style="width:18px"></i>
                </div>
                <div>
                    <div style="font-weight:600">${p.name}</div>
                    <div style="font-size:11px; color:var(--text-muted)">26/03/01 - 26/03/31</div>
                </div>
            </div>
            <div class="${p.color || 'text-green'}" style="font-weight:700">$${p.amount.toLocaleString()}</div>
        </div>
    `).join('');
    lucide.createIcons();
}

renderProjects();

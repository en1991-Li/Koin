// 專案數據
const projectData = [
    { name: "生活開銷", icon: "glass-water", date: "26/04/01 － 26/04/30", amount: 28647, color: "text-green" },
    { name: "投資理財", icon: "trending-up", date: "26/04/01 － 26/04/30", amount: 0, color: "text-green" },
    { name: "工作", icon: "briefcase", date: "26/04/01 － 26/04/30", amount: 0, color: "text-green" },
    { name: "玩樂", icon: "film", date: "26/04/01 － 26/04/30", amount: 30, color: "text-red" },
    { name: "旅遊", icon: "car", date: "26/04/01 － 26/04/30", amount: 0, color: "text-green" },
    { name: "家用", icon: "users", date: "26/04/01 － 26/04/30", amount: 0, color: "text-green" },
    { name: "每月統計", icon: "calendar-days", date: "26/04/01 － 26/04/30", amount: 28617, color: "text-green", isStats: true },
    { name: "學習", icon: "pen-tool", date: "26/04/01 － 26/04/30", amount: 0, color: "text-green" }
];

function renderProjects() {
    const container = document.getElementById('projects-list-container');
    if (!container) return;

    let html = `<div class="list-divider" style="padding: 15px 20px; color: #888;">－ 進行中 (8)</div>`;

    projectData.forEach(proj => {
        html += `
            <div class="project-item" style="display: flex; align-items: center; padding: 15px 20px; gap: 15px;">
                <div class="proj-icon-box" style="width: 45px; height: 45px; background: #39394d; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${proj.icon}" style="width: 20px; color: #fff;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 16px; font-weight: 500; color: #fff;">${proj.name}</div>
                    <div style="font-size: 12px; color: #888; margin-top: 4px;">${proj.date}</div>
                </div>
                <div style="text-align: right;">
                    <div class="${proj.color}" style="font-size: 16px; font-weight: bold;">$${proj.amount.toLocaleString()}</div>
                    ${proj.isStats ? '<span style="background: #5d5dff; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 10px; margin-top: 4px; display: inline-block;">統計專案</span>' : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    // 重新觸發 Lucide 圖示渲染
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// 初始化渲染
document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    
    // 監聽導覽列狀態切換
    const originalShowPage = window.showPage;
    window.showPage = function(pageId) {
        if (originalShowPage) originalShowPage(pageId);
        
        // 更新導覽列 active 狀態
        document.querySelectorAll('.tab-item').forEach((item, index) => {
            item.classList.remove('active');
            if (pageId === 'page-overview' && index === 0) item.classList.add('active');
            if (pageId === 'page-projects' && index === 1) item.classList.add('active');
        });
    };
});

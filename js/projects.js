/**
 * 專案總覽渲染邏輯 - projects.js
 */

// 1. 預設數據
const defaultProjects = [
    { name: "生活開銷", icon: "glass-water", date: "26/04/01 － 26/04/30", amount: 0, type: 'expense' },
    { name: "投資理財", icon: "trending-up", date: "26/04/01 － 26/04/30", amount: 0, type: 'neutral' },
    { name: "工作", icon: "briefcase", date: "26/04/01 － 26/04/30", amount: 0, type: 'neutral' },
    { name: "玩樂", icon: "film", date: "26/04/01 － 26/04/30", amount: 0, type: 'income' },
    { name: "旅遊", icon: "palmtree", date: "26/04/01 － 26/04/30", amount: 0, type: 'neutral' },
    { name: "家用", icon: "users", date: "26/04/01 － 26/04/30", amount: 0, type: 'neutral' },
    { name: "每月統計", icon: "calendar-days", date: "26/04/01 － 26/04/30", amount: 0, type: 'expense', isStats: true },
    { name: "學習", icon: "pen-tool", date: "26/04/01 － 26/04/30", amount: 0, type: 'neutral' }
];

function renderProjectsPage() {
    const container = document.getElementById('projects-list-container');
    if (!container) return;

    // 取得資料
    let projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
    if (projects.length === 0) {
        projects = defaultProjects;
    }

    let html = '';
    projects.forEach(proj => {
        const iconName = proj.icon || 'piggy-bank';
        const displayDate = proj.date || "2026/04/01 － 2026/04/30";
        const amount = proj.amount || 0;
        
        // 顏色邏輯
        let amountColor = '#ffffff';
        if (proj.type === 'expense') amountColor = '#ff5b5b';
        if (proj.type === 'income') amountColor = '#94d34d';

        html += `
            <div class="project-row" style="display: flex; align-items: center; padding: 18px 20px; border-bottom: 0.5px solid #2c2c3e;">
                <div style="width: 44px; height: 44px; background: #2c2c3e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <i data-lucide="${iconName}" style="width: 20px; height: 20px; color: #fff;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="color: #fff; font-size: 16px; font-weight: 500; margin-bottom: 4px;">${proj.name}</div>
                    <div style="color: #8a8a8e; font-size: 12px;">${displayDate}</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: ${amountColor}; font-size: 17px; font-weight: 600;">$${amount.toLocaleString()}</div>
                    ${proj.isStats ? `
                        <div style="display: inline-block; background: #56aaff; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 6px; margin-top: 5px; font-weight: bold;">
                            統計專案
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 監聽 DOM 加載執行渲染
document.addEventListener('DOMContentLoaded', renderProjectsPage);

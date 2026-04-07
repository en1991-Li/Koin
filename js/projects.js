/**
 * 專案總覽渲染邏輯
 */

// 1. 模擬專案數據
const projectData = [
    { name: "生活開銷", icon: "glass-water", date: "26/03/01 － 26/03/31", amount: 0, type: 'expense' },
    { name: "投資理財", icon: "trending-up", date: "26/03/01 － 26/03/31", amount: 0, type: 'neutral' },
    { name: "工作", icon: "briefcase", date: "26/03/01 － 26/03/31", amount: 0, type: 'neutral' },
    { name: "玩樂", icon: "film", date: "26/03/01 － 26/03/31", amount: 0, type: 'income' },
    { name: "旅遊", icon: "airplane", date: "26/03/01 － 26/03/31", amount: 0, type: 'neutral' },
    { name: "家用", icon: "users", date: "26/03/01 － 26/03/31", amount: 0, type: 'neutral' },
    { name: "每月統計", icon: "calendar-days", date: "26/03/01 － 26/03/31", amount: 0, type: 'expense', isStats: true },
    { name: "學習", icon: "pen-tool", date: "26/03/01 － 26/03/31", amount: 0, type: 'neutral' }
];

// 2. 渲染函數
function renderProjectsPage() {
    const container = document.getElementById('projects-list-container');
    if (!container) return;

    let html = `
        <div style="padding: 15px 20px; color: #8a8a8e; font-size: 14px; border-bottom: 1px solid #2c2c3e;">
            － 進行中 (8)
        </div>
    `;

    projectData.forEach(proj => {
        // 判斷金額顏色
        let amountColor = '#94d34d'; // 預設綠色
        if (proj.isStats) amountColor = '#94d34d';

        html += `
            <div class="project-row" style="display: flex; align-items: center; padding: 18px 20px; border-bottom: 0.5px solid #2c2c3e;">
                <div style="width: 44px; height: 44px; background: #2c2c3e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <i data-lucide="${proj.icon}" style="width: 20px; height: 20px; color: #fff;"></i>
                </div>
                
                <div style="flex: 1;">
                    <div style="color: #fff; font-size: 16px; font-weight: 500; margin-bottom: 4px;">${proj.name}</div>
                    <div style="color: #8a8a8e; font-size: 12px;">${proj.date}</div>
                </div>
                
                <div style="text-align: right;">
                    <div style="color: ${amountColor}; font-size: 17px; font-weight: 600;">$${proj.amount.toLocaleString()}</div>
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
    
    // 重新載入 Lucide 圖示
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// 3. 強化 showPage 函數以處理導覽列 active 狀態
const originalShowPage = window.showPage;
window.showPage = function(pageId) {
    // 呼叫原本的切換邏輯
    if (typeof originalShowPage === 'function') {
        originalShowPage(pageId);
    } else {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
    }

    // 更新導覽列圖示的高亮狀態
    const tabs = document.querySelectorAll('.tab-bar .tab-item');
    tabs.forEach(tab => tab.classList.remove('active'));

    if (pageId === 'page-overview') tabs[0].classList.add('active');
    if (pageId === 'page-projects') tabs[1].classList.add('active');
};

// 4. 初始化
document.addEventListener('DOMContentLoaded', renderProjectsPage);

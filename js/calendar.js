/**
 * 日曆詳細記錄渲染邏輯
 */

// 1. 模擬記錄數據
const recordData = [
    { name: "每月統計", icon: "calendar-days", remark: "專案總額 $24,209", expense: "$5,462", income: "$200", isStats: true },
    { name: "95無鉛", icon: "fuel", remark: "中油", expense: "$1,500", tags: ['工作', '行動捷利卡'] },
    { name: "Youtube", icon: "youtube", remark: "週期 #49 / 無限期", expense: "$404", tags: ['玩樂', '玉山 Only'] },
    { name: "午餐", icon: "pizza", remark: "麥當勞・#LinePay", expense: "$170", tags: ['生活', '玉山 UNI'] },
    { name: "統一發票中獎", icon: "banknote", remark: "", income: "$200", tags: ['投資', '玉山銀行'] },
    { name: "電費", icon: "zap", remark: "台灣電力・#3月, #4月", expense: "$2,569", tags: ['家用', '玉山 Only'] }
];

function renderCalendarDetails() {
    const container = document.getElementById('calendar-details-container');
    if (!container) return;

    // A. 模擬日曆視圖 (精簡版)
    let html = `
        <div class="calendar-view" style="padding: 10px 15px; background: #1c1c28; border-bottom: 1px solid #2c2c3e; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-around; font-size: 11px; color: #888; margin-bottom: 15px;">
                <span>週日</span><span>週一</span><span>週二</span><span>週三</span><span>週四</span><span>週五</span><span>週六</span>
            </div>
            <div style="display: flex; justify-content: space-around; align-items: center; font-size: 16px;">
                <span class="text-red">6月</span>
                <div style="width: 32px; height: 32px; border: 2px solid #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold;">02</div>
                <span style="color: #fff;">03</span><span style="color: #fff;">04</span><span style="color: #fff;">05</span><span style="color: #888;">06</span><span style="color: #888;">07</span>
            </div>
        </div>
    `;

    // B. 收支記錄列表
    recordData.forEach(rec => {
        const isExpense = rec.expense && !rec.income;
        const mainAmount = rec.expense || rec.income;
        const amountColor = isExpense ? 'text-red' : 'text-green';

        html += `
            <div class="record-item" style="display: flex; align-items: start; padding: 15px 20px; border-bottom: 0.5px solid #2c2c3e;">
                <div class="rec-icon-box" style="width: 44px; height: 44px; background: #39394d; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
                    <i data-lucide="${rec.icon}" style="width: 22px; color: #fff;"></i>
                </div>
                
                <div style="flex: 1;">
                    <div style="color: #fff; font-size: 16px; font-weight: 500; margin-bottom: 4px;">
                        ${rec.name} ${rec.isStats ? '<span style="font-size:11px; color:#aaa; margin-left: 5px; font-weight:normal;">26</span>' : ''}
                    </div>
                    <div style="color: #888; font-size: 12px; margin-bottom: 8px;">${rec.remark}</div>
                    
                    ${rec.tags ? `
                        <div style="display: flex; gap: 5px;">
                            ${rec.tags.map(tag => `<span style="border: 1px solid #555; color: #aaa; font-size: 10px; padding: 1px 6px; border-radius: 10px;">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div style="text-align: right; flex-shrink: 0;">
                    ${rec.isStats ? `
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="text-red" style="font-size: 16px; font-weight: bold;">${rec.expense}</span>
                            <span class="text-green" style="font-size: 16px; font-weight: bold;">${rec.income}</span>
                        </div>
                    ` : `
                        <div class="${amountColor}" style="font-size: 17px; font-weight: bold; margin-bottom: 4px;">${mainAmount}</div>
                    `}
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

// 2. 初始化與連動
document.addEventListener('DOMContentLoaded', () => {
    // 渲染頁面
    renderCalendarDetails();
    
    // 監聽中間按鈕狀態高亮 (選配，確保滑動切換時中間按鈕變色)
    const originalShowPage = window.showPage;
    window.showPage = function(pageId) {
        if (originalShowPage) originalShowPage(pageId);
        
        // 更新中間按鈕 active 狀態
        const fab = document.querySelector('.tab-fab');
        if (fab) {
            if (pageId === 'page-calendar') {
                fab.classList.add('active');
            } else {
                fab.classList.remove('active');
            }
        }
    };
});

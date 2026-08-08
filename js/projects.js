/**
 * 專案總覽渲染邏輯 - projects.js
 */

// 1. 預設數據：確保第一次開啟時有內容
const defaultProjects = [
    { name: "生活開銷", icon: "beer", date: "26/04/01 － 26/04/30", amount: 0, type: 'expense' },
    { name: "投資理財", icon: "trending-up", date: "26/04/01 － 26/04/30", amount: 0, type: 'neutral' },
    { name: "工作", icon: "briefcase-business", date: "26/04/01 － 26/04/30", amount: 0, type: 'neutral' },
    { name: "玩樂", icon: "gamepad-2", date: "26/04/01 － 26/04/30", amount: 0, type: 'income' },
    { name: "旅遊", icon: "plane", date: "26/04/01 － 26/04/30", amount: 0, type: 'neutral' },
    { name: "家用", icon: "users", date: "26/04/01 － 26/04/30", amount: 0, type: 'neutral' },
    { name: "每月統計", icon: "calendar-days", date: "26/04/01 － 26/04/30", amount: 0, type: 'expense', isStats: true },
    { name: "學習", icon: "pencil-ruler", date: "26/04/01 － 26/04/30", amount: 0, type: 'neutral' }
];

function renderProjectsPage() {
    const container = document.getElementById('projects-list-container');
    if (!container) return;

    // 取得資料：優先從 LocalStorage 讀取，若無則使用預設數據
    let projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
    if (projects.length === 0) {
        projects = defaultProjects;
    }

    let html = '';
    projects.forEach(proj => {
        const iconName = proj.icon || 'piggy-bank';
        const displayDate = proj.date || "2026/04/01 － 2026/04/30";
        const amount = proj.amount || 0;
        
        // 根據類型判斷文字顏色
        let amountColor = '#ffffff'; 
        if(proj.type === 'expense') amountColor = '#ff5b5b';
        if(proj.type === 'income') amountColor = '#94d34d';

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

    // 重新渲染 Lucide 圖示
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// 監聽 DOM 加載完成後執行一次渲染
document.addEventListener('DOMContentLoaded', renderProjectsPage);

// 全域專案明細檢視狀態
let currentDetailProjectName = '生活開銷';
let currentDetailProjectMonth = new Date();

/**
 * 渲染專案列表（更新點擊事件，指向 openProjectDetail）
 */
function renderProjectsPage() {
    const container = document.getElementById('projects-list-container');
    if (!container) return;

    const projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
    const records = JSON.parse(localStorage.getItem('koin_records') || '[]');

    let html = `
        <div style="padding: 15px 15px 5px 15px; color: #8e8e93; font-size: 13px; font-weight: 700;">
            － 進行中 (${projects.length + 1})
        </div>
        <div class="form-group" style="background: #1c1c28; border-radius: 20px; padding: 0 16px; margin: 0 15px 15px 15px;">
    `;

    // 預設「生活開銷」專案
    const defaultRecords = records.filter(r => (r.project || '生活開銷') === '生活開銷');
    const defaultTotal = defaultRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    html += `
        <div class="form-row" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="openProjectDetail('生活開銷')">
            <div style="display: flex; align-items: center; gap: 14px;">
                <div style="background: #2c2c3e; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="piggy-bank" style="width: 22px; height: 22px; color: #ffffff;"></i>
                </div>
                <div>
                    <div style="font-size: 16px; font-weight: 600; color: #ffffff;">生活開銷</div>
                    <div style="font-size: 11px; color: #8e8e93;">26/08/01 － 26/08/31</div>
                </div>
            </div>
            <span style="font-weight: 700; font-size: 17px; color: #fb7185;">$${defaultTotal.toLocaleString()}</span>
        </div>
    `;

    // 使用者建立的專案
    projects.forEach((proj, idx) => {
        const projRecords = records.filter(r => r.project === proj.name);
        const projTotal = projRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        const isLast = (idx === projects.length - 1);

        html += `
            <div class="form-row" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'}; cursor: pointer;" onclick="openProjectDetail('${proj.name}')">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="background: #2c2c3e; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="${proj.icon || 'piggy-bank'}" style="width: 22px; height: 22px; color: #ffffff;"></i>
                    </div>
                    <div>
                        <div style="font-size: 16px; font-weight: 600; color: #ffffff;">${proj.name}</div>
                        <div style="font-size: 11px; color: #8e8e93;">26/08/01 － 26/08/31</div>
                    </div>
                </div>
                <span style="font-weight: 700; font-size: 17px; color: ${projTotal > 0 ? '#fb7185' : '#4ade80'};">$${projTotal.toLocaleString()}</span>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 開啟專案明細頁
 */
function openProjectDetail(projectName) {
    currentDetailProjectName = projectName;
    renderProjectDetailView();
    showPage('page-project-detail');
}

/**
 * 切換專案明細月份
 */
function changeProjectDetailMonth(dir) {
    currentDetailProjectMonth.setMonth(currentDetailProjectMonth.getMonth() + dir);
    renderProjectDetailView();
}

/**
 * 專案明細頁動態計算與渲染引擎
 */
function renderProjectDetailView() {
    const titleEl = document.getElementById('proj-detail-title');
    const dateRangeEl = document.getElementById('proj-detail-date-range');
    const container = document.getElementById('proj-detail-categories-container');
    if (!container) return;

    if (titleEl) titleEl.innerText = currentDetailProjectName;

    // 格式化日期區間
    const year = currentDetailProjectMonth.getFullYear();
    const month = currentDetailProjectMonth.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    const formattedMonth = String(month).padStart(2, '0');
    if (dateRangeEl) {
        dateRangeEl.innerText = `${year}/${formattedMonth}/01 － ${year}/${formattedMonth}/${lastDay}`;
    }

    // 撈出對應專案的交易紀錄
    const records = JSON.parse(localStorage.getItem('koin_records') || '[]');
    const projRecords = records.filter(r => (r.project || '生活開銷') === currentDetailProjectName);

    // 計算出帳/入帳/總計
    let outTotal = 0, outCount = 0;
    let inTotal = 0, inCount = 0;

    projRecords.forEach(r => {
        const amt = parseFloat(r.amount) || 0;
        if (r.type === '支出' || r.type === '應付款項') {
            outTotal += amt;
            outCount++;
        } else if (r.type === '收入' || r.type === '應收款項') {
            inTotal += amt;
            inCount++;
        }
    });

    const netTotal = outTotal - inTotal;

    // 更新 Hero 統計卡片
    if (document.getElementById('proj-detail-out-count')) document.getElementById('proj-detail-out-count').innerText = outCount;
    if (document.getElementById('proj-detail-out-total')) document.getElementById('proj-detail-out-total').innerText = `-$${outTotal.toLocaleString()}`;
    if (document.getElementById('proj-detail-in-count')) document.getElementById('proj-detail-in-count').innerText = inCount;
    if (document.getElementById('proj-detail-in-total')) document.getElementById('proj-detail-in-total').innerText = `$${inTotal.toLocaleString()}`;
    if (document.getElementById('proj-detail-total-count')) document.getElementById('proj-detail-total-count').innerText = projRecords.length;
    if (document.getElementById('proj-detail-net-total')) document.getElementById('proj-detail-net-total').innerText = `-$${netTotal.toLocaleString()}`;

    // 更新專案預算 Hero 區塊
    if (document.getElementById('proj-detail-budget-name')) document.getElementById('proj-detail-budget-name').innerText = currentDetailProjectName;
    if (document.getElementById('proj-detail-budget-count')) document.getElementById('proj-detail-budget-count').innerText = projRecords.length;
    if (document.getElementById('proj-detail-budget-amount')) document.getElementById('proj-detail-budget-amount').innerText = `$${outTotal.toLocaleString()}`;

    // ==========================================
    // 10 大主分類圖標與顏色映射表
    // ==========================================
    const categoryConfig = {
        '飲食': { icon: 'utensils', bg: 'i-income-gold' },
        '交通': { icon: 'car', bg: 'i-transport' },
        '娛樂': { icon: 'party-popper', bg: 'i-entertainment' },
        '購物': { icon: 'shopping-bag', bg: 'i-shopping' },
        '個人': { icon: 'user', bg: 'i-personal' },
        '醫療': { icon: 'stethoscope', bg: 'i-medical' },
        '家居': { icon: 'home', bg: 'i-home' },
        '家庭': { icon: 'users', bg: 'i-family' },
        '生活': { icon: 'coffee', bg: 'i-life' },
        '學習': { icon: 'book', bg: 'i-learn' },
        '其他': { icon: 'tag', bg: 'i-income-gold' }
    };

    const allCategories = ['飲食', '交通', '娛樂', '購物', '個人', '醫療', '家居', '家庭', '生活', '學習', '其他'];
    const categoryStats = {};

    allCategories.forEach(cat => {
        categoryStats[cat] = { count: 0, amount: 0 };
    });

    projRecords.forEach(r => {
        const cat = r.category || '其他';
        if (!categoryStats[cat]) categoryStats[cat] = { count: 0, amount: 0 };
        categoryStats[cat].count++;
        categoryStats[cat].amount += parseFloat(r.amount) || 0;
    });

    const activeCategories = [];
    const inactiveCategories = [];

    Object.keys(categoryStats).forEach(cat => {
        if (categoryStats[cat].count > 0) {
            activeCategories.push({ name: cat, ...categoryStats[cat] });
        } else {
            inactiveCategories.push({ name: cat, ...categoryStats[cat] });
        }
    });

    // 建構列表 HTML
    let listHTML = '';

    // 1. 未分配預算 (有交易紀錄的分類)
    if (activeCategories.length > 0) {
        listHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; color: #8e8e93; font-size: 13px; font-weight: 700; margin-bottom: 8px; padding: 0 4px;">
                <span>未分配預算 <span style="background: #39394d; color: #a78bfa; padding: 1px 6px; border-radius: 10px; font-size: 10px;">${activeCategories.length}</span></span>
                <i data-lucide="chevron-up" style="width: 16px;"></i>
            </div>
            <div class="form-group" style="background: #1c1c28; border-radius: 16px; padding: 0 16px; margin-bottom: 20px;">
        `;

        activeCategories.forEach((cat, idx) => {
            const isLast = (idx === activeCategories.length - 1);
            const config = categoryConfig[cat.name] || { icon: 'tag', bg: 'i-income-gold' };

            listHTML += `
                <div class="form-row" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'};">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="cate-icon-wrapper ${config.bg}" style="width: 38px; height: 38px; margin: 0;">
                            <i data-lucide="${config.icon}"></i>
                        </div>
                        <div>
                            <div style="font-size: 15px; font-weight: 600; color: #fff;">${cat.name}</div>
                            <div style="font-size: 11px; color: #8e8e93;">${cat.count} 筆記錄</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #fb7185; font-size: 16px; font-weight: 700;">$${cat.amount.toLocaleString()}</div>
                        <div style="font-size: 10px; color: #8e8e93;">未分配</div>
                    </div>
                </div>
            `;
        });

        listHTML += `</div>`;
    }

    // 2. 未設定預算 (無交易紀錄的分類，使用對應主分類圖標與漸層)
    if (inactiveCategories.length > 0) {
        listHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; color: #8e8e93; font-size: 13px; font-weight: 700; margin-bottom: 8px; padding: 0 4px;">
                <span>未設定預算 <span style="background: #39394d; color: #5d5dff; padding: 1px 6px; border-radius: 10px; font-size: 10px;">${inactiveCategories.length}</span></span>
                <i data-lucide="chevron-up" style="width: 16px;"></i>
            </div>
            <div class="form-group" style="background: #1c1c28; border-radius: 16px; padding: 0 16px; margin-bottom: 20px;">
        `;

        inactiveCategories.forEach((cat, idx) => {
            const isLast = (idx === inactiveCategories.length - 1);
            const config = categoryConfig[cat.name] || { icon: 'tag', bg: 'i-income-gold' };

            listHTML += `
                <div class="form-row" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'};">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="cate-icon-wrapper ${config.bg}" style="width: 38px; height: 38px; margin: 0;">
                            <i data-lucide="${config.icon}"></i>
                        </div>
                        <div>
                            <div style="font-size: 15px; font-weight: 600; color: #fff;">${cat.name}</div>
                            <div style="font-size: 11px; color: #8e8e93;">0 筆記錄</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #4ade80; font-size: 16px; font-weight: 700;">$0</div>
                        <div style="font-size: 10px; color: #8e8e93;">未分配</div>
                    </div>
                </div>
            `;
        });

        listHTML += `</div>`;
    }

    container.innerHTML = listHTML;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 處理專案明細更多功能選單觸發動作
 */
function handleProjDetailMenuAction(action) {
    console.log(`[專案動作] 執行：${action} (${currentDetailProjectName})`);
    
    if (action === '沿用上期預算') {
        alert(`已成功為「${currentDetailProjectName}」沿用上期預算設定！`);
    } else if (action === '清除所有預算') {
        if (confirm(`確定要清除「${currentDetailProjectName}」的所有預算設定嗎？`)) {
            alert('已清除所有預算！');
            renderProjectDetailView();
        }
    } else if (action === '清除未分配預算') {
        alert('已成功清除未分配預算！');
        renderProjectDetailView();
    } else if (action === '清除這期所有預算') {
        alert('已清除本期所有預算！');
        renderProjectDetailView();
    } else if (action === '匯出專案') {
        alert(`「${currentDetailProjectName}」的專案報表已成功匯出至下載資料夾！`);
    }
    
    closeModal('proj-detail-more-modal');
}

/**
 * 執行刪除專案動作
 */
function deleteProjectAction() {
    if (currentDetailProjectName === '生活開銷') {
        alert('「生活開銷」為系統預設核心專案，無法刪除！');
        closeModal('proj-detail-more-modal');
        return;
    }

    if (confirm(`確定要刪除專案「${currentDetailProjectName}」嗎？刪除後無法復原。`)) {
        let projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
        projects = projects.filter(p => p.name !== currentDetailProjectName);
        localStorage.setItem('koin_projects', JSON.stringify(projects));

        closeModal('proj-detail-more-modal');
        
        // 刷新專案列表並退回專案總覽頁
        if (typeof renderProjectsPage === 'function') renderProjectsPage();
        showPage('page-projects');
    }
}

   

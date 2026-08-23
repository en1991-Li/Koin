/**
 * 專案模組核心邏輯 - projects.js
 */

let currentDetailProjectName = '生活開銷';
let currentDetailProjectMonth = new Date(2026, 7, 1);
let currentProjectViewLevel = 'main'; // 'main' | 'transactions' | 'budget-config'
let currentDetailCategoryName = null; // 記錄當前點擊的分類 (例如 '購物', '飲食' 或 null 表示整個專案)

/**
 * 1. 點擊分類項目進入第二層 (交易明細 / 預算設定)
 */
function openCategorySubLevel(categoryName, targetTab = 'transactions') {
    currentDetailCategoryName = categoryName;
    currentProjectViewLevel = targetTab;

    // 展開第二層次級頁籤
    const subTabs = document.getElementById('proj-detail-sub-tabs');
    if (subTabs) subTabs.style.display = 'flex';

    // 隱藏第一層，開啟第二層
    const mainView = document.getElementById('proj-view-main-budget');
    if (mainView) mainView.style.display = 'none';

    // 更新標題為「專案名稱 - 分類名稱」
    const titleEl = document.getElementById('proj-detail-title');
    if (titleEl) {
        titleEl.innerText = `${currentDetailProjectName} · ${categoryName}`;
    }

    switchProjectDetailTab(targetTab);
}

/**
 * 2. 專案預算 Header 點擊入口 (檢視整個專案所有明細)
 */
function enterProjectSubLevel(targetTab = 'transactions') {
    currentDetailCategoryName = null; // null 代表全專案
    currentProjectViewLevel = targetTab;

    const subTabs = document.getElementById('proj-detail-sub-tabs');
    if (subTabs) subTabs.style.display = 'flex';

    const mainView = document.getElementById('proj-view-main-budget');
    if (mainView) mainView.style.display = 'none';

    const titleEl = document.getElementById('proj-detail-title');
    if (titleEl) titleEl.innerText = currentDetailProjectName;

    switchProjectDetailTab(targetTab);
}

/**
 * 3. 第二層頁籤切換：交易明細 vs 預算設定
 */
function switchProjectDetailTab(tabType) {
    currentProjectViewLevel = tabType;

    const tabTrans = document.getElementById('tab-proj-trans');
    const tabBudget = document.getElementById('tab-proj-budget-cfg');
    const viewTrans = document.getElementById('proj-view-transactions');
    const viewBudget = document.getElementById('proj-view-budget-config');

    if (tabTrans) tabTrans.classList.toggle('active', tabType === 'transactions');
    if (tabBudget) tabBudget.classList.toggle('active', tabType === 'budget-config');

    if (tabType === 'transactions') {
        if (viewTrans) viewTrans.style.display = 'block';
        if (viewBudget) viewBudget.style.display = 'none';
        renderProjectTransactionsList();
    } else {
        if (viewTrans) viewTrans.style.display = 'none';
        if (viewBudget) viewBudget.style.display = 'block';
        renderProjectBudgetConfigView();
    }
}

/**
 * 4. 渲染第二層：專案 / 分類交易明細列表
 */
function renderProjectTransactionsList() {
    const container = document.getElementById('proj-detail-transactions-container');
    if (!container) return;

    const records = JSON.parse(localStorage.getItem('koin_records') || '[]');

    // 1. 先過濾專案
    let filtered = records.filter(r => (r.project || '生活開銷') === currentDetailProjectName);

    // 2. 若指定了分類，則過濾屬於該母分類（或子分類對應至該母分類）的紀錄
    if (currentDetailCategoryName) {
        filtered = filtered.filter(r => {
            const rawCat = r.category || '其他';
            let mainCat = rawCat;
            if (typeof categoryMetaMap !== 'undefined' && categoryMetaMap[rawCat]) {
                mainCat = categoryMetaMap[rawCat].parent || rawCat;
            }
            return mainCat === currentDetailCategoryName || rawCat === currentDetailCategoryName;
        });
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p style="color: #8e8e93; text-align: center; margin-top: 40px; font-size: 14px;">尚無交易明細紀錄</p>`;
        return;
    }

    let html = '';
    filtered.forEach(rec => {
        const cleanCat = String(rec.category || '').trim();
        const meta = (typeof categoryMetaMap !== 'undefined' && categoryMetaMap[cleanCat]) 
            ? categoryMetaMap[cleanCat] 
            : { parent: '其他', icon: 'tag', bgClass: 'i-income-gold' };
        
        const isExpense = (rec.type === '支出' || rec.type === '應付款項');
        const amountColor = isExpense ? 'text-red' : 'text-green';
        const formattedAmount = `${isExpense ? '-' : '+'}$${parseFloat(rec.amount).toLocaleString()}`;

        html += `
            <div class="form-group" style="padding: 0; margin-bottom: 12px; cursor: pointer;" onclick="openRecordSummary(${rec.id})">
                <div class="form-row" style="background: #1c1c28; padding: 14px 16px; border-radius: 16px; border-bottom: none;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div class="cate-icon-wrapper ${meta.bgClass}" style="width: 44px; height: 44px; margin-bottom: 0;">
                            <i data-lucide="${meta.icon}"></i>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 15px; font-weight: 600; color: #ffffff;">${rec.category}</span>
                            <div style="display: flex; gap: 6px;">
                                <span style="background: rgba(255,255,255,0.05); color: #8e8e93; font-size: 10px; padding: 2px 8px; border-radius: 6px;">${rec.date}</span>
                                <span style="background: rgba(93,93,255,0.1); color: #8e8e93; font-size: 10px; padding: 2px 8px; border-radius: 6px;">${rec.account || '錢包'}</span>
                            </div>
                        </div>
                    </div>
                    <span class="${amountColor}" style="font-size: 17px; font-weight: 700;">
                        ${formattedAmount}
                    </span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 5. 渲染第二層：預算設定表單視圖
 */
function renderProjectBudgetConfigView() {
    const container = document.getElementById('proj-view-budget-config');
    if (!container) return;

    const targetName = currentDetailCategoryName || currentDetailProjectName;

    container.innerHTML = `
        <div class="form-group" style="background: #1c1c28; border-radius: 16px; padding: 16px; margin-bottom: 15px;">
            <div style="font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 15px;">
                ${targetName} 預算限額
            </div>
            <div class="form-row" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px;">
                <label>每月預算上限</label>
                <input type="number" id="proj-budget-limit-input" placeholder="0" class="text-right" style="background: transparent; border: none; color: #fff; font-size: 18px; font-weight: 700; outline: none; width: 120px;" value="0">
            </div>
            <div class="form-row" style="border-bottom: none; padding-top: 12px;">
                <label>超支提醒通知</label>
                <label class="switch">
                    <input type="checkbox" checked>
                    <span class="slider"></span>
                </label>
            </div>
        </div>
        <button class="menu-btn" style="background: #5d5dff; color: white;" onclick="saveProjectBudgetConfig()">儲存設定</button>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function saveProjectBudgetConfig() {
    alert('預算限額設定已儲存！');
    handleProjectDetailBack();
}

/**
 * 6. 左上角返回鍵導航處理器
 */
function handleProjectDetailBack() {
    if (currentProjectViewLevel !== 'main') {
        // 從第二層（交易明細/預算設定）退回第一層（主預算總覽）
        currentProjectViewLevel = 'main';
        currentDetailCategoryName = null;

        const subTabs = document.getElementById('proj-detail-sub-tabs');
        if (subTabs) subTabs.style.display = 'none';

        const mainView = document.getElementById('proj-view-main-budget');
        if (mainView) mainView.style.display = 'block';

        const viewTrans = document.getElementById('proj-view-transactions');
        const viewBudget = document.getElementById('proj-view-budget-config');
        if (viewTrans) viewTrans.style.display = 'none';
        if (viewBudget) viewBudget.style.display = 'none';

        const titleEl = document.getElementById('proj-detail-title');
        if (titleEl) titleEl.innerText = currentDetailProjectName;

        renderProjectDetailView();
    } else {
        // 從第一層退回專案總覽清單頁
        showPage('page-projects');
    }
}

/**
 * 7. 第一層主預算列表渲染（為未分配與未設定項目加入 onclick 點擊事件）
 */
function renderProjectDetailView() {
    const titleEl = document.getElementById('proj-detail-title');
    const dateRangeEl = document.getElementById('proj-detail-date-range');
    const container = document.getElementById('proj-detail-categories-container');
    if (!container) return;

    if (titleEl) titleEl.innerText = currentDetailProjectName;

    const year = currentDetailProjectMonth.getFullYear();
    const month = currentDetailProjectMonth.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    const formattedMonth = String(month).padStart(2, '0');
    if (dateRangeEl) {
        dateRangeEl.innerText = `${year}/${formattedMonth}/01 － ${year}/${formattedMonth}/${lastDay}`;
    }

    const records = JSON.parse(localStorage.getItem('koin_records') || '[]');
    const projRecords = records.filter(r => (r.project || '生活開銷') === currentDetailProjectName);

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

    if (document.getElementById('proj-detail-out-count')) document.getElementById('proj-detail-out-count').innerText = outCount;
    if (document.getElementById('proj-detail-out-total')) document.getElementById('proj-detail-out-total').innerText = `-$${outTotal.toLocaleString()}`;
    if (document.getElementById('proj-detail-in-count')) document.getElementById('proj-detail-in-count').innerText = inCount;
    if (document.getElementById('proj-detail-in-total')) document.getElementById('proj-detail-in-total').innerText = `$${inTotal.toLocaleString()}`;
    if (document.getElementById('proj-detail-total-count')) document.getElementById('proj-detail-total-count').innerText = projRecords.length;
    if (document.getElementById('proj-detail-net-total')) document.getElementById('proj-detail-net-total').innerText = `-$${netTotal.toLocaleString()}`;

    if (document.getElementById('proj-detail-budget-name')) document.getElementById('proj-detail-budget-name').innerText = currentDetailProjectName;
    if (document.getElementById('proj-detail-budget-count')) document.getElementById('proj-detail-budget-count').innerText = projRecords.length;
    if (document.getElementById('proj-detail-budget-amount')) document.getElementById('proj-detail-budget-amount').innerText = `$${outTotal.toLocaleString()}`;

    const categoryConfig = {
        '飲食': { icon: 'utensils', bg: 'i-eat' },
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
        const rawCat = r.category || '其他';
        let mainCat = rawCat;

        if (typeof categoryMetaMap !== 'undefined' && categoryMetaMap[rawCat]) {
            mainCat = categoryMetaMap[rawCat].parent || rawCat;
        }

        if (!categoryStats[mainCat]) categoryStats[mainCat] = { count: 0, amount: 0 };
        categoryStats[mainCat].count++;
        categoryStats[mainCat].amount += parseFloat(r.amount) || 0;
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

    let listHTML = '';

    // 1. 未分配預算 (點擊進入該分類的交易明細)
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
                <div class="form-row" onclick="openCategorySubLevel('${cat.name}', 'transactions')" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'}; cursor: pointer;">
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

    // 2. 未設定預算 (點擊進入該分類的預算設定)
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
                <div class="form-row" onclick="openCategorySubLevel('${cat.name}', 'budget-config')" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'}; cursor: pointer;">
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
 * 8. 專案總覽頁列表渲染
 */
function renderProjectsPage() {
    const listContainer = document.getElementById('projects-list-container');
    if (!listContainer) return;

    let projects = JSON.parse(localStorage.getItem('koin_projects')) || [
        { name: '生活開銷', currency: 'TWD', period: '每月', type: '重複循環' }
    ];

    const records = JSON.parse(localStorage.getItem('koin_records') || '[]');

    let html = `
        <div style="color: #8e8e93; font-size: 13px; font-weight: 700; margin: 15px 0 8px 18px;">
            進行中 (${projects.length})
        </div>
        <div class="form-group" style="background: #1c1c28; border-radius: 20px; padding: 0 16px; margin: 0 15px 20px 15px;">
    `;

    projects.forEach((proj, idx) => {
        const isLast = (idx === projects.length - 1);
        const projRecords = records.filter(r => (r.project || '生活開銷') === proj.name);
        let outTotal = 0;
        projRecords.forEach(r => {
            if (r.type === '支出' || r.type === '應付款項') {
                outTotal += parseFloat(r.amount) || 0;
            }
        });

        html += `
            <div class="form-row" onclick="openProjectDetail('${proj.name}')" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'}; cursor: pointer;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="background: #2c2c3e; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="piggy-bank" style="width: 22px; height: 22px; color: #ffffff;"></i>
                    </div>
                    <div>
                        <div style="font-size: 16px; font-weight: 600; color: #ffffff;">${proj.name}</div>
                        <div style="font-size: 11px; color: #8e8e93; margin-top: 2px;">${projRecords.length} 筆記錄</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <span style="font-weight: 700; font-size: 16px; color: ${outTotal > 0 ? '#fb7185' : '#4ade80'};">
                        ${outTotal > 0 ? '-' : ''}$${outTotal.toLocaleString()}
                    </span>
                    <div style="font-size: 10px; color: #8e8e93;">無預算</div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    listContainer.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 9. 開啟專案第一層主預算總覽
 */
function openProjectDetail(projectName) {
    currentDetailProjectName = projectName;
    currentProjectViewLevel = 'main';
    currentDetailCategoryName = null;

    const subTabs = document.getElementById('proj-detail-sub-tabs');
    if (subTabs) subTabs.style.display = 'none';

    const mainView = document.getElementById('proj-view-main-budget');
    if (mainView) mainView.style.display = 'block';

    const viewTrans = document.getElementById('proj-view-transactions');
    const viewBudget = document.getElementById('proj-view-budget-config');
    if (viewTrans) viewTrans.style.display = 'none';
    if (viewBudget) viewBudget.style.display = 'none';

    renderProjectDetailView();
    showPage('page-project-detail');
}

function changeProjectDetailMonth(dir) {
    currentDetailProjectMonth.setMonth(currentDetailProjectMonth.getMonth() + dir);
    renderProjectDetailView();
}

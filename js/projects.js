/**
 * 專案總覽與明細雙層邏輯 - projects.js
 */

// 全域狀態控制
let currentDetailProjectName = '生活開銷';
let currentDetailProjectMonth = new Date();
let currentProjectViewLevel = 'main'; // 'main' | 'transactions' | 'budget-config'

// 1. 預設數據
const defaultProjects = [
    { name: "生活開銷", icon: "beer", date: "26/08/01 － 26/08/31", amount: 0, type: 'expense' },
    { name: "投資理財", icon: "trending-up", date: "26/08/01 － 26/08/31", amount: 0, type: 'neutral' },
    { name: "工作", icon: "briefcase-business", date: "26/08/01 － 26/08/31", amount: 0, type: 'neutral' },
    { name: "玩樂", icon: "gamepad-2", date: "26/08/01 － 26/08/31", amount: 0, type: 'income' },
    { name: "旅遊", icon: "plane", date: "26/08/01 － 26/08/31", amount: 0, type: 'neutral' },
    { name: "家用", icon: "users", date: "26/08/01 － 26/08/31", amount: 0, type: 'neutral' },
    { name: "每月統計", icon: "calendar-days", date: "26/08/01 － 26/08/31", amount: 0, type: 'expense', isStats: true },
    { name: "學習", icon: "pencil-ruler", date: "26/08/01 － 26/08/31", amount: 0, type: 'neutral' }
];

/**
 * 渲染專案列表頁 (主專案頁籤)
 */
function renderProjectsPage() {
    const container = document.getElementById('projects-list-container');
    if (!container) return;

    let projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
    if (projects.length === 0) {
        projects = defaultProjects;
    }
    const records = JSON.parse(localStorage.getItem('koin_records') || '[]');

    let html = `
        <div style="padding: 15px 15px 5px 15px; color: #8e8e93; font-size: 13px; font-weight: 700;">
            － 進行中 (${projects.length})
        </div>
        <div class="form-group" style="background: #1c1c28; border-radius: 20px; padding: 0 16px; margin: 0 15px 15px 15px;">
    `;

    projects.forEach((proj, idx) => {
        const projRecords = records.filter(r => (r.project || '生活開銷') === proj.name);
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
                        <div style="font-size: 11px; color: #8e8e93;">${proj.date || '26/08/01 － 26/08/31'}</div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <span style="font-weight: 700; font-size: 17px; color: ${projTotal > 0 ? '#fb7185' : '#4ade80'};">$${projTotal.toLocaleString()}</span>
                    ${proj.isStats ? `<div style="display: block; background: #56aaff; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 6px; margin-top: 3px; font-weight: bold;">統計專案</div>` : ''}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 開啟專案明細頁 (第一層：主預算列表)
 */
function openProjectDetail(projectName) {
    currentDetailProjectName = projectName;
    currentProjectViewLevel = 'main';
    
    const subTabs = document.getElementById('proj-detail-sub-tabs');
    if (subTabs) subTabs.style.display = 'none';

    document.getElementById('proj-view-main-budget').style.display = 'block';
    document.getElementById('proj-view-transactions').style.display = 'none';
    document.getElementById('proj-view-budget-config').style.display = 'none';

    renderProjectDetailView();
    showPage('page-project-detail');
}

/**
 * 進入第二層：交易明細 / 預算設定畫面
 */
function enterProjectSubLevel(targetTab) {
    currentProjectViewLevel = targetTab;

    const subTabs = document.getElementById('proj-detail-sub-tabs');
    if (subTabs) subTabs.style.display = 'flex';

    document.getElementById('proj-view-main-budget').style.display = 'none';

    switchProjectDetailTab(targetTab);
}

/**
 * 處理專案明細頁頂部返回 `<` 點擊動作
 */
function handleProjectDetailBack() {
    if (currentProjectViewLevel === 'main') {
        showPage('page-projects');
    } else {
        enterProjectSubLevelMain();
    }
}

function enterProjectSubLevelMain() {
    currentProjectViewLevel = 'main';
    const subTabs = document.getElementById('proj-detail-sub-tabs');
    if (subTabs) subTabs.style.display = 'none';

    document.getElementById('proj-view-main-budget').style.display = 'block';
    document.getElementById('proj-view-transactions').style.display = 'none';
    document.getElementById('proj-view-budget-config').style.display = 'none';
}

/**
 * 第二層頁籤切換：交易明細 vs 預算設定
 */
function switchProjectDetailTab(tabType) {
    currentProjectViewLevel = tabType;

    const tabTrans = document.getElementById('tab-proj-trans');
    const tabBudgetCfg = document.getElementById('tab-proj-budget-cfg');

    const viewTrans = document.getElementById('proj-view-transactions');
    const viewCfg = document.getElementById('proj-view-budget-config');

    if (tabTrans) tabTrans.classList.remove('active');
    if (tabBudgetCfg) tabBudgetCfg.classList.remove('active');

    if (viewTrans) viewTrans.style.display = 'none';
    if (viewCfg) viewCfg.style.display = 'none';

    if (tabType === 'transactions') {
        if (tabTrans) tabTrans.classList.add('active');
        if (viewTrans) viewTrans.style.display = 'block';
        renderProjectTransactionsList();
    } else if (tabType === 'budget-config') {
        if (tabBudgetCfg) tabBudgetCfg.classList.add('active');
        if (viewCfg) viewCfg.style.display = 'block';
        renderProjectBudgetConfigView();
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 切換專案明細月份
 */
function changeProjectDetailMonth(dir) {
    currentDetailProjectMonth.setMonth(currentDetailProjectMonth.getMonth() + dir);
    renderProjectDetailView();
}

/**
 * 第一層：專案主預算列表視圖
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
    allCategories.forEach(cat => categoryStats[cat] = { count: 0, amount: 0 });

    projRecords.forEach(r => {
        const cat = r.category || '其他';
        if (!categoryStats[cat]) categoryStats[cat] = { count: 0, amount: 0 };
        categoryStats[cat].count++;
        categoryStats[cat].amount += parseFloat(r.amount) || 0;
    });

    const activeCategories = [];
    const inactiveCategories = [];

    Object.keys(categoryStats).forEach(cat => {
        if (categoryStats[cat].count > 0) activeCategories.push({ name: cat, ...categoryStats[cat] });
        else inactiveCategories.push({ name: cat, ...categoryStats[cat] });
    });

    let listHTML = '';

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
 * 第二層：預算詳細設定表單
 */
function renderProjectBudgetConfigView() {
    const configContainer = document.getElementById('proj-view-budget-config');
    if (!configContainer) return;

    const projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
    const proj = projects.find(p => p.name === currentDetailProjectName) || {
        name: currentDetailProjectName,
        currency: 'TWD',
        budget: 0
    };

    const records = JSON.parse(localStorage.getItem('koin_records') || '[]');
    const projRecords = records.filter(r => (r.project || '生活開銷') === currentDetailProjectName);
    const totalAmount = projRecords.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    configContainer.innerHTML = `
        <div class="add-acc-hero" style="padding: 20px 0 10px;">
            <div class="icon-box" style="background: #2c2c3e; width: 70px; height: 70px; border-radius: 50%; margin-bottom: 0;">
                <i data-lucide="wine" style="width: 36px; height: 36px; color: #fff;"></i>
            </div>
        </div>

        <div class="form-group" style="background: #1c1c28; border-radius: 20px; padding: 0 16px; margin-top: 15px;">
            <div class="form-row">
                <label style="color: #8e8e93; font-size: 14px;">預算類型</label>
                <span style="color: #8e8e93; font-size: 14px;">專案</span>
            </div>
            <div class="form-row">
                <label style="font-size: 15px;">預算名稱</label>
                <span style="font-size: 15px; color: #fff;">${proj.name}</span>
            </div>
            <div class="form-row">
                <label style="font-size: 15px;">主幣種</label>
                <span style="font-size: 15px; color: #8e8e93;">${proj.currency || 'TWD'}</span>
            </div>
            <div class="form-row">
                <label style="font-size: 15px;">預算編列</label>
                <span style="font-size: 15px; color: #f59e0b; font-weight: 700;">$${(proj.budget || 0).toLocaleString()}</span>
            </div>
            <div class="form-row">
                <label style="font-size: 15px;">預算提醒</label>
                <span style="font-size: 14px; color: #8e8e93;">小於 30%</span>
            </div>
            <div class="form-row">
                <label style="font-size: 15px;">專案流入併入預算</label>
                <label class="switch">
                    <input type="checkbox" id="cfg-proj-in-flow">
                    <span class="slider"></span>
                </label>
            </div>
            <div class="form-row">
                <label style="font-size: 15px;">累積上期剩餘預算</label>
                <label class="switch">
                    <input type="checkbox" id="cfg-proj-rollover">
                    <span class="slider"></span>
                </label>
            </div>
            <div class="form-row">
                <label style="font-size: 15px;">每日預算</label>
                <label class="switch">
                    <input type="checkbox" id="cfg-proj-daily">
                    <span class="slider"></span>
                </label>
            </div>
            
            <div style="padding: 15px 0;">
                <textarea placeholder="備註" style="width: 100%; background: #2c2c3e; border: none; border-radius: 12px; color: white; padding: 12px; min-height: 80px; outline: none; resize: none; font-size: 14px;"></textarea>
            </div>
        </div>

        <div style="background: #1c1c28; border-radius: 16px; padding: 12px 16px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="cate-icon-wrapper i-home" style="width: 36px; height: 36px; margin: 0;">
                    <i data-lucide="piggy-bank"></i>
                </div>
                <div>
                    <div style="font-size: 14px; font-weight: 600; color: #fff;">${proj.name}</div>
                    <div style="font-size: 11px; color: #8e8e93;">${projRecords.length} 筆記錄</div>
                </div>
            </div>
            <span style="color: #fb7185; font-weight: 700; font-size: 15px;">$${totalAmount.toLocaleString()}</span>
        </div>
    `;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 第二層：依日期分組渲染交易明細列表
 */
function renderProjectTransactionsList() {
    const container = document.getElementById('proj-detail-transactions-container');
    if (!container) return;

    const records = JSON.parse(localStorage.getItem('koin_records') || '[]');
    const projRecords = records.filter(r => (r.project || '生活開銷') === currentDetailProjectName);

    if (projRecords.length === 0) {
        container.innerHTML = `<p style="color: #8a8a8e; text-align: center; margin-top: 40px; font-size: 14px;">此專案尚無交易明細</p>`;
        return;
    }

    const groupedRecords = {};
    projRecords.forEach(r => {
        const dateStr = r.date || '未知日期';
        if (!groupedRecords[dateStr]) {
            groupedRecords[dateStr] = { records: [], dailyTotal: 0 };
        }
        groupedRecords[dateStr].records.push(r);
        
        const amt = parseFloat(r.amount) || 0;
        if (r.type === '支出' || r.type === '應付款項') {
            groupedRecords[dateStr].dailyTotal -= amt;
        } else {
            groupedRecords[dateStr].dailyTotal += amt;
        }
    });

    let html = '';
    const expenseIconMap = {
        '飲食': 'utensils', '交通': 'car', '娛樂': 'party-popper', '購物': 'shopping-bag', '個人': 'user', '醫療': 'stethoscope', '家居': 'home', '家庭': 'users', '生活': 'coffee', '學習': 'book',
        '早餐': 'croissant', '午餐': 'utensils', '晚餐': 'soup', '點心': 'cookie', '飲料': 'cup-soda', '酒類': 'beer', '水果': 'grape', '宵夜': 'pizza', '礦泉水': 'glass-water',
        '加油費': 'fuel', '停車費': 'square-parking', '火車': 'train-front', '公車': 'bus-front', '捷運': 'train-front-tunnel', '悠遊卡': 'credit-card', '汽車': 'car-front', '計程車': 'car-taxi-front', '摩托車': 'motorbike', '單車': 'bike', '機票': 'plane', '船票': 'ship',
        '手遊': 'gamepad-2', '音樂': 'music', 'Netflix': 'monitor-play', '電影': 'clapperboard', '遊樂園': 'roller-coaster', '展覽': 'landmark', '運動': 'dumbbell',
        '蝦皮購物': 'shopping-bag', 'momo購物': 'shopping-bag', 'PChome24h': 'shopping-bag', '市場': 'shopping-cart', '衣物': 'shirt', '鞋子': 'sport-shoe', '配件': 'glasses', '包包': 'handbag', '美妝保養': 'mirror-round', '精品': 'gem', '禮物': 'gift', '電子產品': 'laptop', '應用軟體': 'app-window', 'UNIQLO': 'shirt', 'NET': 'shirt',
        '社交': 'handshake', '電信費': 'phone', '借款': 'coins', '投資': 'trending-up', '稅金': 'circle-dollar-sign', '保險': 'shield-check', '捐款': 'hand-heart', '寵物': 'dog', '彩券': 'receipt',
        '門診': 'stethoscope', '藥品': 'pill', '醫療用品': 'briefcase-medical', '打針': 'syringe', '住院': 'bed-single', '手術': 'slice', '健康檢查': 'clipboard-plus',
        '日常用品': 'soap-dispenser-droplet', '水費': 'droplets', '電費': 'zap', '燃料費': 'flame', '電話費': 'phone-call', '網路費': 'house-wifi', '房租': 'building', '洗衣費': 'washing-machine', '修繕費': 'wrench', '家具': 'sofa', '訂閱': 'newspaper', '家電': 'tv', '全聯': 'store', '屈臣氏': 'store', '康是美': 'store',
        '生活費': 'wallet-minimal', '教育': 'graduation-cap', '看護': 'person-standing', '玩具': 'toy-brick', '才藝': 'palette',
        '美容美髮': 'scissors', '住宿': 'hotel', '旅行': 'tree-palm', '派對': 'wine',
        '書籍': 'book-open-text', '課程': 'presentation', '教材': 'book-marked', '證書': 'book-user', '探索': 'compass', '文具': 'pen-ruler', '考試': 'book-open-check', '金石堂': 'book-open', '博客來': 'book-open'
    };

    Object.keys(groupedRecords).forEach(date => {
        const group = groupedRecords[date];
        const totalText = group.dailyTotal < 0 ? `-${Math.abs(group.dailyTotal).toLocaleString()}` : `+${group.dailyTotal.toLocaleString()}`;
        const totalColor = group.dailyTotal < 0 ? '#8e8e93' : '#4ade80';

        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 4px 6px 4px; color: #ffffff; font-size: 13px; font-weight: 700;">
                <span>${date}</span>
                <span style="color: ${totalColor};">${totalText}</span>
            </div>
            <div class="form-group" style="background: #1c1c28; border-radius: 16px; padding: 0 16px; margin-bottom: 15px;">
        `;

        group.records.forEach((r, idx) => {
            const isLast = (idx === group.records.length - 1);
            const isExpense = (r.type === '支出' || r.type === '應付款項');
            const amtColor = isExpense ? '#fb7185' : '#4ade80';
            const iconName = expenseIconMap[r.category] || 'tag';

            html += `
                <div class="form-row" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'};">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="cate-icon-wrapper i-income-gold" style="width: 40px; height: 40px; margin: 0;">
                            <i data-lucide="${iconName}"></i>
                        </div>
                        <div>
                            <div style="font-size: 15px; font-weight: 600; color: #fff;">${r.category}</div>
                            <div style="font-size: 11px; color: #8e8e93;">${r.note || r.account || '錢包'}</div>
                        </div>
                    </div>
                    <span style="color: ${amtColor}; font-size: 16px; font-weight: 700;">
                        ${isExpense ? '' : '+'}$${parseFloat(r.amount).toLocaleString()}
                    </span>
                </div>
            `;
        });

        html += `</div>`;
    });

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 處理專案選單選項點擊
 */
function handleProjDetailMenuAction(action) {
    if (action === '沿用上期預算') alert(`已成功為「${currentDetailProjectName}」沿用上期預算！`);
    else if (action === '清除所有預算') alert('已清除所有預算！');
    else if (action === '清除未分配預算') alert('已清除未分配預算！');
    else if (action === '清除這期所有預算') alert('已清除這期所有預算！');
    else if (action === '匯出專案') alert(`「${currentDetailProjectName}」專案報表已成功匯出！`);
    
    closeModal('proj-detail-more-modal');
}

/**
 * 刪除專案
 */
function deleteProjectAction() {
    if (currentDetailProjectName === '生活開銷') {
        alert('「生活開銷」為系統核心預設專案，無法刪除！');
        closeModal('proj-detail-more-modal');
        return;
    }

    if (confirm(`確定要刪除專案「${currentDetailProjectName}」嗎？`)) {
        let projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
        projects = projects.filter(p => p.name !== currentDetailProjectName);
        localStorage.setItem('koin_projects', JSON.stringify(projects));

        closeModal('proj-detail-more-modal');
        renderProjectsPage();
        showPage('page-projects');
    }
}

/**
 * 打開編輯專案頁
 */
function openEditProjectPage() {
    const nameInput = document.getElementById('edit-proj-name');
    if (nameInput) nameInput.value = currentDetailProjectName;
    showPage('page-edit-project');
}

function closeEditProjectPage() {
    showPage('page-project-detail');
}

function saveEditedProject() {
    const newName = document.getElementById('edit-proj-name').value.trim();
    if (!newName) return alert("專案名稱不可為空！");

    let projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
    const projIndex = projects.findIndex(p => p.name === currentDetailProjectName);
    if (projIndex !== -1) {
        projects[projIndex].name = newName;
    }
    localStorage.setItem('koin_projects', JSON.stringify(projects));

    currentDetailProjectName = newName;
    renderProjectsPage();
    renderProjectDetailView();
    closeEditProjectPage();
}

// 預設加載
document.addEventListener('DOMContentLoaded', renderProjectsPage);

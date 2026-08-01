/**
 * Koin 核心邏輯整合 - script.js
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 2. 更新日曆標題至當前月份
    updateCalendarHeaderToToday(); 
    
    // 3. 初始頁面渲染
    renderAccountOverview(); 
    if (typeof renderProjectsPage === 'function') renderProjectsPage();

    // 確保一開 App 進入首頁或行事曆時，當天的明細就會預先載入出來
    renderDailyDetailsList();
    
    // 4. 預設首頁狀態
    showPage('page-overview');
});

// 全域狀態宣告
let currentActiveAccountIndex = null;
let isAmountHidden = false; 

let recordState = {
    type: '支出',
    category: '未分類',
    currentInput: '0',    // 計算機當前輸入緩衝
    prevInput: '0',       // 運算暫存值
    operator: null,       // 當前運算子 (+,-,*,/)
    isCalculated: false,  // 是否剛執行完等號
    account: '錢包',
    project: '生活開銷',
    date: '2026/06/20',
    time: '13:57',
    advType: 'single'     // single, cycle, install
};

/**
 * 核心頁面切換
 */
function showPage(pageId, element) {
    const target = document.getElementById(pageId);
    if (!target) return;
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    target.classList.add('active');

    // 處理導覽列 active 狀態
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    
    const fabElement = document.getElementById('main-fab');
    if (fabElement) fabElement.classList.remove('fab-active');

    if (element) {
        element.classList.add('active');
        if (element.classList.contains('tab-fab')) element.classList.add('fab-active');
    } else {
        // 程式觸發跳轉時，自動點亮對應 Tab
        const autoTab = document.querySelector(`.tab-bar [onclick*="${pageId}"]`);
        if (autoTab) autoTab.classList.add('active');
    }

    // 更新 FAB 圖示
    const fabIcon = document.getElementById('fab-icon');
    if (fabIcon) {
        const iconName = (pageId === 'page-calendar' || pageId === 'page-add-record') ? 'plus' : 'layers';
        fabIcon.setAttribute('data-lucide', iconName);
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 帳戶總覽列表排版
 */
function renderAccountOverview() {
    const listContainer = document.getElementById('account-list');
    if (!listContainer) return;

    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    listContainer.innerHTML = ''; 

    let totalBalance = 0;
    let totalAssets = 0;
    let totalDebts = 0;

    // 分組容器邏輯
    const groups = { 
        '現金': { accounts: [], subtotal: 0 }, 
        '銀行': { accounts: [], subtotal: 0 }, 
        '信用卡': { accounts: [], subtotal: 0 }, 
        '其他': { accounts: [], subtotal: 0 } 
    };

    savedAccounts.forEach((acc, index) => {
        const amount = parseFloat(acc.amount) || 0;
        if (acc.isCredit) {
            totalDebts += Math.abs(amount);
            totalBalance -= Math.abs(amount);
        } else {
            totalAssets += amount;
            totalBalance += amount;
        }

        let category = '其他';
        if (acc.group.includes('現金')) category = '現金';
        else if (acc.group.includes('銀行')) category = '銀行';
        else if (acc.group.includes('信用卡')) category = '信用卡';

        if (!groups[category]) groups[category] = { accounts: [], subtotal: 0 };
        groups[category].accounts.push({ ...acc, originalIndex: index });
        groups[category].subtotal += acc.isCredit ? -Math.abs(amount) : amount;
    });

    // 遍歷並渲染 HTML
    for (const [groupName, data] of Object.entries(groups)) {
        if (data.accounts.length === 0) continue;

        // 1. 生成分組標頭
        const groupHeaderHTML = `
            <div class="account-group-header" style="display:flex; justify-content:space-between; padding:15px 4px 10px 4px; color:#ffffff; font-size:14px; font-weight:700;">
                <span>－ ${groupName} (${data.accounts.length})</span>
                <span class="amount-val ${data.subtotal < 0 ? 'text-red' : ''}" data-value="${data.subtotal}" style="color: #ffffff; font-weight: 600;">
                    ${data.subtotal < 0 ? '-' : '+'}${Math.abs(data.subtotal).toLocaleString()}
                </span>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', groupHeaderHTML);

        // 2. 建立 form-group 卡片框
        let accountsCardHTML = `<div class="form-group" style="background: #1c1c28; border-radius: 20px; padding: 0 16px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.03);">`;

        data.accounts.forEach((acc, idx) => {
            const amount = parseFloat(acc.amount) || 0;
            const isLastItems = (idx === data.accounts.length - 1);
            
            accountsCardHTML += `
                <div class="form-row" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: ${isLastItems ? 'none' : '1px solid rgba(255,255,255,0.05)'}; cursor: pointer;" onclick="openAccountDetail(${acc.originalIndex})">
                    <div style="display:flex; align-items:center; gap:14px;">
                        <div style="background:#2c2c3e; width: 44px; height: 44px; border-radius:12px; display:flex; align-items:center; justify-content:center;">
                            <i data-lucide="${acc.isCredit ? 'credit-card' : 'wallet'}" style="width:22px; height:22px; color:#ffffff;"></i>
                        </div>
                        <span style="font-size:16px; font-weight:600; color:#ffffff;">${acc.name}</span>
                    </div>
                    <span class="amount-val ${acc.isCredit ? 'text-red' : 'text-green'}" style="font-weight:700; font-size:17px;" data-value="${acc.isCredit ? -Math.abs(amount) : amount}">
                        ${acc.isCredit ? '-' : ''}${Math.abs(amount).toLocaleString()}
                    </span>
                </div>
            `;
        });

        accountsCardHTML += `</div>`;
        listContainer.insertAdjacentHTML('beforeend', accountsCardHTML);
    }

    if (document.getElementById('total-balance')) document.getElementById('total-balance').setAttribute('data-value', totalBalance);
    if (document.getElementById('total-assets')) document.getElementById('total-assets').setAttribute('data-value', totalAssets);
    if (document.getElementById('total-debts')) document.getElementById('total-debts').setAttribute('data-value', totalDebts);

    updateAmountDisplay();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 切換眼睛隱藏狀態
 */
function toggleAmountVisibility() {
    isAmountHidden = !isAmountHidden;
    
    const eyeIcon = document.getElementById('eye-toggle');
    if (eyeIcon) {
        eyeIcon.setAttribute('data-lucide', isAmountHidden ? 'eye-off' : 'eye');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    updateAmountDisplay();
}

/**
 * 支出主分類、全子分類網格切換核心
 */
function changeSubGrid(target) {
    const gridIds = [
        'grid-expense', 'grid-expense-eat', 'grid-expense-transport', 'grid-expense-entertainment',
        'grid-expense-shopping', 'grid-expense-personal', 'grid-expense-medical',
        'grid-expense-home', 'grid-expense-family', 'grid-expense-life', 'grid-expense-learn'
    ];

    gridIds.forEach(id => {
        const g = document.getElementById(id);
        if (g) g.classList.remove('active');
    });

    let targetId = 'grid-expense';
    if (target === 'eat') targetId = 'grid-expense-eat';
    else if (target === 'transport') targetId = 'grid-expense-transport';
    else if (target === 'entertainment') targetId = 'grid-expense-entertainment';
    else if (target === 'shopping') targetId = 'grid-expense-shopping';
    else if (target === 'personal') targetId = 'grid-expense-personal';
    else if (target === 'medical') targetId = 'grid-expense-medical';
    else if (target === 'home') targetId = 'grid-expense-home';
    else if (target === 'family') targetId = 'grid-expense-family';
    else if (target === 'life') targetId = 'grid-expense-life';
    else if (target === 'learn') targetId = 'grid-expense-learn';
    else if (target === 'main-expense') targetId = 'grid-expense';

    const targetGrid = document.getElementById(targetId);
    if (targetGrid) targetGrid.classList.add('active');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 輔助函式：取得分類專屬的 Lucide 圖標與漸層背景 Class
 */
function getCategoryMeta(categoryName) {
    const cleanCategory = String(categoryName || '').trim();

    const iconMap = {
        // 主分類
        '飲食': 'utensils', '交通': 'car', '娛樂': 'party-popper', '購物': 'shopping-bag',
        '個人': 'user', '醫療': 'stethoscope', '家居': 'home', '家庭': 'users', '生活': 'coffee', '學習': 'book',
        
        // 飲食
        '早餐': 'croissant', '午餐': 'utensils', '晚餐': 'soup', '點心': 'cookie',
        '飲料': 'cup-soda', '酒類': 'beer', '水果': 'grape', '宵夜': 'pizza', '礦泉水': 'glass-water',
        
        // 交通
        '加油費': 'fuel', '停車費': 'square-parking', '火車': 'train-front', '公車': 'bus-front',
        '捷運': 'train-front-tunnel', '悠遊卡': 'credit-card', '汽車': 'car-front',
        '計程車': 'car-taxi-front', '摩托車': 'motorbike',  '單車': 'bike','機票': 'plane', '船票': 'ship',

        // 娛樂
        '手遊': 'gamepad-2', '彩券/刮刮樂': 'dices', '音樂': 'music', 'Spotify': 'music-4',
        'Netflix': 'monitor-play', '電影': 'clapperboard', '遊樂園': 'roller-coaster',
        '展覽': 'landmark', '運動': 'dumbbell', 

        // 購物
        '蝦皮購物': 'shopping-bag', 'momo購物': 'shopping-bag',  '市場': 'shopping-cart', '衣物': 'shirt',
        '鞋子': 'footprints', '配件': 'glasses', '包包': 'briefcase', '美妝保養': 'sparkles',
        '精品': 'gem', '禮物': 'gift', '電子產品': 'laptop', '應用軟體': 'app-window',
        'UNIQLO': 'shirt', 'NET': 'shirt',

        // 個人
        '社交': 'handshake', '電信費': 'phone', '借款': 'coins', '投資': 'trending-up',
        '稅金': 'circle-dollar-sign', '保險': 'shield-check', '捐款': 'hand-heart',
        '寵物': 'dog', '彩券': 'receipt',

        // 醫療
        '門診': 'stethoscope',  '藥品': 'pill', '醫療用品': 'thermometer',
        '打針': 'syringe', '住院': 'bed-single', '手術': 'cross', '健康檢查': 'activity',

        // 家居
        '日常用品': 'package', '水費': 'droplets', '電費': 'zap',
        '燃料費': 'flame', '電話費': 'phone-call', '網路費': 'house-wifi', '房租': 'building',
        '洗衣費': 'shirt', '修繕費': 'wrench', '家具': 'sofa', '訂閱': 'newspaper',
        '家電': 'tv', '影印費': 'printer', '全聯': 'store','屈臣氏': 'store', '康是美': 'store',

        // 家庭
        '生活費': 'wallet-minimal', '教育': 'graduation-cap', '看護': 'baby',
        '玩具': 'rocking-horse', '才藝': 'palette',

        // 生活
        '美容美髮': 'scissors', '住宿': 'hotel',
        '旅行': 'plane', '派對': 'wine',

        // 學習
        '書籍': 'book-open-text', '課程': 'presentation', '教材': 'book-marked',
        '證書': 'book-user',  '文具': 'pen-tool', '考試': 'book-open-check',
        '金石堂': 'book-open', '博客來': 'book-open',

        // 收入
        '薪水': 'dollar-sign', '獎金': 'coins', '收款': 'hand-coins', '利息': 'landmark',
        '消費回饋': 'credit-card', '零用錢': 'circle-dollar-sign', '發票': 'receipt', '補助': 'building-2',

        // 轉帳、應收應付
        '轉帳': 'arrow-left-right', '提款': 'credit-card', '存款': 'banknote', '還款': 'undo-2',
        '借出': 'hand-coins', '代付': 'handshake', '報帳': 'briefcase-business',
        '借入': 'hand-coins', '信貸': 'credit-card', '車貸': 'car', '房貸': 'house'
    };

    let iconName = iconMap[cleanCategory] || 'tag';

    // 家族背景 CSS Class 判斷
    let bgClass = 'i-income-gold';
    if (['加油費','停車費','火車','公車','捷運','悠遊卡','汽車','計程車','摩托車','單車','機票','船票'].includes(cleanCategory)) bgClass = 'i-transport';
    else if (['手遊','音樂','Netflix','電影','遊樂園','展覽','運動'].includes(cleanCategory)) bgClass = 'i-entertainment';
    else if (['蝦皮購物','momo購物','市場','衣物','鞋子','配件','包包','美妝保養','精品','禮物','電子產品','應用軟體','UNIQLO','NET'].includes(cleanCategory)) bgClass = 'i-shopping';
    else if (['社交','電信費','借款','投資','稅金','保險','捐款','寵物','彩券'].includes(cleanCategory)) bgClass = 'i-personal';
    else if (['門診','藥品','醫療用品','打針','住院','手術','健康檢查'].includes(cleanCategory)) bgClass = 'i-medical';
    else if (['日常用品','水費','電費','燃料費','電話費','網路費','房租','洗衣費','修繕費','家具','訂閱','家電','影印費','全聯','屈臣氏','康是美'].includes(cleanCategory)) bgClass = 'i-home';
    else if (['生活費','教育','看護','玩具','才藝'].includes(cleanCategory)) bgClass = 'i-family';
    else if (['美容美髮','住宿','旅行','派對'].includes(cleanCategory)) bgClass = 'i-life';
    else if (['書籍','課程','教材','證書','文具','考試','金石堂','博客來'].includes(cleanCategory)) bgClass = 'i-learn';

    return { iconName, bgClass };
}

/**
 * 點擊分類圖標後，隱藏網格並展示單個圖標卡片畫面
 */
function selectCategory(categoryName, parentType) {
    if (typeof recordState !== 'undefined') {
        recordState.category = categoryName;
    }

    const cleanCategory = String(categoryName || '').trim();
    const meta = getCategoryMeta(cleanCategory);

    // 1. 更新 UI 卡片名稱與 Lucide 圖標
    const cardName = document.getElementById('selected-card-name');
    const cardIcon = document.getElementById('selected-card-icon');
    const cardAmountSub = document.getElementById('selected-card-amount-sub');
    const cardIconWrapper = document.getElementById('selected-card-icon-wrapper');

    if (cardName) cardName.innerText = cleanCategory;
    if (cardIcon) {
        cardIcon.setAttribute('data-lucide', meta.iconName);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // 2. 連動卡片漸層色外框與金額字串
    if (cardAmountSub) {
        const currentAmt = document.getElementById('record-amount-display')?.innerText || '0';
        if (parentType === 'income') {
            cardAmountSub.innerText = `+$${currentAmt}`;
            cardAmountSub.className = 'text-green';
            if (cardIconWrapper) cardIconWrapper.className = 'cate-icon-wrapper i-income-gold';
        } else {
            cardAmountSub.innerText = `$${currentAmt}`;
            cardAmountSub.className = 'text-red';
            if (cardIconWrapper) cardIconWrapper.className = `cate-icon-wrapper ${meta.bgClass}`;
        }
    }

    // 3. 清空隱藏所有分類網格視圖
    const gridIds = [
        'grid-expense', 'grid-income', 'grid-transfer', 'grid-receivable', 'grid-payable',
        'grid-expense-eat', 'grid-expense-transport', 'grid-expense-entertainment',
        'grid-expense-shopping', 'grid-expense-personal', 'grid-expense-medical',
        'grid-expense-home', 'grid-expense-family', 'grid-expense-life', 'grid-expense-learn'
    ];
    gridIds.forEach(id => {
        const g = document.getElementById(id);
        if (g) g.classList.remove('active');
    });

    // 4. 展開單個卡片與計算機
    const cardZone = document.getElementById('selected-category-card-zone');
    if (cardZone) cardZone.classList.add('show-card');

    toggleCalculator(true);
}

/**
 * 1. 計算機引擎 (Calculator Engine)
 */
function toggleCalculator(show) {
    const calc = document.getElementById('inline-calculator');
    if (calc) calc.style.display = show ? 'block' : 'none';
}

function pressCalc(val) {
    const display = document.getElementById('record-amount-display');
    const indicator = document.getElementById('calc-operator-indicator');
    const cardAmountSub = document.getElementById('selected-card-amount-sub');
    if (!display) return;

    if (val === 'C') {
        recordState.currentInput = '0';
        recordState.prevInput = '0';
        recordState.operator = null;
        if (indicator) indicator.innerText = '';
    } else if (val === 'backspace') {
        if (recordState.currentInput.length > 1) {
            recordState.currentInput = recordState.currentInput.slice(0, -1);
        } else {
            recordState.currentInput = '0';
        }
    } else if (['+', '-', '×', '÷'].includes(val)) {
        recordState.prevInput = recordState.currentInput;
        recordState.operator = val;
        if (indicator) indicator.innerText = val;
        recordState.currentInput = '0';
    } else if (val === 'done') {
        if (recordState.operator && recordState.prevInput !== '0') {
            let num1 = parseFloat(recordState.prevInput);
            let num2 = parseFloat(recordState.currentInput);
            let res = 0;
            if (recordState.operator === '+') res = num1 + num2;
            if (recordState.operator === '-') res = num1 - num2;
            if (recordState.operator === '×') res = num1 * num2;
            if (recordState.operator === '÷') res = num2 !== 0 ? num1 / num2 : 0;
            
            recordState.currentInput = String(Math.max(0, Math.round(res)));
            recordState.operator = null;
            if (indicator) indicator.innerText = '';
        }
        toggleCalculator(false); // 關閉鍵盤
    } else {
        if (recordState.currentInput === '0' || recordState.isCalculated) {
            recordState.currentInput = val;
            recordState.isCalculated = false;
        } else {
            recordState.currentInput += val;
        }
    }

    const formattedAmt = parseFloat(recordState.currentInput).toLocaleString();
    display.innerText = formattedAmt;

    // 即時連動單個卡片下方的金額數字
    if (cardAmountSub) {
        const isIncome = (recordState.type === '收入');
        cardAmountSub.innerText = `${isIncome ? '+' : ''}$${formattedAmt}`;
    }
}

/**
 * 點擊卡片旁「+」按鈕：重置狀態，回溯顯示原本的分類網格
 */
function resetCategorySelection() {
    const cardZone = document.getElementById('selected-category-card-zone');
    if (cardZone) cardZone.classList.remove('show-card');

    const currentType = recordState.type || '支出';
    const activeTab = document.querySelector('#record-type-tabs span.active');
    
    setRecordType(currentType, activeTab);
    toggleCalculator(false);
}

/**
 * 打包當前數據、同步扣減帳戶餘額並存入 LocalStorage
 */
function saveRecord() {
    const amountDisplay = document.getElementById('record-amount-display');
    const amount = amountDisplay ? parseFloat(amountDisplay.innerText.replace(/,/g, '')) : 0;

    if (amount <= 0) {
        alert('請輸入大於 0 的金額！');
        return;
    }

    const noteInput = document.getElementById('record-note');
    const note = noteInput ? noteInput.value.trim() : '';

    const currentAccountName = recordState.account || '錢包';
    const currentRecordType = recordState.type || '支出';
    const currentCategory = recordState.category || '未分類';

    let localAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    let targetAccount = localAccounts.find(acc => acc.name === currentAccountName);
    
    if (targetAccount) {
        if (currentRecordType === '支出' || currentRecordType === '應付款項') {
            targetAccount.amount = (parseFloat(targetAccount.amount) || 0) - amount;
        } else if (currentRecordType === '收入' || currentRecordType === '應收款項') {
            targetAccount.amount = (parseFloat(targetAccount.amount) || 0) + amount;
        }
        localStorage.setItem('koin_accounts', JSON.stringify(localAccounts));
    }

    const newRecord = {
        id: Date.now(),                                     
        type: currentRecordType,                             
        category: currentCategory,                           
        account: currentAccountName,                         
        project: recordState.project || '生活開銷',
        amount: amount,                                      
        date: recordState.date || new Date().toLocaleDateString(), 
        time: recordState.time || '12:00',                   
        note: note                                           
    };

    let localRecords = JSON.parse(localStorage.getItem('koin_records')) || [];
    localRecords.push(newRecord);
    localStorage.setItem('koin_records', JSON.stringify(localRecords));

    if (noteInput) noteInput.value = '';
    if (amountDisplay) amountDisplay.innerText = '0';
    
    recordState.currentInput = '0';
    recordState.prevInput = '0';
    recordState.operator = null;
    const indicator = document.getElementById('calc-operator-indicator');
    if (indicator) indicator.innerText = '';
    
    if (typeof changeSubGrid === 'function') {
        changeSubGrid('main-expense'); 
    }

    showPage('page-calendar'); 

    renderAccountOverview();
    resetCategorySelection();

    const cardZone = document.getElementById('selected-category-card-zone');
    if (cardZone) cardZone.classList.remove('show-card');

    renderDailyDetailsList();
}

/**
 * 根據 LocalStorage 內的紀錄，動態渲染日曆頁面下方的每日交易明細
 */
function renderDailyDetailsList() {
    const detailContainer = document.getElementById('daily-details-list');
    if (!detailContainer) return;

    const localRecords = JSON.parse(localStorage.getItem('koin_records')) || [];
    const currentSelectedDate = recordState.date || new Date().toLocaleDateString();

    const todayRecords = localRecords.filter(rec => rec.date === currentSelectedDate);

    if (todayRecords.length === 0) {
        detailContainer.innerHTML = `<p style="color: #8a8a8e; text-align: center; margin-top: 30px; font-size: 14px;">當天尚無交易明細</p>`;
        return;
    }

    detailContainer.innerHTML = ''; 

    todayRecords.forEach(rec => {
        const meta = getCategoryMeta(rec.category);

        const isExpense = (rec.type === '支出' || rec.type === '應付款項');
        const amountColorClass = isExpense ? 'text-red' : 'text-green';
        const formattedAmount = `${isExpense ? '' : '+'}${rec.amount.toLocaleString()}`;

        const itemHTML = `
            <div class="form-group" style="padding: 0; margin-bottom: 12px;">
                <div class="form-row" style="background: #1c1c28; padding: 14px 16px; border-radius: 16px; border-bottom: none;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div class="cate-icon-wrapper ${meta.bgClass}" style="width: 44px; height: 44px; margin-bottom: 0;">
                            <i data-lucide="${meta.iconName}"></i>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 15px; font-weight: 600; color: #ffffff; text-align: left;">${rec.category}</span>
                            <div style="display: flex; gap: 6px;">
                                <span style="background: rgba(255,255,255,0.05); color: #8e8e93; font-size: 10px; padding: 2px 8px; border-radius: 6px;">${rec.project || '生活開銷'}</span>
                                <span style="background: rgba(93,93,255,0.1); color: #8e8e93; font-size: 10px; padding: 2px 8px; border-radius: 6px;">${rec.account || '錢包'}</span>
                            </div>
                        </div>
                    </div>
                    <span class="${amountColorClass}" style="font-size: 17px; font-weight: 700;">
                        $${formattedAmount}
                    </span>
                </div>
            </div>
        `;
        detailContainer.insertAdjacentHTML('beforeend', itemHTML);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 統一更新畫面上所有帶有 amount-val 類別的金額顯示
 */
function updateAmountDisplay() {
    const amountElements = document.querySelectorAll('.amount-val');
    
    amountElements.forEach(el => {
        const rawValue = parseFloat(el.getAttribute('data-value')) || 0;
        
        if (isAmountHidden) {
            el.innerText = '••••••';
        } else {
            if (el.id === 'total-balance' || el.id === 'total-assets' || el.id === 'total-debts') {
                el.innerText = Math.abs(rawValue).toLocaleString();
            } else {
                const prefix = rawValue < 0 ? '-' : (el.parentNode.classList.contains('account-group-header') ? '+' : '');
                el.innerText = `${prefix}${Math.abs(rawValue).toLocaleString()}`;
            }
        }
    });
}

/**
 * 開啟帳戶明細
 */
function openAccountDetail(index) {
    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    const acc = savedAccounts[index];
    if (!acc) return;

    currentActiveAccountIndex = index;

    document.getElementById('detail-acc-name').innerText = acc.name;
    const displayAmount = acc.isCredit ? `-${Math.abs(acc.amount).toLocaleString()}` : acc.amount.toLocaleString();
    const amountEl = document.getElementById('detail-acc-amount');
    amountEl.innerText = displayAmount;
    amountEl.className = acc.isCredit ? 'amount text-red' : 'amount text-green';

    if (document.getElementById('info-name')) document.getElementById('info-name').innerText = acc.name;
    if (document.getElementById('info-group')) document.getElementById('info-group').innerText = acc.group;
    if (document.getElementById('info-initial')) document.getElementById('info-initial').innerText = (acc.initialAmount || 0).toLocaleString();
    if (document.getElementById('info-is-credit')) document.getElementById('info-is-credit').checked = acc.isCredit;
    
    switchDetailTab(0);
    showPage('page-account-detail');
}

function switchDetailTab(tabIndex) {
    const tabs = document.querySelectorAll('.detail-tab');
    const transContent = document.getElementById('tab-content-transactions');
    const infoContent = document.getElementById('tab-content-info');

    tabs.forEach((tab, i) => {
        tab.classList.toggle('active', i === tabIndex);
    });

    if (tabIndex === 0) {
        transContent.style.display = 'block';
        infoContent.style.display = 'none';
    } else {
        transContent.style.display = 'none';
        infoContent.style.display = 'block';
    }
}

/**
 * 儲存新帳戶
 */
function saveAccount() {
    const name = document.getElementById('acc-name').value;
    const amountInput = document.getElementById('acc-amount').value;
    const groupElement = document.getElementById('selected-group-text');
    const group = groupElement ? groupElement.innerText.replace('chevron-right', '').trim() : '未分組';
    const isCredit = document.getElementById('in-is-credit').checked;

    if (!name) { alert('請輸入帳戶名稱'); return; }

    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    const newAccount = { 
        name, 
        amount: parseFloat(amountInput) || 0, 
        group: group, 
        isCredit,
        id: Date.now() 
    };

    savedAccounts.push(newAccount);
    localStorage.setItem('koin_accounts', JSON.stringify(savedAccounts));

    renderAccountOverview();
    
    document.getElementById('acc-name').value = '';
    document.getElementById('acc-amount').value = '0';
    showPage('page-overview');
}

function openRecordAccountPicker() {
    filterRecordAccounts('');
    openModal('record-account-modal');
}

function filterRecordAccounts(keyword) {
    const container = document.getElementById('record-account-options');
    if (!container) return;
    container.innerHTML = '';

    const accounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    const filtered = accounts.filter(acc => acc.name.toLowerCase().includes(keyword.toLowerCase()));

    if (filtered.length === 0) {
        container.innerHTML = '<div class="option-item" style="color:#8a8a8e; text-align:center;">找不到相符帳戶</div>';
        return;
    }

    filtered.forEach(acc => {
        container.insertAdjacentHTML('beforeend', `
            <div class="option-item" onclick="selectRecordAccount('${acc.name}')">
                <span>${acc.name} <small style="color:#8a8a8e; margin-left:5px;">(${acc.group})</small></span>
            </div>
        `);
    });
}

function selectRecordAccount(name) {
    recordState.account = name;
    document.getElementById('btn-select-account').innerText = name;
    closeModal('record-account-modal');
}

function openRecordProjectPicker() {
    filterRecordProjects('');
    openModal('record-project-modal');
}

function filterRecordProjects(keyword) {
    const container = document.getElementById('record-project-options');
    if (!container) return;
    container.innerHTML = '';

    const projects = JSON.parse(localStorage.getItem('koin_projects')) || [];
    
    if ('生活開銷'.includes(keyword)) {
        container.insertAdjacentHTML('beforeend', `<div class="option-item" onclick="selectRecordProject('生活開銷')">生活開銷</div>`);
    }

    const filtered = projects.filter(proj => proj.name.toLowerCase().includes(keyword.toLowerCase()));
    filtered.forEach(proj => {
        container.insertAdjacentHTML('beforeend', `
            <div class="option-item" onclick="selectRecordProject('${proj.name}')">${proj.name}</div>
        `);
    });
}

function selectRecordProject(name) {
    recordState.project = name;
    document.getElementById('btn-select-project').innerText = name;
    closeModal('record-project-modal');
}

function switchAdvancedTab(tabType) {
    recordState.advType = tabType;
    document.querySelectorAll('#record-advanced-modal .detail-tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById(`adv-pane-single`).style.display = 'none';
    document.getElementById(`adv-pane-cycle`).style.display = 'none';
    document.getElementById(`adv-pane-install`).style.display = 'none';

    if (tabType === 'single') {
        document.getElementById('adv-tab-single').classList.add('active');
        document.getElementById('adv-pane-single').style.display = 'block';
    } else if (tabType === 'cycle') {
        document.getElementById('adv-tab-cycle').classList.add('active');
        document.getElementById('adv-pane-cycle').style.display = 'block';
    } else if (tabType === 'install') {
        document.getElementById('adv-tab-install').classList.add('active');
        document.getElementById('adv-pane-install').style.display = 'block';
    }
}

let calendarDisplayDate = new Date();

function openRecordCalendar() {
    calendarDisplayDate = new Date(); 
    renderDynamicRecordCalendar();
    openModal('record-calendar-modal');
}

function changeRecordMonth(direction) {
    calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + direction);
    renderDynamicRecordCalendar();
}

function renderDynamicRecordCalendar() {
    const year = calendarDisplayDate.getFullYear();
    const month = calendarDisplayDate.getMonth(); 

    const titleTitle = document.getElementById('calendar-month-year-title');
    if (titleTitle) {
        titleTitle.innerText = `${year} 年 ${String(month + 1).padStart(2, '0')} 月`;
    }

    const gridContainer = document.getElementById('record-calendar-grid');
    if (!gridContainer) return;
    gridContainer.innerHTML = ''; 

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        gridContainer.insertAdjacentHTML('beforeend', `<div style="padding: 8px;"></div>`);
    }

    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const isToday = (year === today.getFullYear() && month === today.getMonth() && day === today.getDate());
        const todayStyle = isToday ? 'border: 2px solid #5d5dff; font-weight: bold; color: #5d5dff;' : '';

        const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
        
        const cellHTML = `
            <div onclick="selectRecordCalendarDate('${dateStr}', '${month + 1}/${day}')" 
                 style="padding: 8px 0; cursor: pointer; border-radius: 50%; font-size: 14px; transition: background 0.2s; ${todayStyle}"
                 class="calendar-day-cell">
                ${day}
            </div>
        `;
        gridContainer.insertAdjacentHTML('beforeend', cellHTML);
    }
}

function selectRecordCalendarDate(fullDate, displayDate) {
    recordState.date = fullDate; 
    
    const dateBtn = document.getElementById('btn-select-date');
    if (dateBtn) {
        dateBtn.innerText = displayDate; 
    }
    
    closeModal('record-calendar-modal');
}

function openRecordTimePicker() {
    const now = new Date();
    const hrInput = document.getElementById('input-record-hour');
    const minInput = document.getElementById('input-record-minute');
    
    if (hrInput && minInput) {
        hrInput.value = now.getHours();
        minInput.value = now.getMinutes();
    }
    
    openModal('record-time-modal');
}

function confirmRecordTime() {
    const hr = document.getElementById('input-record-hour').value;
    const min = document.getElementById('input-record-minute').value;
    
    const formattedTime = `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    
    if (typeof recordState !== 'undefined') {
        recordState.time = formattedTime;
    }
    
    const timeBtn = document.getElementById('btn-select-time');
    if (timeBtn) {
        timeBtn.innerText = formattedTime;
    }
    
    closeModal('record-time-modal');
}

function setRecordType(type, el) {
    if (typeof recordState !== 'undefined') {
        recordState.type = type;
    }
    
    document.querySelectorAll('#record-type-tabs span').forEach(s => s.classList.remove('active', 'text-blue'));
    if (el) el.classList.add('active', 'text-blue');

    const expenseGrid = document.getElementById('grid-expense');
    const incomeGrid = document.getElementById('grid-income');
    const transferGrid = document.getElementById('grid-transfer');
    const receivableGrid = document.getElementById('grid-receivable');
    const payableGrid = document.getElementById('grid-payable');
    
    if (expenseGrid) expenseGrid.classList.remove('active');
    if (incomeGrid) incomeGrid.classList.remove('active');
    if (transferGrid) transferGrid.classList.remove('active');
    if (receivableGrid) receivableGrid.classList.remove('active');
    if (payableGrid) payableGrid.classList.remove('active');

    if (type === '支出' && expenseGrid) {
        expenseGrid.classList.add('active');
    } else if (type === '收入' && incomeGrid) {
        incomeGrid.classList.add('active');
    } else if (type === '轉帳' && transferGrid) {
        transferGrid.classList.add('active');
    } else if (type === '應收款項' && receivableGrid) {
        receivableGrid.classList.add('active');
    } else if (type === '應付款項' && payableGrid) {
        payableGrid.classList.add('active');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function handleFabClick(element) {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    const currentPage = activePage.id;
    
    if (currentPage !== 'page-calendar') {
        showPage('page-calendar', element);
        
        if (typeof focusOnCurrentMonth === 'function') {
            setTimeout(() => {
                focusOnCurrentMonth();
                updateCalendarHeaderToToday();
            }, 50); 
        }
    } else {
        showPage('page-add-record', element);
    }
}

function updateCalendarHeaderToToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    
    const headerTitle = document.getElementById('full-calendar-month');
    if (headerTitle) {
        headerTitle.innerText = `${year}/${month}`;
    }
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
    }
}

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

    // 預先載入當日明細
    renderDailyDetailsList();
    
    // 4. 預設首頁狀態與表單初始化
    showPage('page-overview');
    resetRecordFormButtons();
});

/**
 * 核心頁面切換
 */
function showPage(pageId, element) {
    const target = document.getElementById(pageId);
    if (!target) return;

    // 1. 切換頁面時，強制關閉畫面上殘留的所有彈窗 Modal
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.style.setProperty('display', 'none', 'important');
        m.classList.remove('active');
    });
    
    // 2. 切換 Page 顯示
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    target.classList.add('active');

    // 3. 處理導覽列 active 狀態
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    
    const fabElement = document.getElementById('main-fab');
    if (fabElement) fabElement.classList.remove('fab-active');

    if (element) {
        element.classList.add('active');
        if (element.classList.contains('tab-fab')) element.classList.add('fab-active');
    } else {
        const autoTab = document.querySelector(`.tab-bar [onclick*="${pageId}"]`);
        if (autoTab) autoTab.classList.add('active');
    }

    // 4. 更新 FAB 圖示
    const fabIcon = document.getElementById('fab-icon');
    if (fabIcon) {
        const iconName = (pageId === 'page-calendar' || pageId === 'page-add-record') ? 'plus' : 'layers';
        fabIcon.setAttribute('data-lucide', iconName);
    }

    // 在 showPage 函式結尾處加入判斷
if (pageId === 'page-trends') {
    if (typeof renderTrendsPage === 'function') renderTrendsPage();
}

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 全域狀態變數
let currentActiveAccountIndex = null;
let isAmountHidden = false; 

let recordState = {
    type: '支出',
    currentInput: '0',    
    prevInput: '0',       
    operator: null,       
    isCalculated: false,  
    account: '錢包',
    project: '生活開銷',
    date: '2026/08/15',
    time: '12:00',
    advType: 'single'     
};

/**
 * 帳戶總覽列表排版
 */
function renderAccountOverview() {
    const listContainer = document.getElementById('account-list');
    if (!listContainer) return;

    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [
        { name: '錢包', amount: 0, group: '現金', isCredit: false, id: 1 }
    ];
    listContainer.innerHTML = ''; 

    let totalBalance = 0;
    let totalAssets = 0;
    let totalDebts = 0;

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

    for (const [groupName, data] of Object.entries(groups)) {
        if (data.accounts.length === 0) continue;

        const groupHeaderHTML = `
            <div class="account-group-header" style="display:flex; justify-content:space-between; padding:15px 4px 10px 4px; color:#ffffff; font-size:14px; font-weight:700;">
                <span>－ ${groupName} (${data.accounts.length})</span>
                <span class="amount-val ${data.subtotal < 0 ? 'text-red' : ''}" data-value="${data.subtotal}" style="color: #ffffff; font-weight: 600;">
                    ${data.subtotal < 0 ? '-' : '+'}${Math.abs(data.subtotal).toLocaleString()}
                </span>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', groupHeaderHTML);

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
 * 支出子分類網格切換核心
 */
function changeSubGrid(target) {
    const expenseGrid = document.getElementById('grid-expense');
    const eatGrid = document.getElementById('grid-expense-eat');
    const transportGrid = document.getElementById('grid-expense-transport');
    const entertainmentGrid = document.getElementById('grid-expense-entertainment');
    const shoppingGrid = document.getElementById('grid-expense-shopping');
    const personalGrid = document.getElementById('grid-expense-personal');
    const medicalGrid = document.getElementById('grid-expense-medical');
    const homeGrid = document.getElementById('grid-expense-home');
    const familyGrid = document.getElementById('grid-expense-family');
    const lifeGrid = document.getElementById('grid-expense-life');
    const learnGrid = document.getElementById('grid-expense-learn');
    
    if (!expenseGrid || !eatGrid || !transportGrid || !entertainmentGrid || !shoppingGrid || !personalGrid || !medicalGrid || !homeGrid || !familyGrid || !lifeGrid || !learnGrid) return;

    expenseGrid.classList.remove('active');
    eatGrid.classList.remove('active');
    transportGrid.classList.remove('active');
    entertainmentGrid.classList.remove('active');
    shoppingGrid.classList.remove('active');
    personalGrid.classList.remove('active');
    medicalGrid.classList.remove('active');
    homeGrid.classList.remove('active');
    familyGrid.classList.remove('active');
    lifeGrid.classList.remove('active');
    learnGrid.classList.remove('active');

    if (target === 'eat') eatGrid.classList.add('active');
    else if (target === 'transport') transportGrid.classList.add('active');
    else if (target === 'entertainment') entertainmentGrid.classList.add('active');
    else if (target === 'shopping') shoppingGrid.classList.add('active');
    else if (target === 'personal') personalGrid.classList.add('active');
    else if (target === 'medical') medicalGrid.classList.add('active');
    else if (target === 'home') homeGrid.classList.add('active');
    else if (target === 'family') familyGrid.classList.add('active');
    else if (target === 'life') lifeGrid.classList.add('active');
    else if (target === 'learn') learnGrid.classList.add('active');
    else if (target === 'main-expense') expenseGrid.classList.add('active');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 點擊分類圖標後，展示卡片並開啟計算機
 */
function selectCategory(categoryName, parentType) {
    if (typeof recordState !== 'undefined') {
        recordState.category = categoryName;
    }
    
    const cleanCategory = String(categoryName || '').trim();
    
    const expenseIconMap = {
        '飲食': 'utensils', '交通': 'car', '娛樂': 'party-popper', '購物': 'shopping-bag', '個人': 'user', '醫療': 'stethoscope', '家居': 'home', '家庭': 'users', '生活': 'coffee', '學習': 'book',
        '早餐': 'croissant', '午餐': 'utensils', '晚餐': 'soup', '點心': 'cookie', '飲料': 'cup-soda', '酒類': 'beer', '水果': 'grape', '宵夜': 'pizza', '礦泉水': 'glass-water',
        '加油費': 'fuel', '停車費': 'square-parking', '火車': 'train-front', '公車': 'bus-front', '捷運': 'train-front-tunnel', '悠遊卡': 'credit-card', '汽車': 'car-front', '計程車': 'car-taxi-front', '摩托車': 'motorbike', '單車': 'bike', '機票': 'plane', '船票': 'ship',
        '手遊': 'gamepad-2', '音樂': 'music', 'Netflix': 'monitor-play', '電影': 'clapperboard', '遊樂園': 'roller-coaster', '展覽': 'landmark', '運動': 'dumbbell',
        '蝦皮購物': 'shopping-bag', 'momo購物': 'shopping-bag', 'PChome24h': 'shopping-bag','市場': 'shopping-cart', '衣物': 'shirt', '鞋子': 'sport-shoe', '配件': 'glasses', '包包': 'handbag', '美妝保養': 'mirror-round', '精品': 'gem', '禮物': 'gift', '電子產品': 'laptop', '應用軟體': 'app-window', 'UNIQLO': 'shirt', 'NET': 'shirt',
        '社交': 'handshake', '電信費': 'phone', '借款': 'coins', '投資': 'trending-up', '稅金': 'circle-dollar-sign', '保險': 'shield-check', '捐款': 'hand-heart', '寵物': 'dog', '彩券': 'receipt',
        '門診': 'stethoscope', '藥品': 'pill', '醫療用品': 'briefcase-medical', '打針': 'syringe', '住院': 'bed-single', '手術': 'slice', '健康檢查': 'clipboard-plus',
        '日常用品': 'soap-dispenser-droplet', '水費': 'droplets', '電費': 'zap', '燃料費': 'flame', '電話費': 'phone-call', '網路費': 'house-wifi', '房租': 'building', '洗衣費': 'washing-machine', '修繕費': 'wrench', '家具': 'sofa', '訂閱': 'newspaper', '家電': 'tv', '全聯': 'store', '屈臣氏': 'store', '康是美': 'store',
        '生活費': 'wallet-minimal', '教育': 'graduation-cap', '看護': 'person-standing', '玩具': 'toy-brick', '才藝': 'palette',
        '美容美髮': 'scissors', '住宿': 'hotel', '旅行': 'tree-palm', '派對': 'wine',
        '書籍': 'book-open-text', '課程': 'presentation', '教材': 'book-marked', '證書': 'book-user', '文具': 'pen-ruler', '考試': 'book-open-check', '金石堂': 'book-open', '博客來': 'book-open'
    };

    const incomeIconMap = {
        '薪水': 'dollar-sign', '獎金': 'circle-dollar-sign', '投資': 'trending-up', '收款': 'hand-coins', '彩券': 'newspaper', '利息': 'landmark', '消費回饋': 'credit-card', '零用錢': 'circle-dollar-sign', '發票': 'receipt', '補助': 'building-2'
    };

    const otherIconMap = {
        '轉帳': 'arrow-left-right', '提款': 'credit-card', '存款': 'banknote', '還款': 'undo-2', '借出': 'hand-coins', '代付': 'handshake', '報帳': 'briefcase-business', '借入': 'hand-coins', '信貸': 'credit-card', '車貸': 'car', '房貸': 'house'
    };

    let iconName = null;
    if (parentType === 'income') {
        iconName = incomeIconMap[cleanCategory];
    }
    if (!iconName) {
        iconName = expenseIconMap[cleanCategory] || incomeIconMap[cleanCategory] || otherIconMap[cleanCategory];
    }
    if (!iconName) {
        iconName = (parentType === 'income') ? 'dollar-sign' : 'tag';
    }
   
    const cardName = document.getElementById('selected-card-name');
    const cardIcon = document.getElementById('selected-card-icon');
    const cardAmountSub = document.getElementById('selected-card-amount-sub');
    const cardIconWrapper = document.getElementById('selected-card-icon-wrapper');

    if (cardName) cardName.innerText = cleanCategory;
    if (cardIcon) {
        cardIcon.setAttribute('data-lucide', iconName);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    if (cardAmountSub) {
        if (parentType === 'income') {
            cardAmountSub.innerText = '+$0';
            cardAmountSub.className = 'text-green';
            if (cardIconWrapper) cardIconWrapper.className = 'cate-icon-wrapper i-income-gold';
        } else {
            cardAmountSub.innerText = '$0';
            cardAmountSub.className = 'text-red';

            const isTransport = ['加油費','停車費','火車','公車','捷運','悠遊卡','汽車','計程車','摩托車','單車','機票','船票'].includes(cleanCategory);
            const isEntertainment = ['手遊','彩券/刮刮樂','音樂','Spotify','Netflix','電影','遊樂園','展覽','運動'].includes(cleanCategory);
            const isShopping = ['蝦皮購物','momo購物','PChome24h','市場','衣物','鞋子','配件','包包','美妝保養','精品','禮物','電子產品','應用軟體','UNIQLO','NET'].includes(cleanCategory);
            const isPersonal = ['社交','電信費','借款','投資','稅金','保險','捐款','寵物','彩券'].includes(cleanCategory);
            const isMedical = ['門診','藥品','醫療用品','打針','住院','手術','健康檢查'].includes(cleanCategory);
            const isHome = ['日常用品','水費','電費','燃料費','電話費','網路費','房租','洗衣費','修繕費','家具','訂閱','家電','全聯','屈臣氏','康是美'].includes(cleanCategory);
            const isFamily = ['生活費','教育','看護','玩具','才藝'].includes(cleanCategory);
            const isLife = ['美容美髮','住宿','旅行','派對'].includes(cleanCategory);
            const isLearn = ['書籍','課程','教材','證書','探索','文具','考試','金石堂','博客來'].includes(cleanCategory);

            if (cardIconWrapper) {
                if (isTransport) cardIconWrapper.className = 'cate-icon-wrapper i-transport';
                else if (isEntertainment) cardIconWrapper.className = 'cate-icon-wrapper i-entertainment';
                else if (isShopping) cardIconWrapper.className = 'cate-icon-wrapper i-shopping';
                else if (isPersonal) cardIconWrapper.className = 'cate-icon-wrapper i-personal';
                else if (isMedical) cardIconWrapper.className = 'cate-icon-wrapper i-medical';
                else if (isHome) cardIconWrapper.className = 'cate-icon-wrapper i-home';
                else if (isFamily) cardIconWrapper.className = 'cate-icon-wrapper i-family';
                else if (isLife) cardIconWrapper.className = 'cate-icon-wrapper i-life';
                else if (isLearn) cardIconWrapper.className = 'cate-icon-wrapper i-learn';
                else cardIconWrapper.className = 'cate-icon-wrapper i-income-gold';
            }
        }
    }

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

    const cardZone = document.getElementById('selected-category-card-zone');
    if (cardZone) cardZone.classList.add('show-card');

    toggleCalculator(true);
}

/**
 * 計算機引擎
 */
function toggleCalculator(show) {
    const calc = document.getElementById('inline-calculator');
    if (calc) calc.style.display = show ? 'block' : 'none';
}

function pressCalc(val) {
    const display = document.getElementById('record-amount-display');
    const indicator = document.getElementById('calc-operator-indicator');
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
        toggleCalculator(false);
    } else {
        if (recordState.currentInput === '0' || recordState.isCalculated) {
            recordState.currentInput = val;
            recordState.isCalculated = false;
        } else {
            recordState.currentInput += val;
        }
    }
    
    display.innerText = parseFloat(recordState.currentInput).toLocaleString();

    const cardAmountSub = document.getElementById('selected-card-amount-sub');
    if (cardAmountSub) {
        const isIncome = (recordState.type === '收入');
        cardAmountSub.innerText = `${isIncome ? '+' : ''}$${display.innerText}`;
    }
}

function resetCategorySelection() {
    const cardZone = document.getElementById('selected-category-card-zone');
    if (cardZone) cardZone.classList.remove('show-card');

    const currentType = recordState.type || '支出';
    const activeTab = document.querySelector('#record-type-tabs span.active');
    
    setRecordType(currentType, activeTab);
    toggleCalculator(false);
}

/**
 * 儲存記帳資料
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

    let localAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [
        { name: '錢包', amount: 0, group: '現金', isCredit: false, id: 1 }
    ];
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
    renderDailyDetailsList();
    resetRecordFormButtons();
}

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
 * 帳戶明細相關
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
    const tabs = document.querySelectorAll('#page-account-detail .detail-tab');
    const transContent = document.getElementById('tab-content-transactions');
    const infoContent = document.getElementById('tab-content-info');

    tabs.forEach((tab, i) => {
        tab.classList.toggle('active', i === tabIndex);
    });

    if (tabIndex === 0) {
        if (transContent) transContent.style.display = 'block';
        if (infoContent) infoContent.style.display = 'none';
    } else {
        if (transContent) transContent.style.display = 'none';
        if (infoContent) infoContent.style.display = 'block';
    }
}

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

function selectGroup(name) {
    const display = document.getElementById('selected-group-text');
    if (display) {
        display.innerHTML = `${name} <i data-lucide="chevron-right" class="s-icon"></i>`;
    }
    closeModal('group-picker-modal');
}

function setRecordType(type, el) {
    if (typeof recordState !== 'undefined') recordState.type = type;
    
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

    if (type === '支出' && expenseGrid) expenseGrid.classList.add('active');
    else if (type === '收入' && incomeGrid) incomeGrid.classList.add('active');
    else if (type === '轉帳' && transferGrid) transferGrid.classList.add('active');
    else if (type === '應收款項' && receivableGrid) receivableGrid.classList.add('active');
    else if (type === '應付款項' && payableGrid) payableGrid.classList.add('active');

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
        resetRecordFormButtons();
        showPage('page-add-record', element);
    }
}

function updateCalendarHeaderToToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    
    const headerTitle = document.getElementById('full-calendar-month');
    if (headerTitle) headerTitle.innerText = `${year}/${month}`;
}

// ==========================================
// 模組彈窗共用控制
// ==========================================
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.setProperty('display', 'flex', 'important');
        modal.classList.add('active');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.setProperty('display', 'none', 'important');
        modal.classList.remove('active');
    }
}

function handleMenuAction(action) {
    console.log("執行：" + action);
    closeModal('more-options-modal');
}

function deleteAccountAction() {
    if (confirm("確定要刪除此帳戶嗎？所有交易紀錄將被移除。")) {
        let accounts = JSON.parse(localStorage.getItem('koin_accounts') || '[]');
        if (typeof currentActiveAccountIndex !== 'undefined' && currentActiveAccountIndex !== null) {
            accounts.splice(currentActiveAccountIndex, 1);
            localStorage.setItem('koin_accounts', JSON.stringify(accounts));
            closeModal('more-options-modal');
            renderAccountOverview(); 
            showPage('page-overview');
        }
    }
}

function openCyclePicker() { openModal('cycle-picker-modal'); }
function updateCycleText(val) {
    const rangeDisplay = document.getElementById('modal-date-range');
    const noteDisplay = document.getElementById('modal-cycle-note');
    if (val == 31) {
        rangeDisplay.innerText = "2026/04/01 – 2026/04/30";
        noteDisplay.innerText = "帳單結帳日：每月月底";
    } else {
        rangeDisplay.innerText = `2026/03/${val.padStart(2,'0')} – 2026/04/${val.padStart(2,'0')}`;
        noteDisplay.innerText = `帳單結帳日：每月 ${val} 號`;
    }
}

function confirmCycle() {
    const val = document.getElementById('cycle-slider').value;
    const text = (val == 31) ? "每月月底" : `每月 ${val} 號`;
    document.getElementById('main-cycle-display').innerHTML = `${text} <i data-lucide="chevron-right" class="s-icon"></i>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    closeModal('cycle-picker-modal');
}

function openGroupPicker() { openModal('group-picker-modal'); }

function toggleCreditFields() {
    const isCredit = document.getElementById('in-is-credit').checked;
    document.getElementById('credit-extra-fields').style.display = isCredit ? 'block' : 'none';
    const displayAmount = document.getElementById('add-display-amount');
    if (displayAmount) displayAmount.className = isCredit ? 'val text-red' : 'val text-green';
}

let currentDueMode = 'fixed';
let selectedDueDay = 1;

function openDueDateModal() { backToDueMode(); openModal('due-date-modal'); }
function backToDueMode() {
    document.getElementById('due-mode-selection').style.display = 'block';
    document.getElementById('due-mode-footer').style.display = 'flex';
    document.getElementById('due-detail-picker').style.display = 'none';
}
function enterDueDetail(mode) {
    currentDueMode = mode;
    document.getElementById('due-mode-selection').style.display = 'none';
    document.getElementById('due-mode-footer').style.display = 'none';
    document.getElementById('due-detail-picker').style.display = 'block';
    const list = document.getElementById('picker-scroll-list');
    list.innerHTML = '';
    const prefix = (mode === 'fixed') ? '每月第 ' : '結帳後 ';
    for (let i = 1; i <= 31; i++) {
        const item = document.createElement('div');
        item.className = `picker-item ${i === selectedDueDay ? 'selected' : ''}`;
        item.innerText = `${prefix}${i} 日`;
        item.onclick = function() {
            document.querySelectorAll('.picker-item').forEach(p => p.classList.remove('selected'));
            this.classList.add('selected');
            selectedDueDay = i;
        };
        list.appendChild(item);
    }
}
function confirmDueDate() {
    const prefix = (currentDueMode === 'fixed') ? '每月' : '結帳後';
    document.getElementById('due-date-display').innerHTML = `${prefix}${selectedDueDay}日 <i data-lucide="chevron-right" class="s-icon"></i>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    closeModal('due-date-modal');
}

function handleSettingsAction(action) {
    if (action === 'Google 帳號登入') alert('正在啟動 Google OAuth 安全登入驗證...');
    else if (action === '匯出 CSV') alert('歷史帳目資料已成功匯出至下載資料夾！');
    else if (action === '重新計算餘額') {
        renderAccountOverview();
        alert('全域餘額核心演算法重新計算重繪完畢！');
    } else if (action === '清除所有快取') {
        if (confirm('警告：這將會永久刪除本機所有的帳戶與記帳紀錄，確定要重置嗎？')) {
            localStorage.clear();
            alert('資料已完全重置。系統將重新載入。');
            window.location.reload();
        }
    }
}

function handleSettingsToggleHide(isChecked) {
    if (typeof isAmountHidden !== 'undefined') {
        isAmountHidden = isChecked;
        const eyeIcon = document.getElementById('eye-toggle');
        if (eyeIcon) {
            eyeIcon.setAttribute('data-lucide', isAmountHidden ? 'eye-off' : 'eye');
        }
        updateAmountDisplay();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

let currentViewingRecordId = null;

/**
 * 1. 更新日曆明細渲染：為每筆記錄加上點擊事件 onclick="openRecordSummary(...)"
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

    detailContainer.innerHTML = ''; 

    todayRecords.forEach(rec => {
        const cleanCategory = String(rec.category || '').trim();
        const isExpense = (rec.type === '支出' || rec.type === '應付款項');
        const iconName = expenseIconMap[cleanCategory] || 'tag';

        const itemHTML = `
            <div class="form-group" style="padding: 0; margin-bottom: 12px; cursor: pointer;" onclick="openRecordSummary(${rec.id})">
                <div class="form-row" style="background: #1c1c28; padding: 14px 16px; border-radius: 16px; border-bottom: none;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div class="cate-icon-wrapper i-shopping" style="width: 44px; height: 44px; margin-bottom: 0;">
                            <i data-lucide="${iconName}"></i>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 15px; font-weight: 600; color: #ffffff;">${rec.category}</span>
                            <div style="display: flex; gap: 6px;">
                                <span style="background: rgba(255,255,255,0.05); color: #8e8e93; font-size: 10px; padding: 2px 8px; border-radius: 6px;">${rec.project || '玩樂'}</span>
                                <span style="background: rgba(93,93,255,0.1); color: #8e8e93; font-size: 10px; padding: 2px 8px; border-radius: 6px;">${rec.account || 'iLEO'}</span>
                            </div>
                        </div>
                    </div>
                    <span class="${isExpense ? 'text-red' : 'text-green'}" style="font-size: 17px; font-weight: 700;">
                        ${isExpense ? '-' : '+'}$${parseFloat(rec.amount).toLocaleString()}
                    </span>
                </div>
            </div>
        `;
        detailContainer.insertAdjacentHTML('beforeend', itemHTML);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 2. 開啟摘要卡片彈窗
 */
function openRecordSummary(recordId) {
    currentViewingRecordId = recordId;
    const records = JSON.parse(localStorage.getItem('koin_records') || '[]');
    const rec = records.find(r => r.id === recordId);
    if (!rec) return;

    document.getElementById('summary-note-text').innerText = rec.note || '無備註';
    document.getElementById('summary-sub-cat-name').innerText = rec.category;
    document.getElementById('summary-amount-text').innerText = `-$${parseFloat(rec.amount).toLocaleString()}`;
    document.getElementById('summary-account-text').innerText = rec.account || 'iLEO';
    document.getElementById('summary-project-text').innerText = rec.project || '玩樂';
    document.getElementById('summary-date-text').innerText = rec.date;
    document.getElementById('summary-time-text').innerText = rec.time || '12:25';

    openModal('record-summary-modal');
}

/**
 * 3. 從摘要卡片跳轉進入「編輯記錄」頁面
 */
function openEditRecordPage() {
    closeModal('record-summary-modal');

    const records = JSON.parse(localStorage.getItem('koin_records') || '[]');
    const rec = records.find(r => r.id === currentViewingRecordId);
    if (!rec) return;

    document.getElementById('edit-rec-cat-name').innerText = rec.category;
    document.getElementById('edit-rec-amount').value = rec.amount;
    document.getElementById('edit-btn-account').innerText = rec.account || 'iLEO';
    document.getElementById('edit-btn-project').innerText = rec.project || '玩樂';
    document.getElementById('edit-btn-date').innerText = rec.date;
    document.getElementById('edit-btn-time').innerText = rec.time || '12:25';
    document.getElementById('edit-rec-note').value = rec.note || '';

    showPage('page-edit-record');
}

/**
 * 4. 儲存修改後的記帳項目（連動帳戶與日曆）
 */
function saveEditedRecord() {
    const newAmount = parseFloat(document.getElementById('edit-rec-amount').value) || 0;
    const newNote = document.getElementById('edit-rec-note').value.trim();
    const newAccount = document.getElementById('edit-btn-account').innerText.trim();
    const newProject = document.getElementById('edit-btn-project').innerText.trim();

    let records = JSON.parse(localStorage.getItem('koin_records') || '[]');
    const targetIdx = records.findIndex(r => r.id === currentViewingRecordId);
    
    if (targetIdx !== -1) {
        records[targetIdx].amount = newAmount;
        records[targetIdx].note = newNote;
        records[targetIdx].account = newAccount;
        records[targetIdx].project = newProject;
        localStorage.setItem('koin_records', JSON.stringify(records));
    }

    // 播放打勾動畫
    const toast = document.getElementById('save-success-toast');
    if (toast) {
        toast.style.display = 'flex';
        setTimeout(() => {
            toast.style.display = 'none';
            showPage('page-calendar');
            renderAccountOverview();
            renderDailyDetailsList();
        }, 600);
    } else {
        showPage('page-calendar');
        renderAccountOverview();
        renderDailyDetailsList();
    }
}

/**
 * 5. 刪除當前紀錄
 */
function deleteCurrentViewingRecord() {
    if (confirm('確定要刪除這筆記帳紀錄嗎？')) {
        let records = JSON.parse(localStorage.getItem('koin_records') || '[]');
        records = records.filter(r => r.id !== currentViewingRecordId);
        localStorage.setItem('koin_records', JSON.stringify(records));

        closeModal('record-summary-modal');
        renderDailyDetailsList();
        renderAccountOverview();
    }
}

/**
 * 重置新增記錄表單四個按鈕的預設顯示內容
 */
function resetRecordFormButtons() {
    const btnAcc = document.getElementById('btn-select-account');
    const btnProj = document.getElementById('btn-select-project');
    const btnDate = document.getElementById('btn-select-date');
    const btnTime = document.getElementById('btn-select-time');

    if (btnAcc) btnAcc.innerText = recordState.account || '錢包';
    if (btnProj) btnProj.innerText = recordState.project || '生活開銷';
    if (btnDate) btnDate.innerText = '今天';
    if (btnTime) btnTime.innerText = '現在';
}

// ==========================================
// 4 大選取模組：帳戶 / 專案 / 日期 / 時間
// ==========================================

// 1. 帳戶選取模組
function openRecordAccountPicker() {
    filterRecordAccounts('');
    openModal('record-account-modal');
}

function filterRecordAccounts(keyword) {
    const container = document.getElementById('record-account-options');
    if (!container) return;
    container.innerHTML = '';

    let accounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    if (accounts.length === 0) {
        accounts = [{ name: '錢包', group: '現金' }];
    }

    const filtered = accounts.filter(acc => acc.name.toLowerCase().includes(keyword.toLowerCase()));

    if (filtered.length === 0) {
        container.innerHTML = '<div class="option-item" style="color:#8a8a8e; text-align:center; padding:15px;">找不到相符帳戶</div>';
        return;
    }

    filtered.forEach(acc => {
        container.insertAdjacentHTML('beforeend', `
            <div class="option-item" onclick="selectRecordAccount('${acc.name}')" style="padding: 14px 16px; cursor: pointer; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
                <span>${acc.name}</span>
                <small style="color: #8e8e93;">${acc.group || '現金'}</small>
            </div>
        `);
    });
}

function selectRecordAccount(name) {
    if (typeof recordState !== 'undefined') recordState.account = name;
    const btn = document.getElementById('btn-select-account');
    if (btn) btn.innerText = name;
    closeModal('record-account-modal');
}

// 2. 專案選取模組
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
        container.insertAdjacentHTML('beforeend', `
            <div class="option-item" onclick="selectRecordProject('生活開銷')" style="padding: 14px 16px; cursor: pointer; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.05);">
                生活開銷
            </div>
        `);
    }

    const filtered = projects.filter(proj => proj.name.toLowerCase().includes(keyword.toLowerCase()));
    filtered.forEach(proj => {
        if (proj.name !== '生活開銷') {
            container.insertAdjacentHTML('beforeend', `
                <div class="option-item" onclick="selectRecordProject('${proj.name}')" style="padding: 14px 16px; cursor: pointer; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    ${proj.name}
                </div>
            `);
        }
    });
}

function selectRecordProject(name) {
    if (typeof recordState !== 'undefined') recordState.project = name;
    const btn = document.getElementById('btn-select-project');
    if (btn) btn.innerText = name;
    closeModal('record-project-modal');
}

// 3. 動態日曆選取模組
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

    const titleEl = document.getElementById('calendar-month-year-title');
    if (titleEl) {
        titleEl.innerText = `${year} 年 ${String(month + 1).padStart(2, '0')} 月`;
    }

    const gridContainer = document.getElementById('record-calendar-grid');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        gridContainer.insertAdjacentHTML('beforeend', `<div></div>`);
    }

    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const isToday = (year === today.getFullYear() && month === today.getMonth() && day === today.getDate());
        const todayStyle = isToday ? 'border: 2px solid #5d5dff; font-weight: bold; color: #5d5dff;' : 'color: #ffffff;';
        const dateStr = `${year}/${String(month + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
        
        gridContainer.insertAdjacentHTML('beforeend', `
            <div onclick="selectRecordCalendarDate('${dateStr}', '${month + 1}/${day}')" 
                 style="padding: 10px 0; cursor: pointer; border-radius: 50%; font-size: 14px; text-align: center; ${todayStyle}">
                ${day}
            </div>
        `);
    }
}

function selectRecordCalendarDate(fullDate, displayDate) {
    if (typeof recordState !== 'undefined') recordState.date = fullDate;
    const dateBtn = document.getElementById('btn-select-date');
    if (dateBtn) dateBtn.innerText = displayDate;
    closeModal('record-calendar-modal');
}

// 4. 時間選取模組
function openRecordTimePicker() {
    const now = new Date();
    const hrInput = document.getElementById('input-record-hour');
    const minInput = document.getElementById('input-record-minute');
    
    if (hrInput) hrInput.value = now.getHours();
    if (minInput) minInput.value = now.getMinutes();
    
    openModal('record-time-modal');
}

function confirmRecordTime() {
    const hrInput = document.getElementById('input-record-hour');
    const minInput = document.getElementById('input-record-minute');
    
    const hr = hrInput ? hrInput.value : '12';
    const min = minInput ? minInput.value : '00';
    const formattedTime = `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    
    if (typeof recordState !== 'undefined') recordState.time = formattedTime;
    
    const timeBtn = document.getElementById('btn-select-time');
    if (timeBtn) timeBtn.innerText = formattedTime;
    
    closeModal('record-time-modal');
}

// 5. 進階設定頁籤切換
function switchAdvancedTab(tabType) {
    recordState.advType = tabType;
    document.querySelectorAll('#record-advanced-modal .detail-tab').forEach(t => t.classList.remove('active'));
    
    const paneSingle = document.getElementById('adv-pane-single');
    const paneCycle = document.getElementById('adv-pane-cycle');
    const paneInstall = document.getElementById('adv-pane-install');

    if (paneSingle) paneSingle.style.display = 'none';
    if (paneCycle) paneCycle.style.display = 'none';
    if (paneInstall) paneInstall.style.display = 'none';

    if (tabType === 'single') {
        const tab = document.getElementById('adv-tab-single');
        if (tab) tab.classList.add('active');
        if (paneSingle) paneSingle.style.display = 'block';
    } else if (tabType === 'cycle') {
        const tab = document.getElementById('adv-tab-cycle');
        if (tab) tab.classList.add('active');
        if (paneCycle) paneCycle.style.display = 'block';
    } else if (tabType === 'install') {
        const tab = document.getElementById('adv-tab-install');
        if (tab) tab.classList.add('active');
        if (paneInstall) paneInstall.style.display = 'block';
    }
}

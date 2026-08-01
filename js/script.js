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


// 確保全域變數存在
let currentActiveAccountIndex = null;

// 在檔案最上方宣告隱藏狀態變數
let isAmountHidden = false; 

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

    // 遍歷並渲染符合附圖結構的 HTML
    for (const [groupName, data] of Object.entries(groups)) {
        if (data.accounts.length === 0) continue;

        // 1. 生成分組標頭 (例如: － 現金 (1) )
        const groupHeaderHTML = `
            <div class="account-group-header" style="display:flex; justify-content:space-between; padding:15px 4px 10px 4px; color:#ffffff; font-size:14px; font-weight:700;">
                <span>－ ${groupName} (${data.accounts.length})</span>
                <span class="amount-val ${data.subtotal < 0 ? 'text-red' : ''}" data-value="${data.subtotal}" style="color: #ffffff; font-weight: 600;">
                    ${data.subtotal < 0 ? '-' : '+'}${Math.abs(data.subtotal).toLocaleString()}
                </span>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', groupHeaderHTML);

        // 2. 建立一個 form-group 作為該分組內所有帳戶的灰色大卡片外底框
        let accountsCardHTML = `<div class="form-group" style="background: #1c1c28; border-radius: 20px; padding: 0 16px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.03);">`;

        data.accounts.forEach((acc, idx) => {
            const amount = parseFloat(acc.amount) || 0;
            const isLastItems = (idx === data.accounts.length - 1);
            
            // 內部每一行帳戶條目 (去除重複包覆的 form-group，改用標準 form-row 橫列)
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

        accountsCardHTML += `</div>`; // 關閉大卡片外框
        listContainer.insertAdjacentHTML('beforeend', accountsCardHTML);
    }

    // 將真實金額寫入 Hero 區塊的 data-value
    if (document.getElementById('total-balance')) document.getElementById('total-balance').setAttribute('data-value', totalBalance);
    if (document.getElementById('total-assets')) document.getElementById('total-assets').setAttribute('data-value', totalAssets);
    if (document.getElementById('total-debts')) document.getElementById('total-debts').setAttribute('data-value', totalDebts);

    // 依據隱私狀態更新顯示
    updateAmountDisplay();

    if (typeof lucide !== 'undefined') lucide.createIcons();
}
/**
 * 切換眼睛隱藏狀態
 */
function toggleAmountVisibility() {
    isAmountHidden = !isAmountHidden;
    
    // 更新眼睛圖示
    const eyeIcon = document.getElementById('eye-toggle');
    if (eyeIcon) {
        eyeIcon.setAttribute('data-lucide', isAmountHidden ? 'eye-off' : 'eye');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    
    // 執行切換顯示
    updateAmountDisplay();
}

/**
 * 支出主分類、飲食/交通/娛樂/購物/個人/醫療/家居/家庭/生活/學習子分類網格切換核心
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

    // 先全面移除活躍狀態，避免多個網格同時擠在畫面造成跑版
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

    // 依據目的地，精準點亮單一網格
    if (target === 'eat') {
        eatGrid.classList.add('active');
    } else if (target === 'transport') {
        transportGrid.classList.add('active');
    } else if (target === 'entertainment') {
        entertainmentGrid.classList.add('active');
    } else if (target === 'shopping') {
        shoppingGrid.classList.add('active');
    } else if (target === 'personal') {
        personalGrid.classList.add('active');
    } else if (target === 'medical') {
        medicalGrid.classList.add('active');
    } else if (target === 'home') {
        homeGrid.classList.add('active');
    } else if (target === 'family') {
        familyGrid.classList.add('active');
    } else if (target === 'life') {
        lifeGrid.classList.add('active');
    } else if (target === 'learn') {
        learnGrid.classList.add('active');
    } else if (target === 'main-expense') {
        expenseGrid.classList.add('active');
    }

    // 重新繪製新視圖中的 Lucide 向量圖標
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
/**
 * 點擊分類圖標後，隱藏網格並展示單個圖標卡片畫面（包含完整支出圖標映射）
 */
function selectCategory(categoryName, parentType) {
    if (typeof recordState !== 'undefined') {
        recordState.category = categoryName;
    }
    
    // 安全清理字串，去除前後無意中留下的空白
    const cleanCategory = String(categoryName || '').trim();
    
    // 1. 全支出分類圖標映射字典 (Lucide Icon Mapping)
    const expenseIconMap = {
        // 主分類系列
        '飲食': 'utensils',
        '交通': 'car',
        '娛樂': 'party-popper',
        '購物': 'shopping-bag',
        '個人': 'user',
        '醫療': 'stethoscope',
        '家居': 'home',
        '家庭': 'users',
        '生活': 'coffee',
        '學習': 'book',

        // 飲食子分類
        '早餐': 'croissant',
        '午餐': 'utensils',
        '晚餐': 'soup',
        '點心': 'cookie',
        '飲料': 'cup-soda',
        '酒類': 'beer',
        '水果': 'grape',
        '宵夜': 'pizza',
        '礦泉水': 'glass-water',

        // 交通子分類
        '加油費': 'fuel',
        '停車費': 'square-parking',
        '火車': 'train-front',
        '公車': 'bus-front',
        '捷運': 'train-front-tunnel',
        '悠遊卡': 'credit-card',
        '汽車': 'car-front',
        '計程車': 'car-taxi-front',
        '摩托車': 'motorbike',
        '單車': 'bike',
        '機票': 'plane',
        '船票': 'ship',

        // 娛樂子分類
        '手遊': 'gamepad-2',
        '音樂': 'music',
        'Netflix': 'monitor-play',
        '電影': 'clapperboard',
        '遊樂園': 'roller-coaster',
        '展覽': 'landmark',
        '運動': 'dumbbell',

        // 購物子分類
        '蝦皮購物': 'shopping-bag',
        'momo購物': 'shopping-bag',
        '市場': 'shopping-cart',
        '衣物': 'shirt',
        '鞋子': 'sport-shoe',
        '配件': 'glasses',
        '包包': 'handbag',
        '美妝保養': 'mirror-round',
        '精品': 'gem',
        '禮物': 'gift',
        '電子產品': 'laptop',
        '應用軟體': 'app-window',
        'UNIQLO': 'shirt',
        'NET': 'shirt',

        // 個人子分類
        '社交': 'handshake',
        '電信費': 'phone',
        '借款': 'coins',
        '投資': 'trending-up',
        '稅金': 'circle-dollar-sign',
        '保險': 'shield-check',
        '捐款': 'hand-heart',
        '寵物': 'dog',
        '彩券': 'receipt',

        // 醫療子分類
        '門診': 'stethoscope',
        '藥品': 'pill',
        '醫療用品': 'briefcase-medical',
        '打針': 'syringe',
        '住院': 'bed-single',
        '手術': 'slice',
        '健康檢查': 'clipboard-plus',

        // 家居子分類
        '日常用品': 'soap-dispenser-droplet',
        '水費': 'droplets',
        '電費': 'zap',
        '燃料費': 'flame',
        '電話費': 'phone-call',
        '網路費': 'house-wifi',
        '房租': 'building',
        '洗衣費': 'washing-machine',
        '修繕費': 'wrench',
        '家具': 'sofa',
        '訂閱': 'newspaper',
        '家電': 'tv',
        '全聯': 'store',
        '屈臣氏': 'store',
        '康是美': 'store',

        // 家庭子分類
        '生活費': 'wallet-minimal',
        '教育': 'graduation-cap',
        '看護': 'person-standing',
        '玩具': 'toy-brick',
        '才藝': 'palette',

        // 生活子分類
        '美容美髮': 'scissors',
        '住宿': 'hotel',
        '旅行': 'tree-palm',
        '派對': 'wine',

        // 學習子分類
        '書籍': 'book-open-text',
        '課程': 'presentation',
        '教材': 'book-marked',
        '證書': 'book-user',
        '文具': 'pen-ruler',
        '考試': 'book-open-check',
        '金石堂': 'book-open',
        '博客來': 'book-open'
    };

    // 2. 收入分類圖標字典
    const incomeIconMap = {
        '薪水': 'dollar-sign',
        '獎金': 'coins',
        '投資': 'trending-up',
        '收款': 'hand-coins',
        '彩券': 'newspaper',
        '利息': 'landmark',
        '消費回饋': 'credit-card',
        '零用錢': 'circle-dollar-sign',
        '發票': 'receipt',
        '補助': 'building-2'
    };

    // 3. 轉帳 / 應收 / 應付圖標字典
    const otherIconMap = {
        '轉帳': 'arrow-left-right',
        '提款': 'credit-card',
        '存款': 'banknote',
        '還款': 'undo-2',
        '借出': 'hand-coins',
        '代付': 'handshake',
        '報帳': 'briefcase-business',
        '借入': 'hand-coins',
        '信貸': 'credit-card',
        '車貸': 'car',
        '房貸': 'house'
    };

  // 4. 無條件穿透匹配！不論有沒有傳 parentType，優先檢索所有字典
    let iconName = null;

    if (parentType === 'income') {
        iconName = incomeIconMap[cleanCategory];
    }

    // 若非收入或上一關沒找到，自動無縫搜尋全字典
    if (!iconName) {
        iconName = expenseIconMap[cleanCategory] || 
                   incomeIconMap[cleanCategory] || 
                   otherIconMap[cleanCategory];
    }

    // 防呆兜底：如果完全對不上，依類型給予標準通用圖標
    if (!iconName) {
        iconName = (parentType === 'income') ? 'dollar-sign' : 'tag';
    }
   
    // 5. 更新前端動態卡片節點
    const cardName = document.getElementById('selected-card-name');
    const cardIcon = document.getElementById('selected-card-icon');
    const cardAmountSub = document.getElementById('selected-card-amount-sub');
    const cardIconWrapper = document.getElementById('selected-card-icon-wrapper');

    if (cardName) cardName.innerText = categoryName;
    if (cardIcon) {
        cardIcon.setAttribute('data-lucide', iconName);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // 6. 連動卡片漸層色外框
    if (cardAmountSub) {
        if (parentType === 'income') {
            cardAmountSub.innerText = '+$0';
            cardAmountSub.className = 'text-green';
            if (cardIconWrapper) cardIconWrapper.className = 'cate-icon-wrapper i-income-gold';
        } else {
            cardAmountSub.innerText = '$0';
            cardAmountSub.className = 'text-red';

            // 依家族判斷，動態套用專屬漸層 CSS 類別
            const isTransport = ['加油費','停車費','火車','公車','捷運','悠遊卡','汽車','計程車','摩托車','單車','機票','船票'].includes(categoryName);
            const isEntertainment = ['手遊','彩券/刮刮樂','音樂','Spotify','Netflix','電影','遊樂園','展覽','運動'].includes(categoryName);
            const isShopping = ['蝦皮購物','momo購物','市場','衣物','鞋子','配件','包包','美妝保養','精品','禮物','電子產品','應用軟體','UNIQLO','NET'].includes(categoryName);
            const isPersonal = ['社交','電信費','借款','投資','稅金','保險','捐款','寵物','彩券'].includes(categoryName);
            const isMedical = ['門診','藥品','醫療用品','打針','住院','手術','健康檢查'].includes(categoryName);
            const isHome = ['日常用品','水費','電費','燃料費','電話費','網路費','房租','洗衣費','修繕費','家具','訂閱','家電','全聯','屈臣氏','康是美'].includes(categoryName);
            const isFamily = ['生活費','教育','看護','玩具','才藝'].includes(categoryName);
            const isLife = ['美容美髮','住宿','旅行','派對'].includes(categoryName);
            const isLearn = ['書籍','課程','教材','證書','探索','文具','考試','金石堂','博客來'].includes(categoryName);

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

    // 7. 清空隱藏所有分類網格視圖
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

    // 8. 展開單個卡片與計算機
    const cardZone = document.getElementById('selected-category-card-zone');
    if (cardZone) cardZone.classList.add('show-card');

    toggleCalculator(true);
}
/**
 * 優化計算機即時同步，支援收入的正號 (+) 顯示
 */
const originalPressCalc = pressCalc; 
pressCalc = function(val) {
    originalPressCalc(val); 
    
    const display = document.getElementById('record-amount-display');
    const currentAmt = display ? display.innerText : '0';
    const cardAmountSub = document.getElementById('selected-card-amount-sub');
    
    if (cardAmountSub) {
        // 自動檢查全域記帳狀態，如果是收入就加上正號
        const isIncome = (recordState.type === '收入');
        cardAmountSub.innerText = `${isIncome ? '+' : ''}$${currentAmt}`;
    }
};

/**
 * 點擊卡片旁「+」按鈕：重置狀態，回溯顯示原本的分類網格
 */
function resetCategorySelection() {
    const cardZone = document.getElementById('selected-category-card-zone');
    if (cardZone) cardZone.classList.remove('show-card');

    // 還原為標準 CSS 屬性選擇器以抓取 .active 的 span
    const currentType = recordState.type || '支出';
    const activeTab = document.querySelector('#record-type-tabs span.active');
    
    setRecordType(currentType, activeTab);
    toggleCalculator(false);
}

/**
 * 打包當前數據、同步扣減帳戶餘額並存入 LocalStorage
 */
function saveRecord() {
    // 1. 抓取當前畫面上的計算機金額
    const amountDisplay = document.getElementById('record-amount-display');
    const amount = amountDisplay ? parseFloat(amountDisplay.innerText.replace(/,/g, '')) : 0;

    if (amount <= 0) {
        alert('請輸入大於 0 的金額！');
        return;
    }

    // 2. 抓取備註說明
    const noteInput = document.getElementById('record-note');
    const note = noteInput ? noteInput.value.trim() : '';

    // 3. 讀取目前全域選擇的帳戶 (預設為 '錢包')
    const currentAccountName = recordState.account || '錢包';
    const currentRecordType = recordState.type || '支出';
    const currentCategory = recordState.category || '未分類';

    // 4. 連動修改對應帳戶的餘額
    let localAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    
    // 尋找目前選取用來扣款/收款的帳戶
    let targetAccount = localAccounts.find(acc => acc.name === currentAccountName);
    
    if (targetAccount) {
        // 根據交易類型決定金額增減
        if (currentRecordType === '支出' || currentRecordType === '應付款項') {
            // 支出或要付別人的錢：帳戶餘額減少
            targetAccount.amount = (parseFloat(targetAccount.amount) || 0) - amount;
        } else if (currentRecordType === '收入' || currentRecordType === '應收款項') {
            // 收入或收回別人的錢：帳戶餘額增加
            targetAccount.amount = (parseFloat(targetAccount.amount) || 0) + amount;
        }
        // 轉帳類型，可依據未來開發的「轉入帳戶」擴充
        
        // 將修改完餘額的帳戶列表回存至硬碟
        localStorage.setItem('koin_accounts', JSON.stringify(localAccounts));
    }

    // 5. 整合所有數據，打包成一筆標準記帳物件
    const newRecord = {
        id: Date.now(),                                      
        type: currentRecordType,                             // 支出 / 收入 / 轉帳 等
        category: currentCategory,                           // 飲食 / 早餐 / 午餐 等
        account: currentAccountName,                         // 扣款帳戶名稱
        amount: amount,                                      // 記帳金額
        date: recordState.date || new Date().toLocaleDateString(), // 記帳日期
        time: recordState.time || '12:00',                   // 記帳時間
        note: note                                           // 備註事項
    };

    // 6. 將紀錄存入 LocalStorage
    let localRecords = JSON.parse(localStorage.getItem('koin_records')) || [];
    localRecords.push(newRecord);
    localStorage.setItem('koin_records', JSON.stringify(localRecords));

    // 7. 儲存成功後，清空輸入緩衝，並流暢跳回日曆主頁面
    if (noteInput) noteInput.value = '';
    if (amountDisplay) amountDisplay.innerText = '0';
    
    // 重置計算機引擎狀態
    recordState.currentInput = '0';
    recordState.prevInput = '0';
    recordState.operator = null;
    const indicator = document.getElementById('calc-operator-indicator');
    if (indicator) indicator.innerText = '';
    
    // 重置主分類網格視圖（如果是從飲食子網格儲存的，自動幫你切換回主選單，防呆用）
    if (typeof changeSubGrid === 'function') {
        changeSubGrid('main-expense'); 
    }

    // 跳回行事曆主頁
    showPage('page-calendar'); 

    // 觸發全域金額重繪，讓首頁的錢包餘額、總資產、總餘額立刻跳動更新！
    renderAccountOverview();

    // 放在 saveRecord() 函式的最後面，儲存成功後把孤立狀態解開、清除加號
    resetCategorySelection();

    // 加在 saveRecord() 函式的最底部
const cardZone = document.getElementById('selected-category-card-zone');
if (cardZone) cardZone.classList.remove('show-card');

    // 加在 saveRecord() 儲存成功後立刻刷新日曆下方的明細
    renderDailyDetailsList();
}

/**
 * 統一更新畫面上所有帶有 amount-val 類別的金額顯示
 */
function updateAmountDisplay() {
    const amountElements = document.querySelectorAll('.amount-val');
    
    amountElements.forEach(el => {
        const rawValue = parseFloat(el.getAttribute('data-value')) || 0;
        
        if (isAmountHidden) {
            // 如果是隱藏狀態，全部變成點點
            el.innerText = '••••••';
        } else {
            // 如果是顯示狀態，還原為格式化後的數字
            if (el.id === 'total-balance' || el.id === 'total-assets' || el.id === 'total-debts') {
                el.innerText = Math.abs(rawValue).toLocaleString();
            } else {
                // 列表小計與帳戶金額保留正負號與顏色
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

    // 1. 更新頂部 Header 與 餘額
    document.getElementById('detail-acc-name').innerText = acc.name;
    const displayAmount = acc.isCredit ? `-${Math.abs(acc.amount).toLocaleString()}` : acc.amount.toLocaleString();
    const amountEl = document.getElementById('detail-acc-amount');
    amountEl.innerText = displayAmount;
    amountEl.className = acc.isCredit ? 'amount text-red' : 'amount text-green';

    // 2. 更新「帳戶資訊」分頁的內容
    if (document.getElementById('info-name')) document.getElementById('info-name').innerText = acc.name;
    if (document.getElementById('info-group')) document.getElementById('info-group').innerText = acc.group;
    if (document.getElementById('info-initial')) document.getElementById('info-initial').innerText = (acc.initialAmount || 0).toLocaleString();
    if (document.getElementById('info-is-credit')) document.getElementById('info-is-credit').checked = acc.isCredit;
    
    // 3. 預設顯示第一個分頁 (交易明細)
    switchDetailTab(0);
    
    // 4. 切換頁面
    showPage('page-account-detail');
}

// 切換分頁內容的函式
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
        transContent.style.display = 'block'; // 或者是 block 以符合 Flex 佈局
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
    
    // 清空表單
    document.getElementById('acc-name').value = '';
    document.getElementById('acc-amount').value = '0';
    showPage('page-overview');
}

function selectGroup(name) {
    const display = document.getElementById('selected-group-text');
    if (display) {
        display.innerHTML = `${name} <i data-lucide="chevron-right" class="s-icon"></i>`;
        // 同步更新隱藏欄位或狀態，確保 saveAccount 時能抓到正確的 group 名稱
    }
    closeModal('group-picker-modal');
}

// 帳戶細節頁分頁切換監聽
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('detail-tab')) {
        document.querySelectorAll('.detail-tab').forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        console.log("切換至：", e.target.innerText);
    }
});

// 全域狀態暫存
let recordState = {
    type: '支出',
    currentInput: '0',    // 計算機當前輸入緩衝
    prevInput: '0',       // 運算暫存值
    operator: null,       // 當前運算子 (+,-,*,/)
    isCalculated: false,  // 是否剛執行完等號
    account: '錢包',
    project: '生活開銷',
    date: '2026/06/20',
    time: '13:57',
    advType: 'single'     // single, cycle, install
};

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
        // 輸入數字與熱門數字快捷鍵
        if (recordState.currentInput === '0' || recordState.isCalculated) {
            recordState.currentInput = val;
            recordState.isCalculated = false;
        } else {
            recordState.currentInput += val;
        }
    }
    display.innerText = parseFloat(recordState.currentInput).toLocaleString();
}

/**
 * 2. 動態搜尋過濾帳戶 (Dynamic Search Filters)
 */
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

/**
 * 3. 動態搜尋過濾專案
 */
function openRecordProjectPicker() {
    filterRecordProjects('');
    openModal('record-project-modal');
}

function filterRecordProjects(keyword) {
    const container = document.getElementById('record-project-options');
    if (!container) return;
    container.innerHTML = '';

    const projects = JSON.parse(localStorage.getItem('koin_projects')) || [];
    
    // 永遠保留「無專案」選項
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

/**
 * 4. 進階多頁籤切換狀態機 (Advanced Options Tabs)
 */
function switchAdvancedTab(tabType) {
    recordState.advType = tabType;
    document.querySelectorAll('#record-advanced-modal .detail-tab').forEach(t => t.classList.remove('active'));
    
    document.getElementById(`adv-pane-single`).style.display = 'none';
    document.getElementById(`adv-pane-cycle`).style.display = 'none';
    document.getElementById(`adv-pane-install`).style.display = 'none';

    if (tabType === 'single') {
        document.getElementById('adv-tab-single').classList.add('active');
        document.getElementById('adv-pane-single').style.style.display = 'block';
    } else if (tabType === 'cycle') {
        document.getElementById('adv-tab-cycle').classList.add('active');
        document.getElementById('adv-pane-cycle').style.display = 'block';
    } else if (tabType === 'install') {
        document.getElementById('adv-tab-install').classList.add('active');
        document.getElementById('adv-pane-install').style.display = 'block';
    }
}

// ==========================================
// 獨立模組：新增記錄專用動態日曆視窗
// ==========================================

// 宣告日曆當前展示的年月變數
let calendarDisplayDate = new Date();

/**
 * 1. 點擊「今天」按鈕時觸發：打開並初始化日曆
 */
function openRecordCalendar() {
    calendarDisplayDate = new Date(); // 每次打開預設回到系統當前月份
    renderDynamicRecordCalendar();
    openModal('record-calendar-modal');
}

/**
 * 2. 切換上個月/下個月
 */
function changeRecordMonth(direction) {
    calendarDisplayDate.setMonth(calendarDisplayDate.getMonth() + direction);
    renderDynamicRecordCalendar();
}

/**
 * 3. 動態核心演算法：渲染月曆格子
 */
function renderDynamicRecordCalendar() {
    const year = calendarDisplayDate.getFullYear();
    const month = calendarDisplayDate.getMonth(); // 0 ~ 11

    // 更新網頁彈窗上的年月標題
    const titleTitle = document.getElementById('calendar-month-year-title');
    if (titleTitle) {
        titleTitle.innerText = `${year} 年 ${String(month + 1).padStart(2, '0')} 月`;
    }

    const gridContainer = document.getElementById('record-calendar-grid');
    if (!gridContainer) return;
    gridContainer.innerHTML = ''; // 清空舊格子

    // 取得這個月的第一天是星期幾 (0 = 週日, 1 = 週一...)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // 取得這個月總共有幾天
    const totalDays = new Date(year, month + 1, 0).getDate();

    // A. 渲染開頭的空白格子 (填補第一天之前的星期空隙)
    for (let i = 0; i < firstDayIndex; i++) {
        gridContainer.insertAdjacentHTML('beforeend', `<div style="padding: 8px;"></div>`);
    }

    // B. 動態渲染 1 號到最後一天的實體格子
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        // 檢查這一格是不是「今天」，是的話加上高亮外圈
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

/**
 * 4. 點擊日曆格子：反填資料並關閉彈窗
 */
function selectRecordCalendarDate(fullDate, displayDate) {
    recordState.date = fullDate; // 存入全域記帳狀態
    
    // 更新新增記錄畫面的按鈕文字
    const dateBtn = document.getElementById('btn-select-date');
    if (dateBtn) {
        dateBtn.innerText = displayDate; 
    }
    
    closeModal('record-calendar-modal');
}

// ==========================================
// 記錄頁：自訂時間選取彈窗
// ==========================================

// 1. 打開時間選擇器，並自動帶入當前時間
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

// 2. 按下確定，將時間反填回「現在」按鈕上
function confirmRecordTime() {
    const hr = document.getElementById('input-record-hour').value;
    const min = document.getElementById('input-record-minute').value;
    
    // 格式化為 HH:MM (例如 09:05)
    const formattedTime = `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    
    // 存入全域變數
    if (typeof recordState !== 'undefined') {
        recordState.time = formattedTime;
    }
    
    // 更新按鈕文字
    const timeBtn = document.getElementById('btn-select-time');
    if (timeBtn) {
        timeBtn.innerText = formattedTime;
    }
    
    closeModal('record-time-modal');
}

// 快速商家選取
function quickSelectBrand(name, defaultProj) {
    document.getElementById('record-name').value = name;
    selectRecordProject(defaultProj);
}

/**
 * 切換記帳類型（支出/收入/轉帳/應收款項/應付款項）並連動切換對應的圖標網格
 */
function setRecordType(type, el) {
    if (typeof recordState !== 'undefined') {
        recordState.type = type;
    }
    
    // 1. 切換頂部頁籤的高亮狀態
    document.querySelectorAll('#record-type-tabs span').forEach(s => s.classList.remove('active', 'text-blue'));
    if (el) el.classList.add('active', 'text-blue');

    // 2. 隱藏「所有」5 組分類網格 (支出、收入、轉帳、應收、應付)
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

    // 3. 根據目前點擊的類型，決定開啟哪一組網格
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

    // 4. 重新渲染新跑出來的 Lucide 向量圖標
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
 
/**
 * 處理 FAB 點擊
 */
function handleFabClick(element) {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    const currentPage = activePage.id;
    
    if (currentPage !== 'page-calendar') {
        showPage('page-calendar', element);
        
        if (typeof selectedDate !== 'undefined') {
            selectedDate = new Date(); 
        }

        // 強制執行滾動與標題更新
        if (typeof focusOnCurrentMonth === 'function') {
            // 使用 setTimeout 確保 showPage 的 CSS 過渡完成後再滾動，增加成功率
            setTimeout(() => {
                focusOnCurrentMonth();
                updateCalendarHeaderToToday();
            }, 50); 
        }
    } else {
        showPage('page-add-record', element);
    }
}

/**
 * 自動定位並高亮當天日期
 */
function highlightToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 月份從 0 開始
    const date = now.getDate();

    // 1. 更新日曆標題
    const titleEl = document.querySelector('.calendar-header h2') || document.getElementById('calendar-title');
    if (titleEl) {
        titleEl.innerText = `${year}/${month.toString().padStart(2, '0')}`;
    }

    // 2. 如果有動態生成日曆格子的話，可以在這裡加入選取當天格子的邏輯
    console.log(`今天日期是：${year}/${month}/${date}`);
    
    // 這裡可以呼叫原本渲染日曆的函式，例如：
    // renderCalendar(year, month); 
}

/**
 * 將日曆標題更新為系統當前年月
 */
function updateCalendarHeaderToToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    
    const headerTitle = document.getElementById('full-calendar-month');
    if (headerTitle) {
        headerTitle.innerText = `${year}/${month}`;
    }
}

// === 專案欄位動態選擇器功能 ===

function selectProjCurrency(currency) {
    const el = document.getElementById('selected-proj-currency');
    if (el) el.innerHTML = `${currency} <i data-lucide="chevron-right" class="s-icon"></i>`;
    closeModal('proj-currency-modal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function selectProjType(type) {
    const el = document.getElementById('selected-proj-type');
    if (el) el.innerHTML = `${type} <i data-lucide="chevron-right" class="s-icon"></i>`;
    closeModal('proj-type-modal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function selectProjPeriod(period) {
    const el = document.getElementById('selected-proj-period');
    if (el) el.innerHTML = `${period} <i data-lucide="chevron-right" class="s-icon"></i>`;
    closeModal('proj-period-modal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 動態開啟並生成 1~31 日的起始日期選擇器
function openProjDatePicker() {
    const container = document.getElementById('proj-date-options');
    if (container) {
        container.innerHTML = '';
        // 生成第 1 天到第 30 天，以及月底
        for (let i = 1; i <= 30; i++) {
            container.insertAdjacentHTML('beforeend', `
                <div class="option-item" onclick="selectProjDate('第 ${i} 天')">第 ${i} 天</div>
            `);
        }
        container.insertAdjacentHTML('beforeend', `<div class="option-item" onclick="selectProjDate('月底')">月底</div>`);
    }
    openModal('proj-date-modal');
}

function selectProjDate(dateText) {
    const el = document.getElementById('selected-proj-date');
    if (el) el.innerHTML = `${dateText} <i data-lucide="chevron-right" class="s-icon"></i>`;
    closeModal('proj-date-modal');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// === 完整專案資料儲存結構 ===
function saveProject() {
    const name = document.getElementById('proj-name').value.trim();
    const note = document.getElementById('proj-note').value.trim();
    
    if (!name) return alert("請輸入專案名稱");

    // 擷取動態選擇器的純文字
    const currency = document.getElementById('selected-proj-currency').textContent.trim();
    const type = document.getElementById('selected-proj-type').textContent.trim();
    const period = document.getElementById('selected-proj-period').textContent.trim();
    const startDate = document.getElementById('selected-proj-date').textContent.trim();
    
    // 擷取開關狀態
    const autoBudget = document.getElementById('proj-auto-budget').checked;
    const showHome = document.getElementById('proj-show-home').checked;

    const newProject = {
        id: Date.now(),
        name: name,
        currency: currency,
        type: type,
        period: period,
        startDate: startDate,
        autoBudget: autoBudget,
        showHome: showHome,
        note: note,
        icon: "piggy-bank", // 預設專案圖示
        amount: 0           // 初始預算或累計金額
    };

    const projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
    projects.push(newProject);
    localStorage.setItem('koin_projects', JSON.stringify(projects));

    // 如果有渲染專案總覽的函式，在此觸發重繪
    if (typeof renderProjectsPage === 'function') renderProjectsPage();
    
    // 清空表單欄位與重設預設值
    document.getElementById('proj-name').value = '';
    document.getElementById('proj-note').value = '';
    document.getElementById('selected-proj-currency').innerHTML = `TWD <i data-lucide="chevron-right" class="s-icon"></i>`;
    document.getElementById('selected-proj-type').innerHTML = `重複循環 <i data-lucide="chevron-right" class="s-icon"></i>`;
    document.getElementById('selected-proj-period').innerHTML = `每月 <i data-lucide="chevron-right" class="s-icon"></i>`;
    document.getElementById('selected-proj-date').innerHTML = `第 1 天 <i data-lucide="chevron-right" class="s-icon"></i>`;
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 返回專案總覽頁
    showPage('page-projects');
}

// --- 彈窗與週期邏輯 ---
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        // 重新渲染 Lucide 圖示以確保選單內的圖示出現
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleMenuAction(action) {
    console.log("執行：" + action);
    // 在此加入各項功能邏輯
    closeModal('more-options-modal');
}

function deleteAccountAction() {
    if (confirm("確定要刪除此帳戶嗎？所有交易紀錄將被移除。")) {
        let accounts = JSON.parse(localStorage.getItem('koin_accounts') || '[]');
        
        // 關鍵：將 currentAccountIndex 改為 currentActiveAccountIndex
        if (typeof currentActiveAccountIndex !== 'undefined' && currentActiveAccountIndex !== null) {
            accounts.splice(currentActiveAccountIndex, 1);
            
            localStorage.setItem('koin_accounts', JSON.stringify(accounts));
            closeModal('more-options-modal');
            
            // 關鍵：呼叫 renderAccountOverview 而不是 renderAccountList
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
    lucide.createIcons();
    closeModal('cycle-picker-modal');
}

// --- 帳戶分組選取 ---
function openGroupPicker() { openModal('group-picker-modal'); }
function selectGroup(name) {
    const display = document.getElementById('selected-group-text');
    if (display) {
        display.innerHTML = `${name} <i data-lucide="chevron-right" class="s-icon"></i>`;
        lucide.createIcons();
    }
    closeModal('group-picker-modal');
}

// --- 信用帳戶開關 ---
function toggleCreditFields() {
    const isCredit = document.getElementById('in-is-credit').checked;
    document.getElementById('credit-extra-fields').style.display = isCredit ? 'block' : 'none';
    const displayAmount = document.getElementById('add-display-amount');
    if (displayAmount) displayAmount.className = isCredit ? 'val text-red' : 'val text-green';
}

// --- 繳款期限邏輯 ---
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
    lucide.createIcons();
    closeModal('due-date-modal');
}

// ==========================================
// 更多功能 (Settings Page) 路由動作控制
// ==========================================

/**
 * 處理設定清單的點擊動作
 */
function handleSettingsAction(action) {
    console.log(`[系統] 觸發設定功能: ${action}`);
    
    if (action === 'Google 登入') {
        //未來實作雲端同步，可以串接 Google Identity Services 或 Firebase Auth
        alert('正在啟動 Google OAuth 安全登入驗證...');
    } else if (action === '匯出 CSV') {
        alert('歷史帳目資料已成功匯出至下載資料夾！');
    } else if (action === '重新計算餘額') {
        if (typeof renderAccountOverview === 'function') {
            renderAccountOverview();
            alert('全域餘額核心演算法重新計算重繪完畢！');
        }
    } else if (action === '清除所有快取') {
        if (confirm('警告：這將會永久刪除本機所有的帳戶與記帳紀錄，確定要重置嗎？')) {
            localStorage.clear();
            alert('資料已完全重置。系統將重新載入。');
            window.location.reload();
        }
    }
}


/**
 * 連動控制全局金額隱私開關
 */
function handleSettingsToggleHide(isChecked) {
    // 同步更新之前做好的隱私全域變數 isAmountHidden
    if (typeof isAmountHidden !== 'undefined') {
        isAmountHidden = isChecked;
        
        // 同步更新總覽頁的眼睛圖示
        const eyeIcon = document.getElementById('eye-toggle');
        if (eyeIcon) {
            eyeIcon.setAttribute('data-lucide', isAmountHidden ? 'eye-off' : 'eye');
        }
        
        // 執行全局視圖重繪
        if (typeof updateAmountDisplay === 'function') {
            updateAmountDisplay();
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

/**
 * 根據 LocalStorage 內的紀錄，動態渲染日曆頁面下方的每日交易明細
 */
function renderDailyDetailsList() {
    const detailContainer = document.getElementById('daily-details-list');
    if (!detailContainer) return;

    // 1. 取出 LocalStorage 中的流水帳紀錄
    const localRecords = JSON.parse(localStorage.getItem('koin_records')) || [];

    // 2. 取得當前日曆所選取的日期（對齊 recordState 目前暫存的日期）
    // 如果 recordState 沒有日期，預設使用系統今天的日期格式
    const currentSelectedDate = recordState.date || new Date().toLocaleDateString();

    // 3. 過濾出「日期符合當天」的記帳紀錄
    const todayRecords = localRecords.filter(rec => {
        // 相容相等的日期字串比對 (例如 "2026/07/18")
        return rec.date === currentSelectedDate;
    });

    // 4. 如果當天沒有任何紀錄，顯示預設提示
    if (todayRecords.length === 0) {
        detailContainer.innerHTML = `<p style="color: #8a8a8e; text-align: center; margin-top: 30px; font-size: 14px;">當天尚無交易明細</p>`;
        return;
    }

    // 5. 開始動態建構標準 iOS 質感的交易條目卡片結構
    detailContainer.innerHTML = ''; // 清空舊畫面

    todayRecords.forEach(rec => {
        // 對照分類並給予正確的 Lucide 圖標名稱與獨立配色 Class
        let iconName = 'utensils';
        let bgClass = 'i-eat'; // 預設黃色漸層

        if (rec.category === '早餐') { iconName = 'croissant'; bgClass = 'i-income-gold'; }
        else if (rec.category === '午餐') { iconName = 'utensils'; bgClass = 'i-income-gold'; }
        else if (rec.category === '晚餐') { iconName = 'soup'; bgClass = 'i-income-gold'; }
        else if (rec.category === '點心') { iconName = 'cookie'; bgClass = 'i-income-gold'; }
        else if (rec.category === '飲料') { iconName = 'cup-soda'; bgClass = 'i-income-gold'; }
        else if (rec.category === '酒類') { iconName = 'beer'; bgClass = 'i-income-gold'; }
        else if (rec.category === '水果') { iconName = 'grape'; bgClass = 'i-income-gold'; }
        else if (rec.category === '宵夜') { iconName = 'pizza'; bgClass = 'i-income-gold'; }
        else if (rec.category === '礦泉水') { iconName = 'glass-water'; bgClass = 'i-income-gold'; }
        else if (rec.category === '交通') { iconName = 'car'; bgClass = 'i-transport'; }
        else if (rec.category === '娛樂') { iconName = 'party-popper'; bgClass = 'i-entertainment'; }
        else if (rec.category === '購物') { iconName = 'shopping-bag'; bgClass = 'i-shopping'; }

        // 依據交易型態（支出/收入）決定右側金額顏色數字字串
        const isExpense = (rec.type === '支出' || rec.type === '應付款項');
        const amountColorClass = isExpense ? 'text-red' : 'text-green';
        const formattedAmount = `${isExpense ? '' : '+'}${rec.amount.toLocaleString()}`;

        // 建立標準卡片 HTML 結構
        const itemHTML = `
            <div class="form-group" style="padding: 0; margin-bottom: 12px;">
                <div class="form-row" style="background: #1c1c28; padding: 14px 16px; border-radius: 16px; border-bottom: none;">
                    <!-- 左側：圖標與名稱說明區 -->
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div class="cate-icon-wrapper ${bgClass}" style="width: 44px; height: 44px; margin-bottom: 0;">
                            <i data-lucide="${iconName}"></i>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-size: 15px; font-weight: 600; color: #ffffff; text-align: left;">${rec.category}</span>
                            <!-- 下方小標籤群組 (專案、帳戶、時間) -->
                            <div style="display: flex; gap: 6px;">
                                <span style="background: rgba(255,255,255,0.05); color: #8e8e93; font-size: 10px; padding: 2px 8px; border-radius: 6px;">${rec.project || '生活開銷'}</span>
                                <span style="background: rgba(93,93,255,0.1); color: #8e8e93; font-size: 10px; padding: 2px 8px; border-radius: 6px;">${rec.account || '錢包'}</span>
                            </div>
                        </div>
                    </div>
                    <!-- 右側：交易實體金額 -->
                    <span class="${amountColorClass}" style="font-size: 17px; font-weight: 700;">
                        $${formattedAmount}
                    </span>
                </div>
            </div>
        `;
        detailContainer.insertAdjacentHTML('beforeend', itemHTML);
    });

    // 重新繪製跑出來的 Lucide 圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

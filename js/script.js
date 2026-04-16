/**
 * Koin 核心邏輯整合 - script.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 2. 初始頁面渲染
    renderAccountOverview(); // 統一使用這個
    if (typeof renderProjectsPage === 'function') renderProjectsPage();
    
    // 3. 預設首頁狀態
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

/**
 * 渲染帳戶總覽列表與總額計算
 */
function renderAccountOverview() {
    const listContainer = document.getElementById('account-list');
    if (!listContainer) return;

    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    listContainer.innerHTML = '';

    let totalBalance = 0;
    let totalAssets = 0;
    let totalDebts = 0;

    savedAccounts.forEach((acc, index) => {
        // 邏輯：信用帳戶算負債，一般帳戶算資產
        const amount = parseFloat(acc.amount) || 0;
        
        if (acc.isCredit) {
            totalDebts += Math.abs(amount);
            totalBalance -= Math.abs(amount);
        } else {
            totalAssets += amount;
            totalBalance += amount;
        }

        const accountHTML = `
            <div class="form-group" style="margin-bottom: 12px; cursor: pointer;" onclick="openAccountDetail(${index})">
                <div class="form-row">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="background:#3d3d4d; padding:8px; border-radius:10px; display:flex;">
                            <i data-lucide="${acc.isCredit ? 'credit-card' : 'wallet'}" style="width:20px; height:20px;"></i>
                        </div>
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-size:15px; font-weight:500;">${acc.name}</span>
                            <span style="font-size:11px; color:#8a8a8e;">${acc.group}</span>
                        </div>
                    </div>
                    <span class="${acc.isCredit ? 'text-red' : 'text-green'}" style="font-weight:600;">
                        ${acc.isCredit ? '-' : ''}${amount.toLocaleString()}
                    </span>
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', accountHTML);
    });

    // 更新頂部卡片數字
    const elTotal = document.getElementById('total-balance');
    const elAssets = document.getElementById('total-assets');
    const elDebts = document.getElementById('total-debts');

    if (elTotal) elTotal.innerText = totalBalance.toLocaleString();
    if (elAssets) elAssets.innerText = totalAssets.toLocaleString();
    if (elDebts) elDebts.innerText = totalDebts.toLocaleString();

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 開啟帳戶明細
 */
function openAccountDetail(index) {
    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    const acc = savedAccounts[index];
    if (!acc) return;

    document.getElementById('detail-acc-name').innerText = acc.name;
    const displayAmount = acc.isCredit ? `-${acc.amount.toLocaleString()}` : acc.amount.toLocaleString();
    document.getElementById('detail-acc-amount').innerText = displayAmount;

    showPage('page-account-detail');
}

/**
 * 儲存新帳戶
 */
function saveAccount() {
    const name = document.getElementById('acc-name').value;
    const amountInput = document.getElementById('acc-amount').value;
    const group = document.getElementById('selected-group-text').innerText;
    const isCredit = document.getElementById('in-is-credit').checked;

    if (!name) { alert('請輸入帳戶名稱'); return; }

    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    const newAccount = { 
        name, 
        amount: parseFloat(amountInput) || 0, 
        group: group.trim(), 
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


// 處理帳戶細節頁的分頁切換
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('detail-tab')) {
        // 1. 移除所有標籤的 active
        document.querySelectorAll('.detail-tab').forEach(tab => tab.classList.remove('active'));
        // 2. 幫點擊的標籤加上 active
        e.target.classList.add('active');
        
        // 3. 這裡未來可以加入切換「內容區塊」的邏輯
        const tabText = e.target.innerText;
        console.log("切換至：", tabText);
    }
});


/**
 * 處理 FAB 點擊：切換日曆或新增記錄
 */
function handleFabClick(element) {
    const currentPage = document.querySelector('.page.active').id;
    if (currentPage !== 'page-calendar') {
        showPage('page-calendar', element);
    } else {
        showPage('page-add-record', element);
    }
}

/**
 * 簡易更新頂部數字
 */
function updateTotalStats(newAmount) {
    const totalEl = document.getElementById('total-balance');
    const assetEl = document.getElementById('total-assets');
    const debtEl = document.getElementById('total-debts');

    let currentTotal = parseFloat(totalEl.innerText.replace(/,/g, '')) || 0;
    let currentAsset = parseFloat(assetEl.innerText.replace(/,/g, '')) || 0;
    let currentDebt = parseFloat(debtEl.innerText.replace(/,/g, '')) || 0;

    totalEl.innerText = (currentTotal + newAmount).toLocaleString();
    
    if (newAmount >= 0) {
        assetEl.innerText = (currentAsset + newAmount).toLocaleString();
    } else {
        debtEl.innerText = (currentDebt + Math.abs(newAmount)).toLocaleString();
    }
}

// 2. 動態渲染總覽列表
function renderAccountList() {
    const accounts = JSON.parse(localStorage.getItem('koin_accounts') || '[]');
    const listContainer = document.querySelector('.account-list');
    const totalBalanceEl = document.getElementById('total-balance');
    
    let total = 0;
    let asset = 0;
    let debt = 0;

    // 清空現有列表
    listContainer.innerHTML = '';

    accounts.forEach(acc => {
        // 計算總額
        if (acc.isCredit) {
            debt += acc.amount;
            total -= acc.amount;
        } else {
            asset += acc.amount;
            total += acc.amount;
        }

        // 建立 HTML 元素
        const item = document.createElement('div');
        item.className = 'group-item';
        item.innerHTML = `
            <span class="group-name">${acc.isCredit ? '💳' : '💰'} ${acc.name} (${acc.group})</span>
            <span class="group-value ${acc.isCredit ? 'text-red' : 'text-green'}">
                ${acc.isCredit ? '-' : ''}$${acc.amount.toLocaleString()}
            </span>
        `;
        listContainer.appendChild(item);
    });

    // 更新頂部總額數字
    if (totalBalanceEl) totalBalanceEl.innerText = total.toLocaleString();
    
    // 更新總資產/總負債文字 (如果有對應 ID)
    const stats = document.querySelectorAll('.sub-stats span span');
    if (stats.length >= 2) {
        stats[0].innerText = asset.toLocaleString(); // 總資產
        stats[1].innerText = debt.toLocaleString();  // 總負債
    }
}

// 3. 頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
    renderAccountList();
});

function saveProject() {
    const name = document.getElementById('proj-name').value;
    const note = document.getElementById('proj-note').value;
    const isStats = document.querySelector('#page-add-project .switch input[type="checkbox"]:nth-of-type(3)')?.checked || false;

    if (!name) return alert("請輸入專案名稱");

    const newProject = {
        name: name,
        icon: "piggy-bank", // 預設圖示
        date: "2026/04/01 － 2026/04/30",
        amount: 0,
        isStats: isStats, // 根據開關決定是否顯示「統計專案」標籤
        note: note
    };

    const projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
    projects.push(newProject);
    localStorage.setItem('koin_projects', JSON.stringify(projects));

    // 關鍵：重新渲染列表
    renderProjectsPage();
    
    // 清空並跳轉回列表頁
    document.getElementById('proj-name').value = '';
    document.getElementById('proj-note').value = '';
    showPage('page-projects');
}
   
   // 帳戶分組選取
   function selectGroup(name) {
    const display = document.getElementById('selected-group-text');
    if (display) {
        display.innerHTML = `${name} <i data-lucide="chevron-right" class="s-icon"></i>`;
        lucide.createIcons();
    }
    closeModal('group-picker-modal');
}

// --- 基礎彈窗控制 ---
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// --- 帳單週期邏輯 ---
function openCyclePicker() { openModal('cycle-picker-modal'); }

function updateCycleText(val) {
    const rangeDisplay = document.getElementById('modal-date-range');
    const noteDisplay = document.getElementById('modal-cycle-note');
    const year = 2026, month = 4; // 可改為動態抓取
    
    let start, end, text;
    if (val == 31) {
        start = `${year}/04/01`; end = `${year}/04/30`; text = "每月月底";
    } else {
        const day = parseInt(val);
        // 模仿影片：顯示前月到當月的區間
        start = `${year}/03/${String(day + 1).padStart(2, '0')}`;
        end = `${year}/04/${String(day).padStart(2, '0')}`;
        text = `每月 ${day} 號`;
    }
    rangeDisplay.innerText = `${start} – ${end}`;
    noteDisplay.innerText = `帳單結帳日：${text}`;
}

function confirmCycle() {
    const val = document.getElementById('cycle-slider').value;
    const text = (val == 31) ? "每月月底" : `每月 ${val} 號`;
    document.getElementById('main-cycle-display').innerHTML = `${text} <i data-lucide="chevron-right" class="s-icon"></i>`;
    lucide.createIcons();
    closeModal('cycle-picker-modal');
}

// --- 繳款期限邏輯 (雙層模式) ---
let currentDueMode = 'fixed';
let selectedDueDay = 1;

function openDueDateModal() {
    backToDueMode();
    openModal('due-date-modal');
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

function backToDueMode() {
    document.getElementById('due-mode-selection').style.display = 'block';
    document.getElementById('due-mode-footer').style.display = 'flex';
    document.getElementById('due-detail-picker').style.display = 'none';
}

function confirmDueDate() {
    const prefix = (currentDueMode === 'fixed') ? '每月' : '結帳後';
    document.getElementById('due-date-display').innerHTML = `${prefix}${selectedDueDay}日 <i data-lucide="chevron-right" class="s-icon"></i>`;
    lucide.createIcons();
    closeModal('due-date-modal');
}

// --- 帳戶分組 ---
function openGroupPicker() { openModal('group-picker-modal'); }
function selectGroup(name) {
    document.getElementById('selected-group-text').innerHTML = `${name} <i data-lucide="chevron-right" class="s-icon"></i>`;
    lucide.createIcons();
    closeModal('group-picker-modal');
}

// --- 信用帳戶開關 ---
function toggleCreditFields() {
    const isCredit = document.getElementById('in-is-credit').checked;
    document.getElementById('credit-extra-fields').style.display = isCredit ? 'block' : 'none';
    document.getElementById('add-display-amount').className = isCredit ? 'val text-red' : 'val text-green';
}

function updateFabState(pageId) {
    const fabIcon = document.querySelector('.tab-fab i');
    const fabElement = document.getElementById('main-fab');
    if (!fabIcon || !fabElement) return;

    // 但根據頁面切換圖示
    if (pageId === 'page-calendar' || pageId === 'page-add-record') {
        fabIcon.setAttribute('data-lucide', 'plus');
        fabElement.classList.add('fab-active'); // 增加放大效果
    } else {
        fabIcon.setAttribute('data-lucide', 'layers');
        fabElement.classList.remove('fab-active'); // 回到正常大小
    }
}















/**
 * Koin 核心邏輯整合 - script.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Lucide 圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 2. 執行各頁面初始渲染
    if (typeof renderAccountList === 'function') renderAccountList();
    if (typeof renderProjectsPage === 'function') renderProjectsPage();
    
    // 3. 初始切換到帳戶總覽 ( element 傳 null 讓它走自動標亮邏輯 )
    showPage('page-overview', null);
});

/**
 * 核心分頁切換：處理頁面顯示、導覽列顏色、中間 FAB 圖示
 */
function showPage(pageId, element) {
    // A. 頁面顯示切換
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');

    // B. 清除導覽列狀態
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    const fabElement = document.getElementById('main-fab');
    if (fabElement) fabElement.classList.remove('fab-active');

    // C. 處理高亮邏輯
    if (element) {
        // 點擊觸發：直接讓點擊的對象變 active (變藍色或放大)
        element.classList.add('active');
        if (element.classList.contains('tab-fab')) {
            element.classList.add('fab-active');
        }
    } else {
        // 程式內部跳轉：自動尋找對應的按鈕標亮
        const autoTab = document.querySelector(`.tab-bar [onclick*="${pageId}"]`);
        if (autoTab) autoTab.classList.add('active');
        // 如果是跳轉到日曆，自動幫中間 FAB 放大
        if (pageId === 'page-calendar' && fabElement) fabElement.classList.add('fab-active');
    }

    // D. 處理 FAB 圖示變換 (layers ↔ plus)
    const fabIcon = document.querySelector('.tab-fab i');
    if (fabIcon) {
        if (pageId === 'page-calendar' || pageId === 'page-add-record') {
            fabIcon.setAttribute('data-lucide', 'plus');
        } else {
            fabIcon.setAttribute('data-lucide', 'layers');
        }
    }

    // E. 重新驅動 Lucide (非常重要：更換圖示後必須重繪)
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 專案頁渲染連動
    if (pageId === 'page-projects' && typeof renderProjectsPage === 'function') {
        renderProjectsPage();
    }
}

/**
 * 中間按鈕專用處理：控制「去日曆」或「去新增」
 */
function handleFabClick(element) {
    const activePage = document.querySelector('.page.active');
    const currentId = activePage ? activePage.id : '';

    if (currentId !== 'page-calendar') {
        // 不在日曆頁 -> 前往日曆頁，傳入 element 確保彩色按鈕變大
        showPage('page-calendar', element);
    } else {
        // 已在日曆頁 -> 前往新增記錄
        showPage('page-add-record', element);
    }
}


   // 1. 儲存帳戶並同步
function saveAccount() {
    const name = document.getElementById('acc-name').value;
    const amount = parseFloat(document.getElementById('acc-amount').value) || 0;
    const isCredit = document.getElementById('in-is-credit').checked;
    const group = document.getElementById('selected-group-text').innerText.trim();

    if (!name) return alert("請輸入帳戶名稱");

    const newAccount = {
        id: Date.now(),
        name: name,
        amount: amount,
        isCredit: isCredit,
        group: group
    };

    // 取得舊資料並存入
    const accounts = JSON.parse(localStorage.getItem('koin_accounts') || '[]');
    accounts.push(newAccount);
    localStorage.setItem('koin_accounts', JSON.stringify(accounts));

    alert("儲存成功！");
    
    // 重置表單
    document.getElementById('acc-name').value = '';
    document.getElementById('acc-amount').value = '0';
    
    // 更新首頁列表並跳轉
    renderAccountList();
    showPage('page-overview');
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

    // 無論在哪個頁面，我們都保持它有漸層色的 Class
    // 但根據頁面切換圖示
    if (pageId === 'page-calendar' || pageId === 'page-add-record') {
        fabIcon.setAttribute('data-lucide', 'plus');
        fabElement.classList.add('fab-active'); // 增加放大效果
    } else {
        fabIcon.setAttribute('data-lucide', 'layers');
        fabElement.classList.remove('fab-active'); // 回到正常大小
    }
}















/**
 * Koin 核心邏輯整合 - script.js
 */

document.addEventListener('DOMContentLoaded', () => {
    renderAccountList();  // 渲染帳戶
    if (typeof renderProjectsPage === 'function') renderProjectsPage(); // 渲染專案
    showPage('page-overview'); // 初始顯示首頁
});

/**
 * 頁面切換核心邏輯 (整合版)
 */
function showPage(pageId, element) {
    // 1. 切換頁面主體
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');

    // 2. 更新 Tab Bar 亮起狀態
    document.querySelectorAll('.tab-item, .tab-fab').forEach(tab => tab.classList.remove('active'));
    
    if (element) {
        element.classList.add('active');
    } else {
        // 如果是透過代碼跳轉（如 saveAccount 後），自動找到對應的 Tab 標亮
        const autoTab = document.querySelector(`.tab-bar [onclick*="${pageId}"]`);
        if (autoTab) autoTab.classList.add('active');
    }

    // 3. FAB (中間按鈕) 圖示狀態連動
    const fabIcon = document.querySelector('.tab-fab i');
    if (fabIcon) {
        if (pageId === 'page-calendar') {
            fabIcon.setAttribute('data-lucide', 'plus'); // 在日曆頁顯示 +
        } else if (pageId !== 'page-add-record') {
            fabIcon.setAttribute('data-lucide', 'layers'); // 其他頁面顯示層疊圖示
        }
    }

    // 4. 重新渲染 Lucide 圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 處理中間圓形按鈕 (FAB) 的點擊邏輯
 */
function handleFabClick(element) {
    const currentPage = document.querySelector('.page.active').id;

    if (currentPage === 'page-calendar') {
        // 如果已經在日曆頁，點擊加號進入「新增紀錄」
        showPage('page-add-record');
    } else {
        // 如果在其他頁面，點擊後先切換到日曆頁
        showPage('page-calendar', element);
    }
}


// 修改導覽列 HTML 中的 onclick
// <div class="tab-fab" onclick="handleFabClick()"> ... </div>

// 同步更新 showPage 函數，確保從其他 tab 切換時圖示正確
const originalShowPage = window.showPage;
window.showPage = function(pageId, element) {
    if (typeof originalShowPage === 'function') originalShowPage(pageId, element);
    
    const fabIcon = document.querySelector('.tab-fab i');
    // 只有在日曆頁時才顯示 + 號，其他頁面顯示層級圖示
    if (pageId === 'page-calendar') {
        fabIcon.setAttribute('data-lucide', 'plus');
    } else {
        fabIcon.setAttribute('data-lucide', 'layers');
    }
    lucide.createIcons();
};

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














 




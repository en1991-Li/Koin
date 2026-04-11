/**
 * Koin 核心邏輯整合 - script.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Lucide 圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 2. 執行各頁面渲染
    if (typeof renderAccountList === 'function') renderAccountList();
    if (typeof renderProjectsPage === 'function') renderProjectsPage(); // 確保這行有執行
    
    // 3. 初始切換到首頁
    showPage('page-overview');
});

// 頁面切換核心
function showPage(pageId, element) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');

    // 關鍵修正：進入專案頁面時強制執行渲染
    if (pageId === 'page-projects') {
        if (typeof renderProjectsPage === 'function') {
            renderProjectsPage();
        }
    }

let isFabPlus = false; // 追蹤中間按鈕是否為加號

function handleFabClick(element) {
    const iconElement = document.getElementById('fab-icon');
    
    if (!isFabPlus) {
        // 狀態 1: 從layers變成加號
        iconElement.setAttribute('data-lucide', 'plus');
        element.classList.add('fab-active'); // 可以加個 CSS 動畫
        isFabPlus = true;
    } else {
        // 狀態 2: 已經是加號，點擊開啟新增紀錄頁面
        showPage('page-add-record'); // 假設你的新增頁面 ID 是這個
        
        // 開啟後可以選擇是否重設回layers圖示
        resetFab();
    }
    
    // 重新驅動 Lucide 圖示渲染
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 重設中間按鈕回layers狀態的函式
function resetFab() {
    const iconElement = document.getElementById('fab-icon');
    const fabElement = document.getElementById('main-fab');
    if (iconElement) {
        iconElement.setAttribute('data-lucide', 'layers');
        fabElement.classList.remove('fab-active');
        isFabPlus = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// 修改原有的 showPage，確保切換到其他頁面時，中間按鈕會重置
const originalShowPage = window.showPage;
window.showPage = function(pageId, element) {
    if (pageId !== 'page-add-record') {
        resetFab();
    }
    
    // 執行原有的 showPage 邏輯
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    // 更新導覽列高亮 (排除 FAB)
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    if (element && element.classList.contains('tab-item')) {
        element.classList.add('active');
    }
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














 



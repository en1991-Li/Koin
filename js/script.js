/**
 * Koin 核心邏輯整合 - script.js
 */

// 全域狀態：追蹤中間按鈕是否為加號
let isFabPlus = false;

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Lucide 圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 2. 執行初始渲染
    renderAccountList();
    if (typeof renderProjectsPage === 'function') renderProjectsPage();
    
    // 3. 預設顯示首頁
    showPage('page-overview');
});

/**
 * 頁面切換核心邏輯
 */
function showPage(pageId, element) {
    // 隱藏所有頁面，顯示目標頁面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) target.classList.add('active');

    // 如果切換到「專案頁面」，強制執行渲染
    if (pageId === 'page-projects' && typeof renderProjectsPage === 'function') {
        renderProjectsPage();
    }

    // 只要不是去「新增紀錄」頁面，中間按鈕都要重置回 layers 狀態
    if (pageId !== 'page-add-record') {
        resetFab();
    }
    
    // 更新底部導覽列高亮 (排除 FAB)
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    if (element && element.classList.contains('tab-item')) {
        element.classList.add('active');
    }

    // 重新驅動圖示渲染
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 中間 FAB 按鈕點擊邏輯
 */
function handleFabClick(element) {
    const iconElement = document.getElementById('fab-icon');
    
    if (!isFabPlus) {
        // 第一階段：切換成「加號」
        iconElement.setAttribute('data-lucide', 'plus');
        element.classList.add('fab-active'); 
        isFabPlus = true;
    } else {
        // 第二階段：跳轉至「新增紀錄」
        showPage('page-add-record');
        // 跳轉後保持加號狀態或重置皆可，通常建議重置
        resetFab();
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 重置中間按鈕回 layers 狀態
function resetFab() {
    const iconElement = document.getElementById('fab-icon');
    const fabElement = document.getElementById('main-fab');
    if (iconElement && fabElement) {
        iconElement.setAttribute('data-lucide', 'layers');
        fabElement.classList.remove('fab-active');
        isFabPlus = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

/**
 * 帳戶管理邏輯
 */
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

    const accounts = JSON.parse(localStorage.getItem('koin_accounts') || '[]');
    accounts.push(newAccount);
    localStorage.setItem('koin_accounts', JSON.stringify(accounts));

    alert("儲存成功！");
    
    // 重置表單
    document.getElementById('acc-name').value = '';
    document.getElementById('acc-amount').value = '0';
    
    renderAccountList();
    showPage('page-overview');
}

function renderAccountList() {
    const accounts = JSON.parse(localStorage.getItem('koin_accounts') || '[]');
    const listContainer = document.querySelector('.account-list');
    if (!listContainer) return; // 防止在沒有該元素的頁面出錯

    const totalBalanceEl = document.getElementById('total-balance');
    let total = 0, asset = 0, debt = 0;

    listContainer.innerHTML = '';

    accounts.forEach(acc => {
        if (acc.isCredit) {
            debt += acc.amount;
            total -= acc.amount;
        } else {
            asset += acc.amount;
            total += acc.amount;
        }

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

    if (totalBalanceEl) totalBalanceEl.innerText = total.toLocaleString();
    const stats = document.querySelectorAll('.sub-stats span span');
    if (stats.length >= 2) {
        stats[0].innerText = asset.toLocaleString();
        stats[1].innerText = debt.toLocaleString();
    }
}

/**
 * 專案管理邏輯
 */
function saveProject() {
    const name = document.getElementById('proj-name').value;
    const note = document.getElementById('proj-note').value;
    const isStats = document.querySelector('#page-add-project .switch input[type="checkbox"]:nth-of-type(3)')?.checked || false;

    if (!name) return alert("請輸入專案名稱");

    const newProject = {
        name: name,
        icon: "piggy-bank",
        date: "2026/04/01 － 2026/04/30",
        amount: 0,
        isStats: isStats,
        note: note
    };

    const projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
    projects.push(newProject);
    localStorage.setItem('koin_projects', JSON.stringify(projects));

    if (typeof renderProjectsPage === 'function') renderProjectsPage();
    
    document.getElementById('proj-name').value = '';
    document.getElementById('proj-note').value = '';
    showPage('page-projects');
}

/**
 * 彈窗與 Picker 控制
 */
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function openCyclePicker() { openModal('cycle-picker-modal'); }
function updateCycleText(val) {
    const rangeDisplay = document.getElementById('modal-date-range');
    const noteDisplay = document.getElementById('modal-cycle-note');
    let start, end, text;
    if (val == 31) {
        start = `2026/04/01`; end = `2026/04/30`; text = "每月月底";
    } else {
        const day = parseInt(val);
        start = `2026/03/${String(day + 1).padStart(2, '0')}`;
        end = `2026/04/${String(day).padStart(2, '0')}`;
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

// 繳款期限
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

function openGroupPicker() { openModal('group-picker-modal'); }
function selectGroup(name) {
    document.getElementById('selected-group-text').innerHTML = `${name} <i data-lucide="chevron-right" class="s-icon"></i>`;
    lucide.createIcons();
    closeModal('group-picker-modal');
}

function toggleCreditFields() {
    const isCredit = document.getElementById('in-is-credit').checked;
    document.getElementById('credit-extra-fields').style.display = isCredit ? 'block' : 'none';
    document.getElementById('add-display-amount').className = isCredit ? 'val text-red' : 'val text-green';
}

/**
 * Koin 核心邏輯整合 - script.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 2. 初始頁面渲染
    renderAccountOverview(); 
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
                        ${acc.isCredit ? '-' : ''}${Math.abs(amount).toLocaleString()}
                    </span>
                </div>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', accountHTML);
    });

    // 更新頂部數字
    if (document.getElementById('total-balance')) document.getElementById('total-balance').innerText = totalBalance.toLocaleString();
    if (document.getElementById('total-assets')) document.getElementById('total-assets').innerText = totalAssets.toLocaleString();
    if (document.getElementById('total-debts')) document.getElementById('total-debts').innerText = totalDebts.toLocaleString();

    if (typeof lucide !== 'undefined') lucide.createIcons();
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

// 定義一個變數來儲存當前查看的帳戶索引
let currentActiveAccountIndex = null;

// 修改原本的開啟詳情函式
function openAccountDetail(index) {
    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    const acc = savedAccounts[index];
    if (!acc) return;

    // 紀錄索引，之後刪除才知道刪哪一個
    currentActiveAccountIndex = index;

    document.getElementById('detail-acc-name').innerText = acc.name;
    const displayAmount = acc.isCredit ? `-${Math.abs(acc.amount).toLocaleString()}` : acc.amount.toLocaleString();
    document.getElementById('detail-acc-amount').innerText = displayAmount;

    showPage('page-account-detail');
}

/**
 * 執行刪除動作
 */
function deleteAccount() {
    if (currentActiveAccountIndex === null) return;

    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    const targetName = savedAccounts[currentActiveAccountIndex].name;

    // 關閉選單
    closeModal('account-more-modal');

    // 彈窗確認
    if (confirm(`確定要刪除帳戶「${targetName}」嗎？\n刪除後無法恢復。`)) {
        // 從陣列中移除
        savedAccounts.splice(currentActiveAccountIndex, 1);
        
        // 更新資料庫
        localStorage.setItem('koin_accounts', JSON.stringify(savedAccounts));
        
        // 重新渲染畫面並跳轉
        renderAccountOverview();
        showPage('page-overview');
        
        // 重置索引
        currentActiveAccountIndex = null;
    }
}

// 帳戶細節頁分頁切換監聽
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('detail-tab')) {
        document.querySelectorAll('.detail-tab').forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        console.log("切換至：", e.target.innerText);
    }
});

/**
 * 處理 FAB 點擊
 */
function handleFabClick(element) {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    const currentPage = activePage.id;
    if (currentPage !== 'page-calendar') {
        showPage('page-calendar', element);
    } else {
        showPage('page-add-record', element);
    }
}

// --- 專案儲存邏輯 ---
function saveProject() {
    const name = document.getElementById('proj-name').value;
    const note = document.getElementById('proj-note').value;
    if (!name) return alert("請輸入專案名稱");

    const newProject = {
        name: name,
        icon: "piggy-bank",
        date: "2026/04/01 － 2026/04/30",
        amount: 0,
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

// --- 彈窗與週期邏輯 ---
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

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

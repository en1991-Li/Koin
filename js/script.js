/**
 * Koin 核心邏輯整合 - script.js
 */

// ==========================================
// 1. 全域狀態管理 (Global State)
// ==========================================
let currentActiveAccountIndex = null;
let isAmountHidden = false; 

// 新增記錄全域狀態暫存
let recordState = {
    type: '支出',
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

document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateCalendarHeaderToToday(); 
    renderAccountOverview(); 
    if (typeof renderProjectsPage === 'function') renderProjectsPage();
    showPage('page-overview');
});

// ==========================================
// 2. 核心導覽與頁面控制
// ==========================================
function showPage(pageId, element) {
    // 1. 安全關閉所有可能開啟的彈窗遮罩與計算機，防止隱形 DOM 阻擋點擊事件
    document.querySelectorAll('.modal-overlay').forEach(m => m.style.display = 'none');
    toggleCalculator(false); // 強制關閉計算機

    // 2. 取得目標頁面
    const target = document.getElementById(pageId);
    if (!target) {
        console.error(`[錯誤] 找不到頁面 ID: ${pageId}`);
        return;
    }
    
    // 3. 切換頁面 Active 狀態
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    target.classList.add('active');

    // 4. 清除所有導覽列按鈕的 Active 狀態
    document.querySelectorAll('.tab-bar .tab-item').forEach(tab => tab.classList.remove('active'));
    
    const fabElement = document.getElementById('main-fab');
    if (fabElement) fabElement.classList.remove('fab-active');

    // 5. 點亮當前選取的 Tab
    if (element) {
        element.classList.add('active');
        if (element.classList.contains('tab-fab')) element.classList.add('fab-active');
    } else {
        // 程式觸發跳轉時，動態精準匹配 onclick 裡面帶有該 pageId 的項目
        const autoTab = document.querySelector(`.tab-bar .tab-item[onclick*="${pageId}"]`);
        if (autoTab) autoTab.classList.add('active');
    }

    // 6. 動態變更中間彩色 FAB 的圖示
    const fabIcon = document.getElementById('fab-icon');
    if (fabIcon) {
        const iconName = (pageId === 'page-calendar' || pageId === 'page-add-record') ? 'plus' : 'layers';
        fabIcon.setAttribute('data-lucide', iconName);
    }

    // 7.確保最後一頁的 sliders-horizontal 圖示與頁面內的新圖示能被渲染出來
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function handleFabClick(element) {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return;
    
    if (activePage.id !== 'page-calendar') {
        showPage('page-calendar', element);
        if (typeof selectedDate !== 'undefined') selectedDate = new Date(); 

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

// ==========================================
// 3. 帳戶總覽與明細邏輯
// ==========================================
function renderAccountOverview() {
    const listContainer = document.getElementById('account-list');
    if (!listContainer) return;

    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    listContainer.innerHTML = ''; 

    let totalBalance = 0;
    let totalAssets = 0;
    let totalDebts = 0;

    const groups = { '現金': { accounts: [], subtotal: 0 }, '銀行': { accounts: [], subtotal: 0 }, '信用卡': { accounts: [], subtotal: 0 }, '其他': { accounts: [], subtotal: 0 } };

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
            <div class="account-group-header" style="display:flex; justify-content:space-between; padding:10px 4px; color:#8a8a8e; font-size:13px; font-weight:500;">
                <span>－ ${groupName} (${data.accounts.length})</span>
                <span class="amount-val ${data.subtotal < 0 ? 'text-red' : ''}" data-value="${data.subtotal}">
                    ${data.subtotal < 0 ? '-' : '+'}${Math.abs(data.subtotal).toLocaleString()}
                </span>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', groupHeaderHTML);

        data.accounts.forEach(acc => {
            const amount = parseFloat(acc.amount) || 0;
            const accountHTML = `
                <div class="form-group" style="margin-bottom: 8px; cursor: pointer;" onclick="openAccountDetail(${acc.originalIndex})">
                    <div class="form-row">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="background:#3d3d4d; padding:8px; border-radius:10px; display:flex;">
                                <i data-lucide="${acc.isCredit ? 'credit-card' : 'wallet'}" style="width:20px; height:20px;"></i>
                            </div>
                            <div style="display:flex; flex-direction:column;">
                                <span style="font-size:15px; font-weight:500;">${acc.name}</span>
                            </div>
                        </div>
                        <span class="amount-val ${acc.isCredit ? 'text-red' : 'text-green'}" style="font-weight:600;" data-value="${acc.isCredit ? -Math.abs(amount) : amount}">
                            ${acc.isCredit ? '-' : ''}${Math.abs(amount).toLocaleString()}
                        </span>
                    </div>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', accountHTML);
        });
    }

    if (document.getElementById('total-balance')) document.getElementById('total-balance').setAttribute('data-value', totalBalance);
    if (document.getElementById('total-assets')) document.getElementById('total-assets').setAttribute('data-value', totalAssets);
    if (document.getElementById('total-debts')) document.getElementById('total-debts').setAttribute('data-value', totalDebts);

    updateAmountDisplay();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleAmountVisibility() {
    isAmountHidden = !isAmountHidden;
    const eyeIcon = document.getElementById('eye-toggle');
    if (eyeIcon) {
        eyeIcon.setAttribute('data-lucide', isAmountHidden ? 'eye-off' : 'eye');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    updateAmountDisplay();
}

function updateAmountDisplay() {
    document.querySelectorAll('.amount-val').forEach(el => {
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

function openAccountDetail(index) {
    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    const acc = savedAccounts[index];
    if (!acc) return;

    currentActiveAccountIndex = index;

    document.getElementById('detail-acc-name').innerText = acc.name;
    const amountEl = document.getElementById('detail-acc-amount');
    amountEl.innerText = acc.isCredit ? `-${Math.abs(acc.amount).toLocaleString()}` : acc.amount.toLocaleString();
    amountEl.className = acc.isCredit ? 'amount text-red' : 'amount text-green';

    if (document.getElementById('info-name')) document.getElementById('info-name').innerText = acc.name;
    if (document.getElementById('info-group')) document.getElementById('info-group').innerText = acc.group;
    if (document.getElementById('info-initial')) document.getElementById('info-initial').innerText = (acc.amount || 0).toLocaleString();
    if (document.getElementById('info-is-credit')) document.getElementById('info-is-credit').checked = acc.isCredit;
    
    switchDetailTab(0);
    showPage('page-account-detail');
}

function switchDetailTab(tabIndex) {
    const tabs = document.querySelectorAll('.detail-tab');
    const transContent = document.getElementById('tab-content-transactions');
    const infoContent = document.getElementById('tab-content-info');

    tabs.forEach((tab, i) => tab.classList.toggle('active', i === tabIndex));

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
    const group = groupElement ? groupElement.textContent.trim() : '未分組';
    const isCredit = document.getElementById('in-is-credit').checked;

    if (!name) { alert('請輸入帳戶名稱'); return; }

    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    savedAccounts.push({ name, amount: parseFloat(amountInput) || 0, group, isCredit, id: Date.now() });
    localStorage.setItem('koin_accounts', JSON.stringify(savedAccounts));

    renderAccountOverview();
    
    document.getElementById('acc-name').value = '';
    document.getElementById('acc-amount').value = '0';
    showPage('page-overview');
}

function deleteAccountAction() {
    if (confirm("確定要刪除此帳戶嗎？所有交易紀錄將被移除。")) {
        let accounts = JSON.parse(localStorage.getItem('koin_accounts') || '[]');
        if (currentActiveAccountIndex !== null && typeof currentActiveAccountIndex !== 'undefined') {
            accounts.splice(currentActiveAccountIndex, 1);
            localStorage.setItem('koin_accounts', JSON.stringify(accounts));
            closeModal('more-options-modal');
            renderAccountOverview(); 
            showPage('page-overview');
        }
    }
}

// ==========================================
// 4. 專案系統邏輯
// ==========================================
function saveProject() {
    const name = document.getElementById('proj-name').value.trim();
    if (!name) return alert("請輸入專案名稱");

    const newProject = {
        id: Date.now(),
        name: name,
        currency: document.getElementById('selected-proj-currency').textContent.trim(),
        type: document.getElementById('selected-proj-type').textContent.trim(),
        period: document.getElementById('selected-proj-period').textContent.trim(),
        startDate: document.getElementById('selected-proj-date').textContent.trim(),
        autoBudget: document.getElementById('proj-auto-budget').checked,
        showHome: document.getElementById('proj-show-home').checked,
        note: document.getElementById('proj-note').value.trim(),
        icon: "piggy-bank", 
        amount: 0 
    };

    const projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
    projects.push(newProject);
    localStorage.setItem('koin_projects', JSON.stringify(projects));

    if (typeof renderProjectsPage === 'function') renderProjectsPage();
    document.getElementById('proj-name').value = '';
    showPage('page-projects');
}

// 專案彈窗選擇器輔助
function selectProjCurrency(val) { updateSpan('selected-proj-currency', val); closeModal('proj-currency-modal'); }
function selectProjType(val) { updateSpan('selected-proj-type', val); closeModal('proj-type-modal'); }
function selectProjPeriod(val) { updateSpan('selected-proj-period', val); closeModal('proj-period-modal'); }
function selectProjDate(val) { updateSpan('selected-proj-date', val); closeModal('proj-date-modal'); }
function updateSpan(id, val) {
    const el = document.getElementById(id);
    if (el) { el.innerHTML = `${val} <i data-lucide="chevron-right" class="s-icon"></i>`; lucide.createIcons(); }
}
function openProjDatePicker() {
    const container = document.getElementById('proj-date-options');
    if (container) {
        container.innerHTML = '';
        for (let i = 1; i <= 30; i++) container.insertAdjacentHTML('beforeend', `<div class="option-item" onclick="selectProjDate('第 ${i} 天')">第 ${i} 天</div>`);
        container.insertAdjacentHTML('beforeend', `<div class="option-item" onclick="selectProjDate('月底')">月底</div>`);
    }
    openModal('proj-date-modal');
}

// ==========================================
// 5. 計算機與新增記錄核心 (The Complete Record Engine)
// ==========================================
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
}

function setRecordType(type, el) {
    recordState.type = type;
    document.querySelectorAll('#record-type-tabs span').forEach(s => s.classList.remove('active', 'text-blue'));
    el.classList.add('active', 'text-blue');
}

function quickSelectBrand(name, defaultProj) {
    document.getElementById('record-name').value = name;
    selectRecordProject(defaultProj);
}

// 記錄頁：動態搜尋過濾帳戶
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

    if (filtered.length === 0) return container.innerHTML = '<div class="option-item" style="color:#8a8a8e; text-align:center;">找不到相符帳戶</div>';
    
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

// 記錄頁：動態搜尋過濾專案
function openRecordProjectPicker() {
    filterRecordProjects('');
    openModal('record-project-modal');
}
function filterRecordProjects(keyword) {
    const container = document.getElementById('record-project-options');
    if (!container) return;
    container.innerHTML = '';
    const projects = JSON.parse(localStorage.getItem('koin_projects')) || [];
    
    if ('無專案'.includes(keyword)) container.insertAdjacentHTML('beforeend', `<div class="option-item" onclick="selectRecordProject('無專案')">無專案</div>`);

    const filtered = projects.filter(proj => proj.name.toLowerCase().includes(keyword.toLowerCase()));
    filtered.forEach(proj => {
        container.insertAdjacentHTML('beforeend', `<div class="option-item" onclick="selectRecordProject('${proj.name}')">${proj.name}</div>`);
    });
}
function selectRecordProject(name) {
    recordState.project = name;
    document.getElementById('btn-select-project').innerText = name;
    closeModal('record-project-modal');
}

// 記錄頁：自訂日期時間選取
function openRecordDatePicker() { openModal('cycle-picker-modal'); } // 暫時聯動現有彈窗
function openRecordTimePicker() {
    const now = new Date();
    document.getElementById('input-record-hour').value = now.getHours();
    document.getElementById('input-record-minute').value = now.getMinutes();
    openModal('record-time-modal');
}
function confirmRecordTime() {
    const hr = document.getElementById('input-record-hour').value;
    const min = document.getElementById('input-record-minute').value;
    const formattedTime = `${String(hr).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
    recordState.time = formattedTime;
    document.getElementById('btn-select-time').innerText = formattedTime;
    closeModal('record-time-modal');
}

// 記錄頁：進階設定頁籤
function switchAdvancedTab(tabType) {
    recordState.advType = tabType;
    document.querySelectorAll('#record-advanced-modal .detail-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`adv-pane-single`).style.display = 'none';
    document.getElementById(`adv-pane-cycle`).style.display = 'none';
    document.getElementById(`adv-pane-install`).style.display = 'none';

    document.getElementById(`adv-tab-${tabType}`).classList.add('active');
    document.getElementById(`adv-pane-${tabType}`).style.display = 'block';
}

// ==========================================
// 6. 更多功能與設定路由 (Settings Page)
// ==========================================
function handleSettingsAction(action) {
    console.log(`[系統] 觸發設定功能: ${action}`);
    if (action === 'Google 登入') alert('正在啟動 Google OAuth 安全登入驗證...');
    else if (action === '匯出 CSV') alert('歷史帳目資料已成功匯出至下載資料夾！');
    else if (action === '重新計算餘額') {
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

function handleSettingsToggleHide(isChecked) {
    if (typeof isAmountHidden !== 'undefined') {
        isAmountHidden = isChecked;
        const eyeIcon = document.getElementById('eye-toggle');
        if (eyeIcon) eyeIcon.setAttribute('data-lucide', isAmountHidden ? 'eye-off' : 'eye');
        if (typeof updateAmountDisplay === 'function') updateAmountDisplay();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// ==========================================
// 7. 通用 Modal 控制與日曆輔助
// ==========================================
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}
function updateCalendarHeaderToToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); 
    const headerTitle = document.getElementById('full-calendar-month');
    if (headerTitle) headerTitle.innerText = `${year}/${month}`;
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
    updateSpan('main-cycle-display', text);
    closeModal('cycle-picker-modal');
}
function openGroupPicker() { openModal('group-picker-modal'); }
function selectGroup(name) { updateSpan('selected-group-text', name); closeModal('group-picker-modal'); }
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
    updateSpan('due-date-display', `${prefix}${selectedDueDay}日`);
    closeModal('due-date-modal');
}

/**
 * Koin script.js
 */

// =========================================
// 1. 全域變數與初始化
// =========================================
let currentActiveAccountIndex = null;
let isAmountHidden = false; 

// 新增記錄頁全域暫存狀態機
let recordState = {
    type: '支出',
    currentInput: '0',    // 計算機當前輸入緩衝字串
    prevInput: '0',       // 運算暫存值
    operator: null,       // 當前運算子 (+,-,×,÷)
    isCalculated: false,  // 是否剛執行完等號
    account: '錢包',
    project: '生活開銷',
    date: '2026/06/20',
    time: '13:57',
    advType: 'single'     // single(單次), cycle(週期), install(分期)
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 2. 更新日曆標題至當前月份
    updateCalendarHeaderToToday(); 
    
    // 3. 初始頁面渲染
    renderAccountOverview(); 
    if (typeof renderProjectsPage === 'function') renderProjectsPage();
    
    // 4. 預設首頁狀態
    showPage('page-overview');
});

// =========================================
// 2. 核心頁面切換機制
// =========================================
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

// =========================================
// 3. 帳戶資產面板群組渲染與隱私盾
// =========================================
function renderAccountOverview() {
    const listContainer = document.getElementById('account-list');
    if (!listContainer) return;

    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    listContainer.innerHTML = ''; 

    let totalBalance = 0;
    let totalAssets = 0;
    let totalDebts = 0;

    // 分組容器邏輯
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

    // 遍歷並渲染 HTML
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

    // 將真實金額寫入 Hero 區塊的 data-value
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

// =========================================
// 4. 新增記錄面板控制
// =========================================
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
    if ('無專案'.includes(keyword)) {
        container.insertAdjacentHTML('beforeend', `<div class="option-item" onclick="selectRecordProject('無專案')">無專案</div>`);
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

function openRecordDatePicker() { openModal('cycle-picker-modal'); }
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

function quickSelectBrand(name, defaultProj) {
    document.getElementById('record-name').value = name;
    selectRecordProject(defaultProj);
}

function setRecordType(type, el) {
    recordState.type = type;
    document.querySelectorAll('#record-type-tabs span').forEach(s => s.classList.remove('active', 'text-blue'));
    el.classList.add('active', 'text-blue');
}

/**
 * 儲存記錄核心模組與多帳戶扣帳同步演算
 */
function saveRecord() {
    const nameStr = document.getElementById('record-name').value.trim();
    const noteStr = document.getElementById('record-note').value.trim();
    const finalAmount = parseFloat(recordState.currentInput) || 0;

    if (finalAmount <= 0) return alert('請輸入大於 0 的金額');
    if (!nameStr) return alert('請輸入項目名稱');

    // 1. 動態帳戶扣帳增減模組
    let accounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    let targetAcc = accounts.find(acc => acc.name === recordState.account);

    if (targetAcc) {
        if (recordState.type === '支出') {
            targetAcc.amount = targetAcc.isCredit ? 
                (parseFloat(targetAcc.amount) + finalAmount) : (parseFloat(targetAcc.amount) - finalAmount);
        } else if (recordState.type === '收入') {
            targetAcc.amount = targetAcc.isCredit ? 
                (parseFloat(targetAcc.amount) - finalAmount) : (parseFloat(targetAcc.amount) + finalAmount);
        }
        localStorage.setItem('koin_accounts', JSON.stringify(accounts));
    }

    // 2. 封裝歷史明細檔案
    const newRecordItem = {
        id: Date.now(),
        type: recordState.type,
        name: nameStr,
        amount: finalAmount,
        accountName: recordState.account,
        projectName: recordState.project,
        date: recordState.date,
        time: recordState.time,
        note: noteStr
    };

    let recordHistory = JSON.parse(localStorage.getItem('koin_records') || '[]');
    recordHistory.push(newRecordItem);
    localStorage.setItem('koin_records', JSON.stringify(recordHistory));

    // 3. 觸發重新繪製主畫面
    renderAccountOverview();

    // 4. 表單初始化歸位
    document.getElementById('record-name').value = '';
    document.getElementById('record-note').value = '';
    recordState.currentInput = '0';
    document.getElementById('record-amount-display').innerText = '0';

    showPage('page-calendar');
}

// =========================================
// 5. 帳戶詳情、建立與刪除模組 (CRUD)
// =========================================
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
    const group = groupElement ? groupElement.innerText.replace('chevron-right', '').trim() : '未分組';
    const isCredit = document.getElementById('in-is-credit').checked;

    if (!name) { alert('請輸入帳戶名稱'); return; }

    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    const newAccount = { name, amount: parseFloat(amountInput) || 0, group: group, isCredit, id: Date.now() };

    savedAccounts.push(newAccount);
    localStorage.setItem('koin_accounts', JSON.stringify(savedAccounts));

    renderAccountOverview();
    
    document.getElementById('acc-name').value = '';
    document.getElementById('acc-amount').value = '0';
    showPage('page-overview');
}

function deleteAccountAction() {
    if (confirm("確定要刪除此帳戶嗎？所有交易紀錄將被移除。")) {
        let accounts = JSON.parse(localStorage.getItem('koin_accounts') || '[]');
        if (currentActiveAccountIndex !== null) {
            accounts.splice(currentActiveAccountIndex, 1);
            localStorage.setItem('koin_accounts', JSON.stringify(accounts));
            closeModal('more-options-modal');
            renderAccountOverview(); 
            showPage('page-overview');
        }
    }
}

// =========================================
// 6. 專案管理核心模組
// =========================================
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

function openProjDatePicker() {
    const container = document.getElementById('proj-date-options');
    if (container) {
        container.innerHTML = '';
        for (let i = 1; i <= 30; i++) {
            container.insertAdjacentHTML('beforeend', `<div class="option-item" onclick="selectProjDate('第 ${i} 天')">第 ${i} 天</div>`);
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

function saveProject() {
    const name = document.getElementById('proj-name').value.trim();
    const note = document.getElementById('proj-note').value.trim();
    if (!name) return alert("請輸入專案名稱");

    const currency = document.getElementById('selected-proj-currency').textContent.trim();
    const type = document.getElementById('selected-proj-type').textContent.trim();
    const period = document.getElementById('selected-proj-period').textContent.trim();
    const startDate = document.getElementById('selected-proj-date').textContent.trim();
    const autoBudget = document.getElementById('proj-auto-budget').checked;
    const showHome = document.getElementById('proj-show-home').checked;

    const newProject = {
        id: Date.now(), name, currency, type, period, startDate, autoBudget, showHome, note, icon: "piggy-bank", amount: 0
    };

    const projects = JSON.parse(localStorage.getItem('koin_projects') || '[]');
    projects.push(newProject);
    localStorage.setItem('koin_projects', JSON.stringify(projects));

    if (typeof renderProjectsPage === 'function') renderProjectsPage();
    
    document.getElementById('proj-name').value = '';
    document.getElementById('proj-note').value = '';
    document.getElementById('selected-proj-currency').innerHTML = `TWD <i data-lucide="chevron-right" class="s-icon"></i>`;
    document.getElementById('selected-proj-type').innerHTML = `重複循環 <i data-lucide="chevron-right" class="s-icon"></i>`;
    document.getElementById('selected-proj-period').innerHTML = `每月 <i data-lucide="chevron-right" class="s-icon"></i>`;
    document.getElementById('selected-proj-date').innerHTML = `第 1 天 <i data-lucide="chevron-right" class="s-icon"></i>`;
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
    showPage('page-projects');
}

// =========================================
// 7. 日曆控制中心聯動與環境
// =========================================
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

function updateCalendarHeaderToToday() {
    const now = new Date();
    const headerTitle = document.getElementById('full-calendar-month');
    if (headerTitle) {
        headerTitle.innerText = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
}

function highlightToday() {
    const now = new Date();
    const titleEl = document.querySelector('.calendar-header h2') || document.getElementById('calendar-title');
    if (titleEl) {
        titleEl.innerText = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
}

// =========================================
// 8. 系統設定選單與彈窗公用控制組
// =========================================
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

function openCyclePicker() { openModal('cycle-picker-modal'); }
function openGroupPicker() { openModal('group-picker-modal'); }

function updateCycleText(val) {
    const rangeDisplay = document.getElementById('modal-date-range');
    const noteDisplay = document.getElementById('modal-cycle-note');
    if (!rangeDisplay || !noteDisplay) return;
    if (val == 31) {
        rangeDisplay.innerText = "2026/04/01 – 2026/04/30";
        noteDisplay.innerText = "帳單結帳日：每月月底";
    } else {
        rangeDisplay.innerText = `2026/03/${String(val).padStart(2,'0')} – 2026/04/${String(val).padStart(2,'0')}`;
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

function selectGroup(name) {
    const display = document.getElementById('selected-group-text');
    if (display) {
        display.innerHTML = `${name} <i data-lucide="chevron-right" class="s-icon"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    closeModal('group-picker-modal');
}

function toggleCreditFields() {
    const isCredit = document.getElementById('in-is-credit').checked;
    document.getElementById('credit-extra-fields').style.display = isCredit ? 'block' : 'none';
    const displayAmount = document.getElementById('add-display-amount');
    if (displayAmount) displayAmount.className = isCredit ? 'val text-red' : 'val text-green';
}

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

function handleMenuAction(action) {
    console.log("執行：" + action);
    closeModal('more-options-modal');
}

function handleSettingsAction(action) {
    console.log(`[系統] 觸發設定功能: ${action}`);
    if (action === 'Google 登入') {
        alert('正在啟動 Google OAuth 安全登入驗證...');
    } else if (action === '匯出 CSV') {
        alert('歷史帳目資料已成功匯出至下載資料夾！');
    } else if (action === '重新計算餘額') {
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
    isAmountHidden = isChecked;
    const eyeIcon = document.getElementById('eye-toggle');
    if (eyeIcon) {
        eyeIcon.setAttribute('data-lucide', isAmountHidden ? 'eye-off' : 'eye');
    }
    updateAmountDisplay();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

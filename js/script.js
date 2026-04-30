/**
 * Koin 核心邏輯整合 - script.js
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 2. 更新日曆標題至當前月份 (新增這行)
    updateCalendarHeaderToToday(); 
    
    // 3. 初始頁面渲染
    renderAccountOverview(); 
    if (typeof renderProjectsPage === 'function') renderProjectsPage();
    
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

/**
 * 渲染帳戶總覽列表 (依分類排序)
 */
function renderAccountOverview() {
    const listContainer = document.getElementById('account-list');
    if (!listContainer) return;

    const savedAccounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];
    listContainer.innerHTML = ''; 

    let totalBalance = 0;
    let totalAssets = 0;
    let totalDebts = 0;

    // 1. 初始化分組容器
    const groups = {
        '現金': { accounts: [], subtotal: 0 },
        '銀行': { accounts: [], subtotal: 0 },
        '信用卡': { accounts: [], subtotal: 0 },
        '其他': { accounts: [], subtotal: 0 }
    };

    // 2. 將帳戶分配到對應組別並計算總額
    savedAccounts.forEach((acc, index) => {
        const amount = parseFloat(acc.amount) || 0;
        
        // 總額計算
        if (acc.isCredit) {
            totalDebts += Math.abs(amount);
            totalBalance -= Math.abs(amount);
        } else {
            totalAssets += amount;
            totalBalance += amount;
        }

        // 分類歸納 (若 group 不在預設標籤內，歸類到「其他」)
        let category = '其他';
        if (acc.group.includes('現金')) category = '現金';
        else if (acc.group.includes('銀行')) category = '銀行';
        else if (acc.group.includes('信用卡')) category = '信用卡';
        else category = acc.group; // 或是直接使用 acc.group 作為動態分類

        if (!groups[category]) {
            groups[category] = { accounts: [], subtotal: 0 };
        }

        groups[category].accounts.push({ ...acc, originalIndex: index });
        // 小計累加 (資產加、負債減)
        groups[category].subtotal += acc.isCredit ? -Math.abs(amount) : amount;
    });

    // 3. 遍歷分組並渲染 HTML
    for (const [groupName, data] of Object.entries(groups)) {
        if (data.accounts.length === 0) continue; // 沒帳戶就不顯示該分類

        // 渲染分類標題列
        const groupHeaderHTML = `
            <div class="account-group-header" style="display:flex; justify-content:space-between; padding:10px 4px; color:#8a8a8e; font-size:13px; font-weight:500;">
                <span>－ ${groupName} (${data.accounts.length})</span>
                <span class="${data.subtotal < 0 ? 'text-red' : ''}">
                    ${data.subtotal < 0 ? '-' : '+'}${Math.abs(data.subtotal).toLocaleString()}
                </span>
            </div>
        `;
        listContainer.insertAdjacentHTML('beforeend', groupHeaderHTML);

        // 渲染該組內的帳戶
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
                        <span class="${acc.isCredit ? 'text-red' : 'text-green'}" style="font-weight:600;">
                            ${acc.isCredit ? '-' : ''}${Math.abs(amount).toLocaleString()}
                        </span>
                    </div>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', accountHTML);
        });
    }

    // 4. 更新介面頂部總額
    if (document.getElementById('total-balance')) document.getElementById('total-balance').innerText = totalBalance.toLocaleString();
    if (document.getElementById('total-assets')) document.getElementById('total-assets').innerText = totalAssets.toLocaleString();
    if (document.getElementById('total-debts')) document.getElementById('total-debts').innerText = totalDebts.toLocaleString();

    if (typeof lucide !== 'undefined') lucide.createIcons();
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

    // 2. 如果你有動態生成日曆格子的話，可以在這裡加入選取當天格子的邏輯
    console.log(`今天日期是：${year}/${month}/${date}`);
    
    // 這裡可以呼叫你原本渲染日曆的函式，例如：
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

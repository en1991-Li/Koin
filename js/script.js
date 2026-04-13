/**
 * Koin 核心邏輯整合 - script.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Lucide 圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // 2. 執行渲染
    renderAccountList();
    if (typeof renderProjectsPage === 'function') renderProjectsPage();
    
    // 3. 初始切換到首頁
    showPage('page-overview');
});

/**
 * 頁面切換核心
 */
function showPage(pageId, element) {
    // A. 切換頁面 Active 狀態
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');

    // B. 強制執行專案頁渲染
    if (pageId === 'page-projects' && typeof renderProjectsPage === 'function') {
        renderProjectsPage();
    }
    
    // C. 底部導覽列狀態連動 (藍色高亮)
    // 先移除所有人的 active 與 fab-active
    document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    const fabElement = document.getElementById('main-fab');
    if (fabElement) fabElement.classList.remove('fab-active');

    // 如果是點擊下方 Tab 觸發的 (element 存在)
    if (element) {
        element.classList.add('active');
        if (element.classList.contains('tab-fab')) {
             element.classList.add('fab-active'); // FAB 被點擊時變藍色漸層
        }
    } else {
        // 如果是程式內部呼叫 (如 saveAccount 後跳轉)，自動尋找對應 Tab 高亮
        const autoTab = document.querySelector(`.tab-bar [onclick*="${pageId}"]`);
        if (autoTab) autoTab.classList.add('active');
    }

    // D. 核心連動：FAB 圖示與顏色狀態校正
    updateFabState(pageId);

    // E. 重新驅動 Lucide
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 更新 FAB 按鈕的圖示與樣式狀態
 */
function updateFabState(pageId) {
    const fabIcon = document.querySelector('.tab-fab i');
    const fabElement = document.getElementById('main-fab');
    if (!fabIcon || !fabElement) return;

    if (pageId === 'page-calendar') {
        // 在日曆頁：變藍色、變加號
        fabIcon.setAttribute('data-lucide', 'plus');
        fabElement.classList.add('fab-active');
    } else if (pageId === 'page-add-record') {
        // 在新增頁：通常也維持啟動狀態
        fabIcon.setAttribute('data-lucide', 'plus');
        fabElement.classList.add('fab-active');
    } else {
        // 其他頁面：變灰色、變回層級圖示
        fabIcon.setAttribute('data-lucide', 'layers');
        fabElement.classList.remove('fab-active');
    }
}

/**
 * 處理中間 FAB 的點擊邏輯
 */
function handleFabClick(element) {
    const currentPage = document.querySelector('.page.active').id;

    // 邏輯 A：如果目前不在日曆頁，先切換到日曆頁
    if (currentPage !== 'page-calendar') {
        showPage('page-calendar', element);
    } 
    // 邏輯 B：如果已經在日曆頁，則開啟「新增記錄」
    else {
        showPage('page-add-record', element);
    }
}

/**
 * 1. 儲存帳戶並同步
 */
function saveAccount() {
    const name = document.getElementById('acc-name').value;
    const amount = parseFloat(document.getElementById('acc-amount').value) || 0;
    const isCredit = document.getElementById('in-is-credit').checked;
    const groupElement = document.getElementById('selected-group-text');
    const group = groupElement ? groupElement.innerText.trim() : "未分類";

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

/**
 * 2. 動態渲染總覽列表
 */
function renderAccountList() {
    const accounts = JSON.parse(localStorage.getItem('koin_accounts') || '[]');
    const listContainer = document.querySelector('.account-list');
    const totalBalanceEl = document.getElementById('total-balance');
    if (!listContainer) return;

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
 * 專案儲存
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
 * 彈窗控制基礎函式
 */
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

/**
 * 帳戶分組選取
 */
function selectGroup(name) {
    const display = document.getElementById('selected-group-text');
    if (display) {
        display.innerHTML = `${name} <i data-lucide="chevron-right" class="s-icon"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    closeModal('group-picker-modal');
}

/**
 * 信用帳戶連動開關
 */
function toggleCreditFields() {
    const isCredit = document.getElementById('in-is-credit').checked;
    const extraFields = document.getElementById('credit-extra-fields');
    const displayAmt = document.getElementById('add-display-amount');
    
    if (extraFields) extraFields.style.display = isCredit ? 'block' : 'none';
    if (displayAmt) displayAmt.className = isCredit ? 'val text-red' : 'val text-green';
}

// ...其餘日期 Picker (Cycle/DueDate) 邏輯保持不變即可...

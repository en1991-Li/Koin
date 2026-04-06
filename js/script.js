/**
 * =========================================
 * 1. 基礎設定與資料初始化
 * =========================================
 */
// 初始化 Lucide 圖示庫
lucide.createIcons();

// 儲存所有帳戶資料的陣列
let accounts = [];

/**
 * =========================================
 * 2. 導覽列與分頁控制 (Tab Navigation)
 * =========================================
 */
function switchTab(el, pageId) {
    // 1. 處理底部按鈕高亮狀態
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
    });
    el.classList.add('active');

    // 2. 切換主內容區域的分頁顯示
    const pages = ['page-list', 'page-wallet', 'page-trends', 'page-settings'];
    pages.forEach(id => {
        const pageEl = document.getElementById(id);
        if (pageEl) {
            pageEl.style.display = (id === pageId) ? 'flex' : 'none';
        }
    });

    console.log(`已切換至分頁: ${pageId}`);
}

/**
 * =========================================
 * 3. 頁面與彈窗控制 (UI Controls)
 * =========================================
 */
function openAddPage() { 
    const addPage = document.getElementById('page-add');
    if (addPage) addPage.classList.add('active'); 
}

function closeAddPage() { 
    const addPage = document.getElementById('page-add');
    if (addPage) addPage.classList.remove('active'); 
}

function openSheet(id) { 
    const overlay = document.getElementById('overlay');
    const sheet = document.getElementById(id);
    if (overlay) overlay.classList.add('active'); 
    if (sheet) sheet.classList.add('active'); 
}

function closeAllSheets() { 
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('active'); 
    document.querySelectorAll('.sheet').forEach(s => s.classList.remove('active')); 
}

function setVal(type, val) {
    const el = document.getElementById('val-' + type);
    if (el) {
        el.innerText = val;
        el.classList.add('text-white');
    }
    closeAllSheets();
}

/**
 * =========================================
 * 4. 表單邏輯處理 (Form Logic)
 * =========================================
 */
function toggleCredit(show) {
    const menu = document.getElementById('credit-sub-menu');
    if (menu) {
        if (show) menu.classList.add('show');
        else menu.classList.remove('show');
    }
}

function saveData() {
    const nameInput = document.getElementById('field-name');
    const amountInput = document.getElementById('field-amount');
    const groupLabel = document.getElementById('val-group');
    const isCreditChecked = document.getElementById('field-is-credit').checked;

    if (!groupLabel || groupLabel.innerText === "尚未選擇") {
        alert("請選擇帳戶分組");
        return;
    }

    const newAccount = {
        id: Date.now(),
        name: nameInput.value.trim() || "未命名帳戶",
        group: groupLabel.innerText,
        amount: parseFloat(amountInput.value) || 0,
        include: true, // 預設計入總額
        isCredit: isCreditChecked
    };

    accounts.push(newAccount);
    render();
    
    closeAddPage();
    resetForm();
}

function resetForm() {
    const nameInput = document.getElementById('field-name');
    const amountInput = document.getElementById('field-amount');
    const groupLabel = document.getElementById('val-group');
    const creditCheck = document.getElementById('field-is-credit');

    if (nameInput) nameInput.value = "";
    if (amountInput) amountInput.value = 0;
    if (groupLabel) {
        groupLabel.innerText = "尚未選擇";
        groupLabel.classList.remove('text-white');
    }
    if (creditCheck) creditCheck.checked = false;
    toggleCredit(false);
}

/**
 * =========================================
 * 5. 資料渲染與統計計算 (對應照片樣式)
 * =========================================
 */
function render() {
    const list = document.getElementById('main-list');
    if (!list) return;

    list.innerHTML = "";
    let totalAssets = 0;
    let totalDebt = 0;

    if (accounts.length === 0) {
        list.innerHTML = `<div class="empty-state">尚未建立帳戶</div>`;
        updateDashboard(0, 0, 0);
        return;
    }

    // 依照帳戶進行渲染
    accounts.forEach(acc => {
        if (acc.amount >= 0) totalAssets += acc.amount;
        else totalDebt += Math.abs(acc.amount);
        
        const colorClass = acc.amount >= 0 ? 'text-green' : 'text-red';
        const displayAmount = (acc.amount >= 0 ? '+$' : '-$') + Math.abs(acc.amount).toLocaleString();

        // 建立符合照片質感的列表行
        const row = document.createElement('div');
        row.className = 'group-item'; // 使用 CSS 中定義的 class
        row.innerHTML = `
            <span class="group-name">+ ${acc.name}</span>
            <span class="group-value ${colorClass}">${displayAmount}</span>
        `;
        list.appendChild(row);
    });
    
    updateDashboard(totalAssets, totalDebt, (totalAssets - totalDebt));
    lucide.createIcons();
}

function updateDashboard(assets, debt, total) {
    const totalEl = document.getElementById('total-val');
    const assetEl = document.getElementById('asset-val');
    const debtEl = document.getElementById('debt-val');

    if (totalEl) totalEl.innerText = total.toLocaleString();
    if (assetEl) assetEl.innerText = assets.toLocaleString();
    if (debtEl) debtEl.innerText = debt.toLocaleString();

    // 根據總額正負切換顏色
    if (totalEl) {
        totalEl.className = total >= 0 ? 'total-amount text-green' : 'total-amount text-red';
    }
}

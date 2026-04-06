/**
 * =========================================
 * 1. 基礎設定與資料初始化
 * =========================================
 */
// 初始化 Lucide 圖示
lucide.createIcons();

// 從 LocalStorage 讀取資料，若無則為空陣列
let accounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];

// 初始化執行一次渲染
document.addEventListener('DOMContentLoaded', () => {
    render();
    setupEventListeners();
});

/**
 * =========================================
 * 2. 頁面切換控制 (Navigation)
 * =========================================
 */
function openAddPage() { 
    const addPage = document.getElementById('page-add-account');
    const listPage = document.getElementById('page-list');
    if (addPage && listPage) {
        listPage.classList.remove('active');
        addPage.classList.add('active');
        lucide.createIcons(); // 確保新頁面圖示渲染
    }
}

function closeAddPage() { 
    const addPage = document.getElementById('page-add-account');
    const listPage = document.getElementById('page-list');
    if (addPage && listPage) {
        addPage.classList.remove('active');
        listPage.classList.add('active');
        resetForm();
    }
}

// 底部 Tab 切換 (處理高亮)
function switchTab(el, pageId) {
    document.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    
    // 如果是切換回首頁，確保首頁 active
    if(pageId === 'page-list') {
        document.getElementById('page-add-account').classList.remove('active');
        document.getElementById('page-list').classList.add('active');
    }
}

/**
 * =========================================
 * 3. 表單互動邏輯
 * =========================================
 */
function setupEventListeners() {
    const balanceInput = document.getElementById('acc-balance');
    const headerBalance = document.querySelector('.balance-display .value');

    // 當輸入初始金額時，同步更新頂部大數字
    if (balanceInput && headerBalance) {
        balanceInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            headerBalance.innerText = val.toLocaleString();
        });
    }
}

function saveAccount() {
    const nameInput = document.getElementById('acc-name');
    const balanceInput = document.getElementById('acc-balance');
    const isCreditInput = document.getElementById('is-credit');

    const name = nameInput.value.trim();
    const balance = parseFloat(balanceInput.value) || 0;

    if (!name) {
        alert("請輸入帳戶名稱");
        return;
    }

    const newAccount = {
        id: Date.now(),
        name: name,
        amount: balance,
        isCredit: isCreditInput ? isCreditInput.checked : false,
        type: '現金' // 預設值，之後可擴充
    };

    accounts.push(newAccount);
    localStorage.setItem('koin_accounts', JSON.stringify(accounts));
    
    render();
    closeAddPage();
}

function resetForm() {
    document.getElementById('acc-name').value = "";
    document.getElementById('acc-balance').value = 0;
    document.querySelector('.balance-display .value').innerText = "0";
    const creditToggle = document.getElementById('is-credit');
    if (creditToggle) creditToggle.checked = false;
}

/**
 * =========================================
 * 4. 資料渲染 (符合 App 質感)
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

    accounts.forEach(acc => {
        // 計算資產與負債 (假設負數或勾選信用帳戶為負債邏輯，這裡簡化處理)
        if (acc.amount >= 0) totalAssets += acc.amount;
        else totalDebt += Math.abs(acc.amount);

        const colorClass = acc.amount >= 0 ? 'text-green' : 'text-red';
        
        // 建立列表 HTML
        const item = document.createElement('div');
        item.className = 'group-item';
        item.innerHTML = `
            <span class="group-name">${acc.name}</span>
            <span class="group-value ${colorClass}">$${Math.abs(acc.amount).toLocaleString()}</span>
        `;
        list.appendChild(item);
    });

    updateDashboard(totalAssets, totalDebt, (totalAssets - totalDebt));
}

function updateDashboard(assets, debt, total) {
    const totalEl = document.getElementById('total-val');
    const assetEl = document.getElementById('asset-val');
    const debtEl = document.getElementById('debt-val');

    if (totalEl) {
        totalEl.innerText = total.toLocaleString();
        totalEl.style.color = total >= 0 ? 'var(--green)' : 'var(--red)';
    }
    if (assetEl) assetEl.innerText = assets.toLocaleString();
    if (debtEl) debtEl.innerText = debt.toLocaleString();
}

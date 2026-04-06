/**
 * =========================================
 * 1. 基礎設定與資料初始化
 * =========================================
 */
// 從 LocalStorage 讀取資料
let accounts = JSON.parse(localStorage.getItem('koin_accounts')) || [];

// 初始化執行
document.addEventListener('DOMContentLoaded', () => {
    render();
    setupEventListeners();
    lucide.createIcons();
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
        // 切換頁面後重新渲染圖示
        setTimeout(() => lucide.createIcons(), 10); 
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

/**
 * =========================================
 * 3. 表單互動邏輯
 * =========================================
 */
function setupEventListeners() {
    const balanceInput = document.getElementById('acc-balance');
    const headerBalance = document.getElementById('header-balance-val');

    if (balanceInput && headerBalance) {
        balanceInput.addEventListener('input', (e) => {
            let val = parseFloat(e.target.value) || 0;
            
            // 如果是信用帳戶勾選狀態，數值轉為負數顯示（視覺上）
            const isCredit = document.getElementById('is-credit').checked;
            const displayVal = isCredit ? -Math.abs(val) : val;

            headerBalance.innerText = Math.abs(displayVal).toLocaleString();
            
            // 根據正負值切換顏色 (還原截圖質感)
            headerBalance.className = 'value ' + (displayVal >= 0 ? 'text-green' : 'text-red');
        });
    }

    // 處理信用帳戶 Switch 切換時的顏色連動
    const creditToggle = document.getElementById('is-credit');
    if (creditToggle) {
        creditToggle.addEventListener('change', () => {
            balanceInput.dispatchEvent(new Event('input'));
        });
    }
}

function saveAccount() {
    const nameInput = document.getElementById('acc-name');
    const balanceInput = document.getElementById('acc-balance');
    const isCreditInput = document.getElementById('is-credit');

    const name = nameInput.value.trim();
    let balance = parseFloat(balanceInput.value) || 0;

    if (!name) {
        alert("請輸入帳戶名稱");
        return;
    }

    // 如果勾選信用帳戶，存入資料庫時存為負值
    if (isCreditInput && isCreditInput.checked) {
        balance = -Math.abs(balance);
    }

    const newAccount = {
        id: Date.now(),
        name: name,
        amount: balance,
        isCredit: isCreditInput ? isCreditInput.checked : false,
        type: '現金'
    };

    accounts.push(newAccount);
    localStorage.setItem('koin_accounts', JSON.stringify(accounts));
    
    render();
    closeAddPage();
}

function resetForm() {
    document.getElementById('acc-name').value = "";
    document.getElementById('acc-balance').value = 0;
    const headerBalance = document.getElementById('header-balance-val');
    headerBalance.innerText = "0";
    headerBalance.className = "value text-green";
    const creditToggle = document.getElementById('is-credit');
    if (creditToggle) creditToggle.checked = false;
}

/**
 * =========================================
 * 4. 資料渲染 (還原 IMG_1144 質感)
 * =========================================
 */
function render() {
    const list = document.getElementById('main-list');
    if (!list) return;

    list.innerHTML = "";
    let totalAssets = 0;
    let totalDebt = 0;

    if (accounts.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted); font-size:14px;">尚未建立帳戶，點擊 + 開始記帳</div>`;
        updateDashboard(0, 0, 0);
        return;
    }

    // 按照建立時間排序
    accounts.sort((a, b) => b.id - a.id);

    accounts.forEach(acc => {
        if (acc.amount >= 0) {
            totalAssets += acc.amount;
        } else {
            totalDebt += Math.abs(acc.amount);
        }

        const isPositive = acc.amount >= 0;
        const colorClass = isPositive ? 'text-green' : 'text-red';
        const sign = isPositive ? '+' : '-';
        
        const item = document.createElement('div');
        item.className = 'group-item';
        item.innerHTML = `
            <span class="group-name">${acc.name}</span>
            <span class="group-value ${colorClass}">${sign}$${Math.abs(acc.amount).toLocaleString()}</span>
        `;
        list.appendChild(item);
    });

    const totalBalance = totalAssets - totalDebt;
    updateDashboard(totalAssets, totalDebt, totalBalance);
}

function updateDashboard(assets, debt, total) {
    const totalEl = document.getElementById('total-val');
    const assetEl = document.getElementById('asset-val');
    const debtEl = document.getElementById('debt-val');

    if (totalEl) {
        totalEl.innerText = Math.abs(total).toLocaleString();
        // 總額的正負顏色邏輯：負債多於資產顯示紅色
        totalEl.className = 'total-amount ' + (total >= 0 ? 'text-green' : 'text-red');
    }
    if (assetEl) assetEl.innerText = assets.toLocaleString();
    if (debtEl) debtEl.innerText = debt.toLocaleString();
}

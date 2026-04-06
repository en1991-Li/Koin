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
    // 假設您的 HTML 中有對應 ID 的 page 元素
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
// 開啟「新增帳戶」全螢幕頁面
function openAddPage() { 
    const addPage = document.getElementById('page-add');
    if (addPage) addPage.classList.add('active'); 
}

// 關閉「新增帳戶」全螢幕頁面
function closeAddPage() { 
    const addPage = document.getElementById('page-add');
    if (addPage) addPage.classList.remove('active'); 
}

// 開啟底部抽屜 (如：選擇分組、選擇日期)
function openSheet(id) { 
    document.getElementById('overlay').classList.add('active'); 
    document.getElementById(id).classList.add('active'); 
}

// 關閉所有半透明遮罩與抽屜
function closeAllSheets() { 
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.remove('active'); 
    document.querySelectorAll('.sheet').forEach(s => s.classList.remove('active')); 
}

// 設定抽屜選擇後的值
function setVal(type, val) {
    const el = document.getElementById('val-' + type);
    if (el) {
        el.innerText = val;
        el.classList.add('text-white'); // 變更顏色表示已選取
    }
    closeAllSheets();
}

/**
 * =========================================
 * 4. 表單邏輯處理 (Form Logic)
 * =========================================
 */
// 切換信用卡選單的展開/收合
function toggleCredit(show) {
    const menu = document.getElementById('credit-sub-menu');
    if (menu) {
        if (show) menu.classList.add('show');
        else menu.classList.remove('show');
    }
}

// 儲存帳戶資料
function saveData() {
    const nameInput = document.getElementById('field-name');
    const amountInput = document.getElementById('field-amount');
    const groupLabel = document.getElementById('val-group');
    const isCreditChecked = document.getElementById('field-is-credit').checked;

    // 基本驗證
    if (groupLabel.innerText === "尚未選擇") {
        alert("請選擇帳戶分組");
        return;
    }

    // 建立帳戶物件
    const newAccount = {
        id: Date.now(),
        name: nameInput.value.trim() || "未命名帳戶",
        group: groupLabel.innerText,
        amount: parseFloat(amountInput.value) || 0,
        include: document.getElementById('field-include').checked,
        isCredit: isCreditChecked,
        cycle: isCreditChecked ? document.getElementById('val-cycle').innerText : null,
        dueDate: isCreditChecked ? document.getElementById('val-due-date').innerText : null
    };

    // 存入陣列並渲染
    accounts.push(newAccount);
    render();
    
    // 關閉頁面並清空
    closeAddPage();
    resetForm();
}

// 重置新增表單內容
function resetForm() {
    document.getElementById('field-name').value = "";
    document.getElementById('field-amount').value = 0;
    document.getElementById('val-group').innerText = "尚未選擇";
    document.getElementById('val-group').classList.remove('text-white');
    document.getElementById('field-is-credit').checked = false;
    toggleCredit(false);
}

/**
 * =========================================
 * 5. 資料渲染與統計計算 (Render & Stats)
 * =========================================
 */
function render() {
    const list = document.getElementById('main-list');
    if (!list) return;

    list.innerHTML = "";
    let totalAssets = 0;
    let totalDebt = 0;

    if (accounts.length === 0) {
        list.innerHTML = `<div class="p-20 text-center text-gray-600 italic">尚未建立帳戶</div>`;
    }

    accounts.forEach(acc => {
        // 1. 計算金額邏輯
        if (acc.include) {
            if (acc.amount >= 0) totalAssets += acc.amount;
            else totalDebt += Math.abs(acc.amount);
        }
        
        // 2. 決定圖示與樣式
        const iconName = acc.isCredit ? 'credit-card' : 'wallet';
        const colorClass = acc.amount >= 0 ? 'text-emerald-400' : 'text-rose-400';

        // 3. 產生 HTML 結構
        list.innerHTML += `
            <div class="flex justify-between items-center p-5 border-b border-[#32324d] animate-fade-in">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-[#2b2b3d] rounded-xl flex items-center justify-center border border-white/5">
                        <i data-lucide="${iconName}" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-100">${acc.name}</p>
                        <p class="text-[10px] text-gray-500 uppercase font-black tracking-widest">${acc.group}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-mono font-bold text-lg ${colorClass}">
                        ${acc.amount.toLocaleString()}
                    </p>
                </div>
            </div>
        `;
    });
    
    // 4. 更新頂部儀表板統計數字
    document.getElementById('asset-val').innerText = totalAssets.toLocaleString();
    document.getElementById('debt-val').innerText = totalDebt.toLocaleString();
    document.getElementById('total-val').innerText = (totalAssets - totalDebt).toLocaleString();
    
    // 5. 重新渲染 Lucide 圖示
    lucide.createIcons();
}

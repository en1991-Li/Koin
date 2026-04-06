/**
 * 1. 基礎設定與初始化
 */
lucide.createIcons();
let accounts = [];

/**
 * 2. 導覽與頁面控制
 */
function switchTab(el, pageId) {
    // 移除所有 Tab 的高亮狀態
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
    });
    // 為當前點擊的 Tab 加上亮藍色
    el.classList.add('active');
    
    // 切換顯示的頁面
    const pages = ['page-list', 'page-wallet', 'page-trends', 'page-settings'];
    pages.forEach(id => {
        const pageEl = document.getElementById(id);
        if (pageEl) {
            pageEl.style.display = (id === pageId) ? 'flex' : 'none';
        }
    });

    console.log("導航至：" + pageId);
}

// 彈出式「新增頁面」控制
function openAddPage() { 
    document.getElementById('page-add').classList.add('active'); 
}

function closeAddPage() { 
    document.getElementById('page-add').classList.remove('active'); 
}

/**
 * 3. 抽屜式選單 (Sheets) 控制
 */
function openSheet(id) { 
    document.getElementById('overlay').classList.add('active'); 
    document.getElementById(id).classList.add('active'); 
}

function closeAllSheets() { 
    document.getElementById('overlay').classList.remove('active'); 
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
 * 4. 資料處理邏輯
 */
function toggleCredit(show) {
    const menu = document.getElementById('credit-sub-menu');
    if (menu) {
        menu.classList.toggle('show', show);
    }
}

function saveData() {
    const name = document.getElementById('field-name').value.trim() || "未命名帳戶";
    const group = document.getElementById('val-group').innerText;
    const amount = parseFloat(document.getElementById('field-amount').value) || 0;
    const include = document.getElementById('field-include').checked;
    
    const isCredit = document.getElementById('field-is-credit').checked;
    const cycle = isCredit ? document.getElementById('val-cycle').innerText : null;
    const dueDate = isCredit ? document.getElementById('val-due-date').innerText : null;

    if (group === "尚未選擇") {
        return alert("請選擇帳戶分組");
    }

    accounts.push({
        id: Date.now(),
        name, group, amount, include, isCredit, cycle, dueDate
    });
    
    render();
    closeAddPage();
    resetForm();
}

/**
 * 5. UI 渲染與統計
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
        if (acc.include) {
            if (acc.amount >= 0) totalAssets += acc.amount;
            else totalDebt += Math.abs(acc.amount);
        }
        
        const iconName = acc.isCredit ? 'credit-card' : 'wallet';
        const amountClass = acc.amount >= 0 ? 'text-emerald-400' : 'text-rose-400';

        list.innerHTML += `
            <div class="flex justify-between items-center p-5 border-b border-[#32324d] animate-fade-in">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-[#2b2b3d] rounded-xl flex items-center justify-center border border-white/5">
                        <i data-lucide="${iconName}" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-100">${acc.name}</p>
                        <p class="text-[9px] text-gray-500 uppercase tracking-tighter">${acc.group}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-mono font-bold text-lg ${amountClass}">
                        ${acc.amount.toLocaleString()}
                    </p>
                </div>
            </div>`;
    });
    
    // 更新頂部儀表板
    document.getElementById('asset-val').innerText = totalAssets.toLocaleString();
    document.getElementById('debt-val').innerText = totalDebt.toLocaleString();
    document.getElementById('total-val').innerText = (totalAssets - totalDebt).toLocaleString();
    
    lucide.createIcons();
}

function resetForm() {
    const fields = ['field-name', 'field-amount'];
    fields.forEach(f => document.getElementById(f).value = (f === 'field-amount' ? 0 : ""));
    document.getElementById('val-group').innerText = "尚未選擇";
    document.getElementById('field-is-credit').checked = false;
    toggleCredit(false);
}

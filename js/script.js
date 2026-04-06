// 初始化 Lucide 圖示
lucide.createIcons();

// 儲存帳戶資料的陣列
let accounts = [];

/**
 * 頁面與彈窗控制
 */
function openAddPage() { 
    document.getElementById('page-add').classList.add('active'); 
}

function closeAddPage() { 
    document.getElementById('page-add').classList.remove('active'); 
}

function openSheet(id) { 
    document.getElementById('overlay').classList.add('active'); 
    document.getElementById(id).classList.add('active'); 
}

function closeAllSheets() { 
    document.getElementById('overlay').classList.remove('active'); 
    document.querySelectorAll('.sheet').forEach(s => s.classList.remove('active')); 
}

/**
 * 設定選擇器的值 (分組、結帳日等)
 */
function setVal(type, val) {
    const el = document.getElementById('val-' + type);
    el.innerText = val;
    el.classList.add('text-white'); // 變更顏色代表已選擇
    closeAllSheets();
}

/**
 * 切換信用卡子選單顯示
 */
function toggleCredit(show) {
    const menu = document.getElementById('credit-sub-menu');
    if (show) {
        menu.classList.add('show');
    } else {
        menu.classList.remove('show');
    }
}

/**
 * 底部導覽列切換效果
 */
function switchTab(el, pageId) {
    // 移除所有項目的 active 類別
    document.querySelectorAll('.tab-item').forEach(item => {
        item.classList.remove('active');
    });
    // 為點擊的項目加上 active
    el.classList.add('active');
    
    // 如果有其他分頁邏輯可在此觸發
    console.log("切換至：" + pageId);
}

/**
 * 儲存資料並重新渲染
 */
function saveData() {
    // 讀取輸入欄位
    const name = document.getElementById('field-name').value.trim() || "未命名帳戶";
    const group = document.getElementById('val-group').innerText;
    const amount = parseFloat(document.getElementById('field-amount').value) || 0;
    const include = document.getElementById('field-include').checked;
    
    // 信用卡相關資訊
    const isCredit = document.getElementById('field-is-credit').checked;
    const cycle = isCredit ? document.getElementById('val-cycle').innerText : null;
    const dueDate = isCredit ? document.getElementById('val-due-date').innerText : null;

    // 驗證
    if (group === "尚未選擇") {
        return alert("請選擇帳戶分組");
    }

    // 存入陣列
    const newAccount = {
        id: Date.now(),
        name,
        group,
        amount,
        include,
        isCredit,
        cycle,
        dueDate
    };

    accounts.push(newAccount);
    
    // 更新 UI
    render();
    closeAddPage();
    resetForm();
}

/**
 * 重置新增頁面的表單
 */
function resetForm() {
    document.getElementById('field-name').value = "";
    document.getElementById('field-amount').value = 0;
    document.getElementById('preview-amt').innerText = "0";
    document.getElementById('val-group').innerText = "尚未選擇";
    document.getElementById('val-group').classList.remove('text-white');
    document.getElementById('field-is-credit').checked = false;
    toggleCredit(false);
}

/**
 * 渲染帳戶列表與計算總額
 */
function render() {
    const list = document.getElementById('main-list');
    list.innerHTML = "";
    
    let totalAssets = 0;
    let totalDebt = 0;

    if (accounts.length === 0) {
        list.innerHTML = `<div class="p-20 text-center text-gray-600 italic">尚未建立帳戶</div>`;
    }

    accounts.forEach(acc => {
        // 計算總額 (僅計算納入總餘額的項目)
        if (acc.include) {
            if (acc.amount >= 0) {
                totalAssets += acc.amount;
            } else {
                totalDebt += Math.abs(acc.amount);
            }
        }
        
        // 信用卡專屬資訊字串
        const infoText = acc.isCredit 
            ? `<p class="text-[9px] text-blue-400 mt-1 font-medium">結帳: ${acc.cycle} | 截止: ${acc.dueDate}</p>` 
            : "";
            
        // 根據類型選擇圖示
        const iconName = acc.isCredit ? 'credit-card' : 'wallet';

        // 產生 HTML
        list.innerHTML += `
            <div class="flex justify-between items-center p-5 border-b border-[#32324d] animate-fade-in">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-[#2b2b3d] rounded-xl flex items-center justify-center border border-white/5">
                        <i data-lucide="${iconName}" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-100">${acc.name}</p>
                        <p class="text-[9px] text-gray-500 uppercase font-black tracking-tighter">${acc.group}</p>
                        ${infoText}
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-mono font-bold text-lg ${acc.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}">
                        ${acc.amount >= 0 ? '' : '-'}${Math.abs(acc.amount).toLocaleString()}
                    </p>
                </div>
            </div>
        `;
    });
    
    // 更新上方的統計數據
    document.getElementById('asset-val').innerText = totalAssets.toLocaleString();
    document.getElementById('debt-val').innerText = totalDebt.toLocaleString();
    document.getElementById('total-val').innerText = (totalAssets - totalDebt).toLocaleString();
    
    // 重新驅動 Lucide 圖示渲染
    lucide.createIcons();
}

/**
 * Koin 核心邏輯整合 - script.js
 */

 // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // 初始切換到首頁，確保狀態同步
        showPage('page-overview', document.querySelector('.tab-item'));
    });


// 頁面切換核心
function showPage(pageId, element) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');

    // 標亮 Tab
    document.querySelectorAll('.tab-item, .tab-fab').forEach(tab => tab.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    } else {
        const autoTab = document.querySelector(`.tab-bar [onclick*="${pageId}"]`);
        if (autoTab) autoTab.classList.add('active');
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

    // 這些與數據處理相關的邏輯，建議之後移入 script.js 以便管理
    function saveAccount() {
        const name = document.getElementById('acc-name').value;
        const amount = document.getElementById('acc-amount').value;
        if(!name) return alert("請輸入帳戶名稱");
        
        console.log("儲存帳戶:", { name, amount });
        showPage('page-overview');
    }

   // 彈窗控制
  function openModal(id) { document.getElementById(id).style.display = 'flex'; }
  function closeModal(id) { document.getElementById(id).style.display = 'none'; }

   // 帳戶分組選取
   function selectGroup(name) {
    const display = document.getElementById('selected-group-text');
    if (display) {
        display.innerHTML = `${name} <i data-lucide="chevron-right" class="s-icon"></i>`;
        lucide.createIcons();
    }
    closeModal('group-picker-modal');
}



// 開啟帳戶分組彈窗 (對應 HTML 裡的 onclick="openGroupPicker()")
function openGroupPicker() {
    openModal('group-picker-modal');
}

// 開啟繳款期限彈窗 (對應 HTML 裡的 onclick="openDueDateModal()")
function openDueDateModal() {
    // 這裡我們共用 cycle-picker-modal 的邏輯，或者你可以建立專屬的 due-date-modal
    // 暫時將其導向週期選擇，或根據你的 HTML 結構調整
    openModal('cycle-picker-modal');
    
    // 更改彈窗標題為「繳款期限」以利區分
    const header = document.querySelector('#cycle-picker-modal .modal-header');
    if (header) header.innerText = "繳款期限";
}

function updateCycleText(val) {
    const rangeDisplay = document.getElementById('modal-date-range');
    const noteDisplay = document.getElementById('modal-cycle-note');
    
    // 取得當前年份與月份 (也可以從你頁面上的 2026/04 抓取)
    const now = new Date();
    const year = 2026; // 建議從 id="full-calendar-month" 抓取
    const month = 4;    // 4月
    
    let startDate, endDate, cycleText;

    if (val == 31) {
        // 每月月底的情況
        startDate = `${year}/${String(month).padStart(2, '0')}/01`;
        endDate = `${year}/${String(month).padStart(2, '0')}/30`; // 4月只有30天
        cycleText = "每月月底";
    } else {
        // 指定日期的情況 (例如 12 號，區間可能是 03/13 - 04/12)
        const day = parseInt(val);
        cycleText = `每月 ${day} 號`;
        
        // 簡單邏輯：顯示當月的區間
        // 若要完全模仿影片，需計算「前一個月的 day+1」到「當月的 day」
        const prevMonth = month - 1;
        startDate = `${year}/${String(prevMonth).padStart(2, '0')}/${String(day + 1).padStart(2, '0')}`;
        endDate = `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    }

    if (rangeDisplay) rangeDisplay.innerText = `${startDate} – ${endDate}`;
    if (noteDisplay) noteDisplay.innerText = `帳單結帳日：${cycleText}`;
}

// 修正 confirmCycle 確保同步更新
function confirmCycle() {
    const val = document.getElementById('cycle-slider').value;
    const displayText = (val == 31) ? "每月月底" : `每月 ${val} 號`;
    
    const modal = document.getElementById('cycle-picker-modal');
    const targetId = (modal.dataset.mode === 'dueDate') ? 'due-date-display' : 'main-cycle-display';
    
    const displayElement = document.getElementById(targetId);
    if (displayElement) {
        displayElement.innerHTML = `${displayText} <i data-lucide="chevron-right" class="s-icon"></i>`;
    }

    lucide.createIcons();
    closeModal('cycle-picker-modal');
}


    // 重置狀態
    modal.dataset.mode = '';
    modal.querySelector('.modal-header').innerText = "帳單週期";
    
  
// 確保 openCyclePicker 也正常運作
function openCyclePicker() {
    const modal = document.getElementById('cycle-picker-modal');
    modal.dataset.mode = 'cycle';
    modal.querySelector('.modal-header').innerText = "帳單週期";
    openModal('cycle-picker-modal');
}


// 信用帳戶聯動
function toggleCreditFields() {
    const isCredit = document.getElementById('in-is-credit').checked;
    const extraFields = document.getElementById('credit-extra-fields');
    const displayAmount = document.getElementById('add-display-amount');
    
    if (extraFields) extraFields.style.display = isCredit ? 'block' : 'none';
    if (displayAmount) {
        displayAmount.className = isCredit ? 'val text-red' : 'val text-green';
    }
}

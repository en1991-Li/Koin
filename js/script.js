/**
 * Koin 核心邏輯整合 - script.js
 */

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

// 週期選擇滑桿
function updateCycleText(val) {
    const rangeDisplay = document.getElementById('modal-cycle-range');
    const noteDisplay = document.getElementById('modal-cycle-note');
    const text = (val == 31) ? "每月月底" : `每月 ${val} 號`;
    if(rangeDisplay) rangeDisplay.innerText = text;
    if(noteDisplay) noteDisplay.innerText = `帳單結帳日：${text}`;
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

/**
 * 修正後的 confirmCycle
 * 讓它能判斷現在是在設定「帳單週期」還是「繳款期限」
 */
function confirmCycle() {
    const val = document.getElementById('cycle-slider').value;
    const displayText = (val == 31) ? "每月月底" : `每月 ${val} 號`;
    
    const header = document.querySelector('#cycle-picker-modal .modal-header');
    
    if (header && header.innerText === "繳款期限") {
        // 更新繳款期限顯示
        const dueDateDisplay = document.getElementById('due-date-display');
        if (dueDateDisplay) {
            dueDateDisplay.innerHTML = `${displayText} <i data-lucide="chevron-right" class="s-icon"></i>`;
        }
    } else {
        // 更新帳單週期顯示
        const mainDisplay = document.getElementById('main-cycle-display');
        if (mainDisplay) {
            mainDisplay.innerHTML = `${displayText} <i data-lucide="chevron-right" class="s-icon"></i>`;
        }
    }

    lucide.createIcons();
    closeModal('cycle-picker-modal');
    
    // 恢復標題預設值，避免下次開啟出錯
    if (header) header.innerText = "帳單週期";
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

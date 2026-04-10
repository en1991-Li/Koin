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

function confirmCycle() {
    const val = document.getElementById('cycle-slider').value;
    const displayText = (val == 31) ? "每月月底" : `每月 ${val} 號`;
    const mainDisplay = document.getElementById('main-cycle-display');
    if(mainDisplay) {
        mainDisplay.innerHTML = `${displayText} <i data-lucide="chevron-right" class="s-icon"></i>`;
        lucide.createIcons();
    }
    closeModal('cycle-picker-modal');
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

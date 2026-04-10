/** * Koin 核心邏輯整合版
 */

// 1. 分頁控制
function showPage(pageId, element) {
    // 隱藏所有頁面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // 顯示目標頁
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');

    // 標亮導覽列
    document.querySelectorAll('.tab-item, .tab-fab').forEach(tab => tab.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    } else {
        const autoTab = document.querySelector(`.tab-bar [onclick*="${pageId}"]`);
        if (autoTab) autoTab.classList.add('active');
    }
    
    // 重新渲染圖示
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// 2. 彈窗通用控制
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// 3. 帳戶分組選取
function selectGroup(name) {
    const display = document.getElementById('selected-group-text');
    if (display) {
        display.innerHTML = `${name} <i data-lucide="chevron-right" class="s-icon"></i>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
    closeModal('group-picker-modal');
}

// 4. 信用帳戶欄位聯動
function toggleCreditFields() {
    const isCredit = document.getElementById('in-is-credit').checked;
    const extraFields = document.getElementById('credit-extra-fields');
    const displayAmount = document.getElementById('add-display-amount');
    
    if (extraFields) extraFields.style.display = isCredit ? 'block' : 'none';
    if (displayAmount) {
        displayAmount.className = isCredit ? 'val text-red' : 'val text-green';
    }
}

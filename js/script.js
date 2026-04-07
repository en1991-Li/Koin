/**
 * Koin 記帳 App 完整邏輯控制
 * 整合：頁面切換、帳戶分組彈窗、信用帳戶聯動、日期與週期處理
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化 Lucide 圖示
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // 2. 初始化圖表
    initOverviewChart();

    // 3. 監聽帳單週期變更 (連動繳款期限)
    const cycleSelect = document.querySelector('.form-select');
    if (cycleSelect) {
        cycleSelect.addEventListener('change', (e) => {
            console.log("當前選擇的帳單週期為:", e.target.value);
            // 可以在此加入邏輯：若選擇下個月週期，自動調整繳款期限日期
        });
    }
});

// =========================================
// 1. 頁面切換邏輯
// =========================================
function showPage(pageId) {
    // 隱藏所有頁面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 顯示目標頁面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        // 重新渲染新頁面中的圖示 (確保圖示顯示正常)
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// =========================================
// 2. 帳戶分組選擇邏輯
// =========================================
function openGroupPicker() {
    const modal = document.getElementById('group-picker-modal');
    if (modal) modal.style.display = 'flex';
}

function closeGroupPicker() {
    const modal = document.getElementById('group-picker-modal');
    if (modal) modal.style.display = 'none';
}

function selectGroup(groupName) {
    const textElement = document.getElementById('selected-group-text');
    if (textElement) {
        // 更新文字並保留右側箭頭圖示
        textElement.innerHTML = `${groupName} <i data-lucide="chevron-right" class="s-icon"></i>`;
        lucide.createIcons();
    }
    
    // 自動判斷：如果選了「信用卡」，主動勾選信用帳戶開關
    const creditSwitch = document.getElementById('in-is-credit');
    if (groupName === '信用卡' && creditSwitch && !creditSwitch.checked) {
        creditSwitch.checked = true;
        toggleCreditFields();
    }
    
    closeGroupPicker();
}

// =========================================
// 3. 信用帳戶聯動邏輯
// =========================================
function toggleCreditFields() {
    const isCreditCheckbox = document.getElementById('in-is-credit');
    const creditExtraFields = document.getElementById('credit-extra-fields');
    const displayAmount = document.getElementById('add-display-amount');
    const dateInput = document.querySelector('.form-date');

    if (!isCreditCheckbox || !creditExtraFields || !displayAmount) return;

    if (isCreditCheckbox.checked) {
        // 顯示隱藏欄位 (繳款期限、信用額度)
        creditExtraFields.style.display = 'block';
        
        // 信用帳戶代表負債，餘額顯示為紅色
        displayAmount.classList.replace('text-green', 'text-red');

        // 自動預設日期為 2026-05-01 (若目前為空)
        if (dateInput && !dateInput.value) {
            dateInput.value = "2026-05-01";
        }
    } else {
        // 隱藏欄位並恢復綠色
        creditExtraFields.style.display = 'none';
        displayAmount.classList.replace('text-red', 'text-green');
    }
}

// =========================================
// 4. 圖表初始化 (預留介面)
// =========================================
function initOverviewChart() {
    const canvas = document.getElementById('overviewChart');
    if (!canvas) return;
    // 此處未來可接入 Chart.js
    console.log("Overview chart initialized.");
}

// =========================================
// 5. 儲存與驗證
// =========================================
function handleAccountSubmit() {
    const nameInput = document.querySelector('input[placeholder="尚未設定"]');
    const balanceInput = document.querySelector('input[type="number"]');
    
    if (!nameInput.value) {
        alert("請輸入帳戶名稱");
        return;
    }

    // 模擬存檔邏輯
    const accountData = {
        name: nameInput.value,
        balance: balanceInput.value,
        isCredit: document.getElementById('in-is-credit').checked,
        dueDate: document.querySelector('.form-date')?.value || null
    };

    console.log("儲存數據:", accountData);
    alert("帳戶「" + accountData.name + "」已成功新增");
    
    // 返回總覽頁
    showPage('page-overview');
}

// 預設當前系統月份
let currentTrendsDate = new Date();

/**
 * 切換報表月份 (+1 或 -1 個月)
 */
function changeTrendsMonth(dir) {
    currentTrendsDate.setMonth(currentTrendsDate.getMonth() + dir);
    renderTrendsPage();
}

/**
 * 點擊次級頁籤
 */
function switchTrendsTab(tabName, el) {
    document.querySelectorAll('.trends-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
}

/**
 * 每月報表核心渲染引擎 (已加入月份嚴格過濾)
 */
function renderTrendsPage() {
    const rangeEl = document.getElementById('trends-date-range');
    if (!rangeEl) return;

    const year = currentTrendsDate.getFullYear();
    const month = currentTrendsDate.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    const padMonth = String(month).padStart(2, '0');
    
    // 更新頂部日期區間文字
    rangeEl.innerText = `${year}/${padMonth}/01 － ${year}/${padMonth}/${lastDay}`;

    // 1. 取得所有紀錄並嚴格過濾出「當前選中月份」的紀錄
    const allRecords = JSON.parse(localStorage.getItem('koin_records') || '[]');
    const targetMonthPrefix = `${year}/${padMonth}`;
    const targetMonthPrefixAlt = `${year}/${month}/`; // 兼容無補零格式

    const records = allRecords.filter(r => {
        if (!r.date) return false;
        const normalizedDate = r.date.replace(/-/g, '/');
        return normalizedDate.startsWith(targetMonthPrefix) || normalizedDate.startsWith(targetMonthPrefixAlt);
    });

    let outTotal = 0, outCount = 0;
    let inTotal = 0, inCount = 0;
    let transferOutTotal = 0, transferOutCount = 0;
    let transferInTotal = 0, transferInCount = 0;
    let adjustTotal = 0, adjustCount = 0;

    const categoryExpenseMap = {};

    // 2. 統計當月數據
    records.forEach(r => {
        const amt = parseFloat(r.amount) || 0;
        if (r.type === '支出' || r.type === '應付款項') {
            outTotal += amt;
            outCount++;
            categoryExpenseMap[r.category] = (categoryExpenseMap[r.category] || 0) + amt;
        } else if (r.type === '收入' || r.type === '應收款項') {
            inTotal += amt;
            inCount++;
        } else if (r.type === '轉帳') {
            transferOutTotal += amt;
            transferOutCount++;
        }
    });

    const netTotal = inTotal - outTotal;
    const maxVal = Math.max(outTotal, inTotal, transferOutTotal, 1);

    // 3. 更新收支數字與進度條
    document.getElementById('trends-out-count').innerText = outCount;
    document.getElementById('trends-out-total').innerText = `-$${outTotal.toLocaleString()}`;
    document.getElementById('trends-out-bar').style.width = `${(outTotal / maxVal) * 100}%`;

    document.getElementById('trends-in-count').innerText = inCount;
    document.getElementById('trends-in-total').innerText = `+$${inTotal.toLocaleString()}`;
    document.getElementById('trends-in-bar').style.width = `${(inTotal / maxVal) * 100}%`;

    document.getElementById('trends-transfer-out-count').innerText = transferOutCount;
    document.getElementById('trends-transfer-out-total').innerText = `-$${transferOutTotal.toLocaleString()}`;
    document.getElementById('trends-transfer-out-bar').style.width = `${(transferOutTotal / maxVal) * 100}%`;

    document.getElementById('trends-transfer-in-count').innerText = transferInCount;
    document.getElementById('trends-transfer-in-total').innerText = `+$${transferInTotal.toLocaleString()}`;

    document.getElementById('trends-adjust-count').innerText = adjustCount;
    document.getElementById('trends-adjust-total').innerText = `+$${adjustTotal.toLocaleString()}`;

    document.getElementById('trends-total-count').innerText = records.length;
    document.getElementById('trends-net-total').innerText = `${netTotal >= 0 ? '+' : '-'}$${Math.abs(netTotal).toLocaleString()}`;

    // 4. 渲染當月類別圓環
    const catContainer = document.getElementById('trends-category-circles');
    const sortedCats = Object.entries(categoryExpenseMap).sort((a, b) => b[1] - a[1]);
    
    if (catContainer) {
        if (sortedCats.length === 0) {
            catContainer.innerHTML = `<span style="color:#8e8e93; font-size:12px; padding:10px;">該月份尚無類別支出資料</span>`;
        } else {
            let catHTML = '';
            sortedCats.forEach(([catName, amt]) => {
                const percent = outTotal > 0 ? Math.round((amt / outTotal) * 1000) / 10 : 0;
                catHTML += `
                    <div class="trends-cat-card">
                        <div class="trends-circle-progress" style="background: conic-gradient(#fb7185 ${percent}%, rgba(255,255,255,0.08) 0);">
                            <span>${percent}%</span>
                        </div>
                        <div style="font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 2px;">${catName}</div>
                        <div style="font-size: 11px; color: #fb7185; font-weight: 700;">$${amt.toLocaleString()}</div>
                    </div>
                `;
            });
            catContainer.innerHTML = catHTML;
        }
    }

    // 5. 渲染當月 TOP 3 支出排行
    const top3Container = document.getElementById('trends-top3-container');
    const topRecords = records
        .filter(r => r.type === '支出' || r.type === '應付款項')
        .sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount))
        .slice(0, 3);

    if (top3Container) {
        if (topRecords.length === 0) {
            top3Container.innerHTML = `<p style="color:#8e8e93; text-align:center; font-size:13px; padding:20px 0;">該月份尚無排行紀錄</p>`;
        } else {
            let topHTML = '';
            topRecords.forEach(r => {
                topHTML += `
                    <div class="form-group" style="background: #1c1c28; border-radius: 18px; padding: 14px 16px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="cate-icon-wrapper i-shopping" style="width: 44px; height: 44px; margin: 0;">
                                <i data-lucide="shopping-bag"></i>
                            </div>
                            <div>
                                <div style="font-size: 15px; font-weight: 600; color: #fff;">${r.category}</div>
                                <div style="font-size: 11px; color: #8e8e93; margin: 2px 0;">${r.note || '無備註'}</div>
                                <div style="display: flex; gap: 5px; margin-top: 4px;">
                                    <span style="background: rgba(255,255,255,0.06); color: #8e8e93; font-size: 10px; padding: 1px 6px; border-radius: 5px;">${r.project || '生活開銷'}</span>
                                    <span style="background: rgba(93,93,255,0.12); color: #8e8e93; font-size: 10px; padding: 1px 6px; border-radius: 5px;">${r.account || '錢包'}</span>
                                </div>
                            </div>
                        </div>
                        <span style="color: #fb7185; font-size: 16px; font-weight: 700;">$${parseFloat(r.amount).toLocaleString()}</span>
                    </div>
                `;
            });
            top3Container.innerHTML = topHTML;
        }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

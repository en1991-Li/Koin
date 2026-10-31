/**
 * Koin 每月報表核心統計與視覺化 - trends.js
 */

// 預設當前月份
let currentTrendsDate = new Date();
let currentTrendsSubTab = '總覽'; // '總覽' | '明細' | '類別' | '排行' ...

/**
 * 確保月份狀態與系統當前日期對齊
 */
function syncTrendsDateWithCurrent() {
    if (typeof recordState !== 'undefined' && recordState.date) {
        const parts = recordState.date.replace(/-/g, '/').split('/');
        if (parts.length >= 2) {
            currentTrendsDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
            return;
        }
    }
    const now = new Date();
    currentTrendsDate = new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * 切換報表月份 (+1 或 -1 個月)
 */
function changeTrendsMonth(dir) {
    currentTrendsDate.setMonth(currentTrendsDate.getMonth() + dir);
    renderTrendsPage();
}

/**
 * 點擊次級頁籤：切換「總覽」與「明細」視圖
 */
function switchTrendsTab(tabName, el) {
    currentTrendsSubTab = tabName;
    document.querySelectorAll('.trends-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');

    const overviewView = document.getElementById('trends-view-overview');
    const detailsView = document.getElementById('trends-view-details');

    if (tabName === '明細') {
        if (overviewView) overviewView.style.display = 'none';
        if (detailsView) detailsView.style.display = 'block';
        renderTrendsTransactionsList();
    } else {
        if (overviewView) overviewView.style.display = 'block';
        if (detailsView) detailsView.style.display = 'none';
        renderTrendsPage();
    }
}

/**
 * 每月報表核心渲染引擎 (總覽視圖)
 */
function renderTrendsPage() {
    const rangeEl = document.getElementById('trends-date-range');
    if (!rangeEl) return;

    const year = currentTrendsDate.getFullYear();
    const month = currentTrendsDate.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    const padMonth = String(month).padStart(2, '0');
    
    // 更新頂部日期區間
    rangeEl.innerText = `${year}/${padMonth}/01 － ${year}/${padMonth}/${String(lastDay).padStart(2, '0')}`;

    // 如果目前停留在明細頁籤，重新過濾明細並返回
    if (currentTrendsSubTab === '明細') {
        renderTrendsTransactionsList();
        return;
    }

    const allRecords = JSON.parse(localStorage.getItem('koin_records') || '[]');
    const targetMonthPrefix = `${year}/${padMonth}`;
    const targetMonthPrefixAlt = `${year}/${month}/`;

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

    const mainCategoryStats = {};
    const subCategoryStats = {};

    records.forEach(r => {
        const amt = parseFloat(r.amount) || 0;
        const rawCat = (r.category || '未分類').trim();

        if (r.type === '支出' || r.type === '應付款項') {
            outTotal += amt;
            outCount++;

            if (!subCategoryStats[rawCat]) {
                subCategoryStats[rawCat] = { amount: 0, count: 0, lastRecord: r };
            }
            subCategoryStats[rawCat].amount += amt;
            subCategoryStats[rawCat].count++;

            let parentCat = '其他';
            if (typeof categoryMetaMap !== 'undefined' && categoryMetaMap[rawCat]) {
                parentCat = categoryMetaMap[rawCat].parent || rawCat;
            } else {
                parentCat = rawCat;
            }

            if (!mainCategoryStats[parentCat]) {
                mainCategoryStats[parentCat] = { amount: 0, count: 0 };
            }
            mainCategoryStats[parentCat].amount += amt;
            mainCategoryStats[parentCat].count++;

        } else if (r.type === '收入' || r.type === '應收款項') {
            inTotal += amt;
            inCount++;
        } else if (r.type === '轉帳') {
            transferOutTotal += amt;
            transferOutCount++;
        } else if (r.type === '調整餘額') {
            adjustTotal += amt;
            adjustCount++;
        }
    });

    const netTotal = inTotal - outTotal;
    const maxVal = Math.max(outTotal, inTotal, transferOutTotal, 1);

    const setElemText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    setElemText('trends-out-count', outCount);
    setElemText('trends-out-total', `-$${outTotal.toLocaleString()}`);
    if (document.getElementById('trends-out-bar')) {
        document.getElementById('trends-out-bar').style.width = `${(outTotal / maxVal) * 100}%`;
    }

    setElemText('trends-in-count', inCount);
    setElemText('trends-in-total', `+$${inTotal.toLocaleString()}`);
    if (document.getElementById('trends-in-bar')) {
        document.getElementById('trends-in-bar').style.width = `${(inTotal / maxVal) * 100}%`;
    }

    setElemText('trends-transfer-out-count', transferOutCount);
    setElemText('trends-transfer-out-total', `-$${transferOutTotal.toLocaleString()}`);
    if (document.getElementById('trends-transfer-out-bar')) {
        document.getElementById('trends-transfer-out-bar').style.width = `${(transferOutTotal / maxVal) * 100}%`;
    }

    setElemText('trends-transfer-in-count', transferInCount);
    setElemText('trends-transfer-in-total', `+$${transferInTotal.toLocaleString()}`);

    setElemText('trends-adjust-count', adjustCount);
    setElemText('trends-adjust-total', `+$${adjustTotal.toLocaleString()}`);

    setElemText('trends-total-count', records.length);
    const netTotalEl = document.getElementById('trends-net-total');
    if (netTotalEl) {
        netTotalEl.innerText = `${netTotal >= 0 ? '+' : '-'}$${Math.abs(netTotal).toLocaleString()}`;
        netTotalEl.style.color = netTotal >= 0 ? '#4ade80' : '#fb7185';
    }

    // 渲染類別圓形環
    const catContainer = document.getElementById('trends-category-circles');
    const sortedMainCats = Object.entries(mainCategoryStats).sort((a, b) => b[1].amount - a[1].amount);

    if (catContainer) {
        if (sortedMainCats.length === 0 || outTotal === 0) {
            catContainer.innerHTML = `<span style="color:#8e8e93; font-size:12px; padding:15px;">該月份尚無支出分類資料</span>`;
        } else {
            let catHTML = '';
            sortedMainCats.forEach(([catName, data]) => {
                const percent = Math.round((data.amount / outTotal) * 100);
                const meta = (typeof categoryMetaMap !== 'undefined' && categoryMetaMap[catName]) 
                    ? categoryMetaMap[catName] 
                    : { icon: 'tag' };

                catHTML += `
                    <div class="trends-cat-circle-item" style="display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 68px;">
                        <div class="donut-ring" style="width: 58px; height: 58px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: conic-gradient(#fb7185 ${percent * 3.6}deg, #2c2c3e 0deg); box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
                            <div class="donut-inner" style="width: 44px; height: 44px; border-radius: 50%; background: #1c1c28; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="${meta.icon}" style="width: 20px; height: 20px; color: #ffffff;"></i>
                            </div>
                        </div>
                        <span style="font-size: 12px; color: #ffffff; font-weight: 600;">${catName}</span>
                        <span style="font-size: 11px; color: #8e8e93;">${percent}%</span>
                    </div>
                `;
            });
            catContainer.innerHTML = catHTML;
        }
    }

    // 渲染 TOP 3 支出排行
    const top3Container = document.getElementById('trends-top3-container');
    const sortedSubCats = Object.entries(subCategoryStats)
        .map(([name, val]) => ({ name, ...val }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

    const rankBadgeColors = ['#f59e0b', '#94a3b8', '#b45309'];

    if (top3Container) {
        if (sortedSubCats.length === 0 || outTotal === 0) {
            top3Container.innerHTML = `<p style="color:#8e8e93; text-align:center; font-size:13px; padding:20px 0;">該月份尚無排行紀錄</p>`;
        } else {
            let topHTML = `<div class="form-group" style="background: #1c1c28; border-radius: 20px; padding: 0 16px; margin-bottom: 20px;">`;
            
            sortedSubCats.forEach((item, index) => {
                const isLast = (index === sortedSubCats.length - 1);
                const percent = Math.round((item.amount / outTotal) * 100);
                const meta = (typeof categoryMetaMap !== 'undefined' && categoryMetaMap[item.name]) 
                    ? categoryMetaMap[item.name] 
                    : { icon: 'tag', bgClass: 'i-shopping' };
                
                const rec = item.lastRecord || {};

                topHTML += `
                    <div class="form-row" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'};">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 14px; font-weight: 800; color: ${rankBadgeColors[index]}; width: 14px; text-align: center;">${index + 1}</span>
                            <div class="cate-icon-wrapper ${meta.bgClass}" style="width: 42px; height: 42px; margin: 0;">
                                <i data-lucide="${meta.icon}"></i>
                            </div>
                            <div>
                                <div style="font-size: 15px; font-weight: 600; color: #fff;">${item.name}</div>
                                <div style="font-size: 11px; color: #8e8e93; margin: 2px 0;">${item.count} 筆記錄 · 佔比 ${percent}%</div>
                                <div style="display: flex; gap: 5px; margin-top: 2px;">
                                    <span style="background: rgba(255,255,255,0.06); color: #8e8e93; font-size: 10px; padding: 1px 6px; border-radius: 5px;">${rec.project || '生活開銷'}</span>
                                    <span style="background: rgba(93,93,255,0.12); color: #8e8e93; font-size: 10px; padding: 1px 6px; border-radius: 5px;">${rec.account || '錢包'}</span>
                                </div>
                            </div>
                        </div>
                        <span style="color: #fb7185; font-size: 16px; font-weight: 700;">-$${item.amount.toLocaleString()}</span>
                    </div>
                `;
            });
            
            topHTML += `</div>`;
            top3Container.innerHTML = topHTML;
        }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 渲染每月報表中的「明細」列表視圖 (按日期倒序分組，並包含星期與總計)
 */
function renderTrendsTransactionsList() {
    const container = document.getElementById('trends-transactions-container');
    if (!container) return;

    const year = currentTrendsDate.getFullYear();
    const month = currentTrendsDate.getMonth() + 1;
    const padMonth = String(month).padStart(2, '0');

    const allRecords = JSON.parse(localStorage.getItem('koin_records') || '[]');
    const targetMonthPrefix = `${year}/${padMonth}`;
    const targetMonthPrefixAlt = `${year}/${month}/`;

    // 篩選當月記錄
    const monthRecords = allRecords.filter(r => {
        if (!r.date) return false;
        const normalizedDate = r.date.replace(/-/g, '/');
        return normalizedDate.startsWith(targetMonthPrefix) || normalizedDate.startsWith(targetMonthPrefixAlt);
    });

    if (monthRecords.length === 0) {
        container.innerHTML = `<p style="color: #8e8e93; text-align: center; margin-top: 40px; font-size: 14px;">該月份尚無交易明細</p>`;
        return;
    }

    // 按日期分組
    const grouped = {};
    monthRecords.forEach(r => {
        const d = r.date || '未知日期';
        if (!grouped[d]) {
            grouped[d] = { records: [], total: 0 };
        }
        grouped[d].records.push(r);
        const amt = parseFloat(r.amount) || 0;
        if (r.type === '支出' || r.type === '應付款項') {
            grouped[d].total -= amt;
        } else if (r.type === '收入' || r.type === '應收款項') {
            grouped[d].total += amt;
        }
    });

    // 日期倒序排序 (最新的日期排在最上方)
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

    let html = '';
    sortedDates.forEach(dateStr => {
        const group = grouped[dateStr];
        const isNetExpense = group.total < 0;
        const groupTotalText = `${isNetExpense ? '-' : '+'}$${Math.abs(group.total).toLocaleString()}`;
        const groupTotalColor = isNetExpense ? '#fb7185' : '#4ade80';

        // 星期幾判定
        let weekDayStr = '';
        const parts = dateStr.replace(/-/g, '/').split('/');
        if (parts.length === 3) {
            const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            if (!isNaN(dObj.getDay())) {
                weekDayStr = ` (${weekDays[dObj.getDay()]})`;
            }
        }

        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 4px 6px 4px; color: #ffffff; font-size: 13px; font-weight: 700;">
                <span>${dateStr}<span style="color: #8e8e93; font-weight: 500; font-size: 12px; margin-left: 4px;">${weekDayStr}</span></span>
                <span style="color: ${groupTotalColor};">${groupTotalText}</span>
            </div>
            <div class="form-group" style="background: #1c1c28; border-radius: 16px; padding: 0 16px; margin-bottom: 12px;">
        `;

        group.records.forEach((r, idx) => {
            const isLast = (idx === group.records.length - 1);
            const isExpense = (r.type === '支出' || r.type === '應付款項');
            const amtColor = isExpense ? '#fb7185' : '#4ade80';

            const cleanCategory = String(r.category || '').trim();
            const meta = (typeof categoryMetaMap !== 'undefined' && categoryMetaMap[cleanCategory]) 
                ? categoryMetaMap[cleanCategory] 
                : { icon: 'tag', bgClass: isExpense ? 'i-shopping' : 'i-income-gold' };

            html += `
                <div class="form-row" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'}; cursor: pointer;" onclick="openRecordSummary(${r.id})">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="cate-icon-wrapper ${meta.bgClass}" style="width: 42px; height: 42px; margin: 0;">
                            <i data-lucide="${meta.icon}"></i>
                        </div>
                        <div>
                            <div style="font-size: 15px; font-weight: 600; color: #fff;">${r.category}</div>
                            <div style="font-size: 11px; color: #8e8e93; margin: 2px 0;">${r.note || '無備註'}</div>
                            <div style="display: flex; gap: 5px; margin-top: 2px;">
                                <span style="background: rgba(255,255,255,0.06); color: #8e8e93; font-size: 10px; padding: 1px 6px; border-radius: 5px;">${r.project || '生活開銷'}</span>
                                <span style="background: rgba(93,93,255,0.12); color: #8e8e93; font-size: 10px; padding: 1px 6px; border-radius: 5px;">${r.account || '錢包'}</span>
                                <span style="color: #8e8e93; font-size: 10px; padding: 1px 2px;">${r.time || ''}</span>
                            </div>
                        </div>
                    </div>
                    <span style="color: ${amtColor}; font-size: 16px; font-weight: 700;">
                        ${isExpense ? '-' : '+'}$${parseFloat(r.amount).toLocaleString()}
                    </span>
                </div>
            `;
        });

        html += `</div>`;
    });

    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

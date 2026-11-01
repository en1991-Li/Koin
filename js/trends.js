/**
 * Koin 每月報表核心統計與視覺化 - trends.js
 */

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
    refreshCurrentTrendsView();
}

/**
 * 刷新目前選中的視圖
 */
function refreshCurrentTrendsView() {
    if (currentTrendsSubTab === '明細') {
        renderTrendsTransactionsList();
    } else if (currentTrendsSubTab === '類別') {
        renderTrendsCategoryView();
    } else {
        renderTrendsPage();
    }
}

/**
 * 點擊次級頁籤：切換「總覽」、「明細」、「類別」視圖
 */
function switchTrendsTab(tabName, el) {
    currentTrendsSubTab = tabName;
    document.querySelectorAll('.trends-tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');

    const overviewView = document.getElementById('trends-view-overview');
    const detailsView = document.getElementById('trends-view-details');
    const categoriesView = document.getElementById('trends-view-categories');

    if (overviewView) overviewView.style.display = 'none';
    if (detailsView) detailsView.style.display = 'none';
    if (categoriesView) categoriesView.style.display = 'none';

    if (tabName === '明細') {
        if (detailsView) detailsView.style.display = 'block';
        renderTrendsTransactionsList();
    } else if (tabName === '類別') {
        if (categoriesView) categoriesView.style.display = 'block';
        renderTrendsCategoryView();
    } else {
        if (overviewView) overviewView.style.display = 'block';
        renderTrendsPage();
    }
}

/**
 * 取得當前選中月份的篩選紀錄
 */
function getFilteredMonthRecords() {
    const year = currentTrendsDate.getFullYear();
    const month = currentTrendsDate.getMonth() + 1;
    const lastDay = new Date(year, month, 0).getDate();
    const padMonth = String(month).padStart(2, '0');

    const rangeEl = document.getElementById('trends-date-range');
    if (rangeEl) {
        rangeEl.innerText = `${year}/${padMonth}/01 － ${year}/${padMonth}/${String(lastDay).padStart(2, '0')}`;
    }

    const allRecords = JSON.parse(localStorage.getItem('koin_records') || '[]');
    const targetMonthPrefix = `${year}/${padMonth}`;
    const targetMonthPrefixAlt = `${year}/${month}/`;

    return {
        year,
        month,
        lastDay,
        records: allRecords.filter(r => {
            if (!r.date) return false;
            const normalizedDate = r.date.replace(/-/g, '/');
            return normalizedDate.startsWith(targetMonthPrefix) || normalizedDate.startsWith(targetMonthPrefixAlt);
        })
    };
}

/**
 * 1. 每月報表核心渲染引擎 (總覽視圖)
 */
function renderTrendsPage() {
    const { records } = getFilteredMonthRecords();

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

    // 總覽頁橫向小圓環
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

    // TOP 3 支出排行
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
                    <div class="form-row" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'}; cursor: pointer;" onclick="openRecordSummary(${rec.id})">
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
 * 2. 渲染每月報表中的「類別」視圖 (包含大色段圓環、各分類圓環、金額、筆數與百分比)
 */
function renderTrendsCategoryView() {
    const heroDonut = document.getElementById('trends-category-hero-donut');
    const heroTotal = document.getElementById('trends-category-hero-total');
    const heroCount = document.getElementById('trends-category-hero-count');
    const listContainer = document.getElementById('trends-category-detail-list');
    if (!listContainer) return;

    const { records } = getFilteredMonthRecords();

    // 10 大主分類配色字典
    const catColorMap = {
        '飲食': '#f59e0b',
        '交通': '#3b82f6',
        '娛樂': '#a855f7',
        '購物': '#ef4444',
        '個人': '#6366f1',
        '醫療': '#06b6d4',
        '家居': '#10b981',
        '家庭': '#ec4899',
        '生活': '#84cc16',
        '學習': '#14b8a6',
        '其他': '#8e8e93'
    };

    let totalExpense = 0;
    let expenseCount = 0;
    const mainCatMap = {};

    records.forEach(r => {
        if (r.type === '支出' || r.type === '應付款項') {
            const amt = parseFloat(r.amount) || 0;
            const rawCat = (r.category || '未分類').trim();
            totalExpense += amt;
            expenseCount++;

            let parentCat = '其他';
            if (typeof categoryMetaMap !== 'undefined' && categoryMetaMap[rawCat]) {
                parentCat = categoryMetaMap[rawCat].parent || rawCat;
            } else {
                parentCat = rawCat;
            }

            if (!mainCatMap[parentCat]) {
                mainCatMap[parentCat] = { amount: 0, count: 0, subItems: {} };
            }
            mainCatMap[parentCat].amount += amt;
            mainCatMap[parentCat].count++;

            // 子項目細分
            mainCatMap[parentCat].subItems[rawCat] = (mainCatMap[parentCat].subItems[rawCat] || 0) + amt;
        }
    });

    // 更新頂部 Hero 大甜甜圈
    if (heroTotal) heroTotal.innerText = `-$${totalExpense.toLocaleString()}`;
    if (heroCount) heroCount.innerText = `${expenseCount} 筆`;

    const sortedCats = Object.entries(mainCatMap).sort((a, b) => b[1].amount - a[1].amount);

    if (sortedCats.length === 0 || totalExpense === 0) {
        if (heroDonut) heroDonut.style.background = '#2c2c3e';
        listContainer.innerHTML = `<p style="color: #8e8e93; text-align: center; margin-top: 30px; font-size: 14px;">該月份尚無支出分類資料</p>`;
        return;
    }

    // 計算多段 Conic-Gradient
    let currentDegree = 0;
    const gradientStops = [];
    sortedCats.forEach(([catName, data]) => {
        const ratio = data.amount / totalExpense;
        const deg = ratio * 360;
        const color = catColorMap[catName] || '#5d5dff';
        gradientStops.push(`${color} ${currentDegree.toFixed(1)}deg ${(currentDegree + deg).toFixed(1)}deg`);
        currentDegree += deg;
    });

    if (heroDonut) {
        heroDonut.style.background = `conic-gradient(${gradientStops.join(', ')})`;
    }

    // 生成分類詳細卡片列表
    let listHTML = `<div class="form-group" style="background: #1c1c28; border-radius: 20px; padding: 4px 16px; margin-bottom: 30px;">`;

    sortedCats.forEach(([catName, data], idx) => {
        const isLast = (idx === sortedCats.length - 1);
        const percent = Math.round((data.amount / totalExpense) * 1000) / 10;
        const meta = (typeof categoryMetaMap !== 'undefined' && categoryMetaMap[catName]) 
            ? categoryMetaMap[catName] 
            : { icon: 'tag', bgClass: 'i-shopping' };
        const color = catColorMap[catName] || '#fb7185';

        listHTML += `
            <div class="form-row" style="display: flex; flex-direction: column; padding: 16px 0; border-bottom: ${isLast ? 'none' : '1px solid rgba(255,255,255,0.05)'};">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <!-- 個別分類支出圓環 -->
                        <div class="donut-ring" style="width: 48px; height: 48px; min-width: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: conic-gradient(${color} ${percent * 3.6}deg, #2c2c3e 0deg); box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                            <div class="donut-inner" style="width: 36px; height: 36px; border-radius: 50%; background: #1c1c28; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="${meta.icon}" style="width: 18px; height: 18px; color: #ffffff;"></i>
                            </div>
                        </div>

                        <div>
                            <div style="font-size: 15px; font-weight: 700; color: #ffffff;">${catName}</div>
                            <div style="font-size: 11px; color: #8e8e93; margin-top: 2px;">
                                ${data.count} 筆記錄 · <span style="color: ${color}; font-weight: 700;">${percent}%</span>
                            </div>
                        </div>
                    </div>

                    <div style="text-align: right;">
                        <span style="font-size: 16px; font-weight: 700; color: #fb7185;">-$${data.amount.toLocaleString()}</span>
                    </div>
                </div>

                <!-- 條形進度條 -->
                <div style="width: 100%; height: 5px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; margin-top: 10px;">
                    <div style="width: ${percent}%; height: 100%; background: ${color}; border-radius: 4px; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
    });

    listHTML += `</div>`;
    listContainer.innerHTML = listHTML;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * 3. 渲染每月報表中的「明細」列表視圖
 */
function renderTrendsTransactionsList() {
    const container = document.getElementById('trends-transactions-container');
    if (!container) return;

    const { records, lastDay } = getFilteredMonthRecords();

    // 觸發繪製 SVG 曲線圖與 Tooltip
    renderTrendsExpenseChart(records, lastDay);

    if (records.length === 0) {
        container.innerHTML = `<p style="color: #8e8e93; text-align: center; margin-top: 30px; font-size: 14px;">該月份尚無交易明細</p>`;
        return;
    }

    const grouped = {};
    records.forEach(r => {
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

    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    const weekDays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

    let html = '';
    sortedDates.forEach(dateStr => {
        const group = grouped[dateStr];
        const isNetExpense = group.total < 0;
        const groupTotalText = `${isNetExpense ? '-' : '+'}$${Math.abs(group.total).toLocaleString()}`;
        const groupTotalColor = isNetExpense ? '#fb7185' : '#4ade80';

        let weekDayStr = '';
        const parts = dateStr.replace(/-/g, '/').split('/');
        if (parts.length === 3) {
            const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            if (!isNaN(dObj.getDay())) {
                weekDayStr = ` (${weekDays[dObj.getDay()]})`;
            }
        }

        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 4px 6px 4px; color: #ffffff; font-size: 13px; font-weight: 700;">
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

/**
 * 繪製當月每日支出趨勢折線圖 (支援點擊與觸控 Tooltip)
 */
function renderTrendsExpenseChart(monthRecords, daysInMonth) {
    const svg = document.getElementById('trends-expense-svg');
    const maxLabel = document.getElementById('trends-chart-max-label');
    const midDayEl = document.getElementById('trends-chart-mid-day');
    const endDayEl = document.getElementById('trends-chart-end-day');
    const tooltip = document.getElementById('trends-chart-tooltip');
    const tooltipDate = document.getElementById('tooltip-date');
    const tooltipAmount = document.getElementById('tooltip-amount');
    const chartContainer = document.getElementById('trends-chart-container');
    if (!svg) return;

    if (tooltip) tooltip.style.display = 'none';

    if (midDayEl) midDayEl.innerText = `${Math.floor(daysInMonth / 2)}日`;
    if (endDayEl) endDayEl.innerText = `${daysInMonth}日`;

    const dailyExpenses = new Array(daysInMonth + 1).fill(0);
    monthRecords.forEach(r => {
        if (r.type === '支出' || r.type === '應付款項') {
            const parts = (r.date || '').replace(/-/g, '/').split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[2], 10);
                if (day >= 1 && day <= daysInMonth) {
                    dailyExpenses[day] += (parseFloat(r.amount) || 0);
                }
            }
        }
    });

    const maxExpense = Math.max(...dailyExpenses.slice(1), 0);
    if (maxLabel) {
        maxLabel.innerText = `最高單日: $${maxExpense.toLocaleString()}`;
    }

    if (maxExpense === 0) {
        svg.innerHTML = `
            <line x1="0" y1="80" x2="320" y2="80" stroke="rgba(255,255,255,0.08)" stroke-width="2" stroke-dasharray="4" />
            <text x="160" y="55" fill="#8e8e93" font-size="11" text-anchor="middle">當月尚無支出紀錄</text>
        `;
        return;
    }

    const width = 320;
    const height = 100;
    const paddingY = 15;
    const chartHeight = height - paddingY * 2;

    const points = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const x = ((day - 1) / (daysInMonth - 1)) * width;
        const ratio = dailyExpenses[day] / maxExpense;
        const y = height - paddingY - (ratio * chartHeight);
        points.push({ 
            x: Number(x.toFixed(1)), 
            y: Number(y.toFixed(1)), 
            val: dailyExpenses[day], 
            day 
        });
    }

    const polylineCoords = points.map(p => `${p.x},${p.y}`).join(' ');
    const areaCoords = `0,${height} ${polylineCoords} ${width},${height}`;
    const highestPoint = points.reduce((prev, curr) => (curr.val > prev.val ? curr : prev), points[0]);

    svg.innerHTML = `
        <defs>
            <linearGradient id="expenseTrendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#fb7185" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#fb7185" stop-opacity="0.0" />
            </linearGradient>
        </defs>
        
        <line x1="0" y1="${height - paddingY}" x2="${width}" y2="${height - paddingY}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
        <line x1="0" y1="${paddingY}" x2="${width}" y2="${paddingY}" stroke="rgba(255,255,255,0.04)" stroke-dasharray="3" stroke-width="1" />

        <polygon points="${areaCoords}" fill="url(#expenseTrendGrad)" />
        <polyline points="${polylineCoords}" fill="none" stroke="#fb7185" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

        <line id="svg-indicator-line" x1="0" y1="${paddingY}" x2="0" y2="${height - paddingY}" stroke="rgba(251, 113, 133, 0.4)" stroke-width="1.5" stroke-dasharray="2" style="display: none;" />

        ${highestPoint.val > 0 ? `
            <circle id="svg-highest-point" cx="${highestPoint.x}" cy="${highestPoint.y}" r="3.5" fill="#fb7185" stroke="#1c1c28" stroke-width="1.5" />
        ` : ''}

        <circle id="svg-active-dot" cx="0" cy="0" r="4.5" fill="#ffffff" stroke="#fb7185" stroke-width="2" style="display: none;" />

        <g id="svg-touch-targets">
            ${points.map((p, idx) => `
                <circle cx="${p.x}" cy="${p.y}" r="12" fill="transparent" style="cursor: pointer;" data-index="${idx}" />
            `).join('')}
        </g>
    `;

    const touchGroup = document.getElementById('svg-touch-targets');
    const indicatorLine = document.getElementById('svg-indicator-line');
    const activeDot = document.getElementById('svg-active-dot');

    if (touchGroup && chartContainer && tooltip) {
        const handlePointSelect = (p) => {
            const curMonth = currentTrendsDate.getMonth() + 1;
            
            if (tooltipDate) tooltipDate.innerText = `${curMonth}月${p.day}日`;
            if (tooltipAmount) tooltipAmount.innerText = `$${p.val.toLocaleString()}`;

            const percentX = (p.x / width) * 100;
            const percentY = (p.y / height) * 100;

            const clampX = Math.max(12, Math.min(88, percentX));
            tooltip.style.left = `${clampX}%`;
            tooltip.style.top = `${percentY}%`;
            tooltip.style.display = 'block';

            if (indicatorLine) {
                indicatorLine.setAttribute('x1', p.x);
                indicatorLine.setAttribute('x2', p.x);
                indicatorLine.style.display = 'block';
            }
            if (activeDot) {
                activeDot.setAttribute('cx', p.x);
                activeDot.setAttribute('cy', p.y);
                activeDot.style.display = 'block';
            }
        };

        touchGroup.querySelectorAll('circle').forEach(c => {
            c.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(c.getAttribute('data-index'), 10);
                handlePointSelect(points[idx]);
            });
        });

        document.addEventListener('click', (e) => {
            if (!chartContainer.contains(e.target)) {
                tooltip.style.display = 'none';
                if (indicatorLine) indicatorLine.style.display = 'none';
                if (activeDot) activeDot.style.display = 'none';
            }
        }, { once: true });
    }
}

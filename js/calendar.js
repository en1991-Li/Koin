// 設定初始日期
let selectedDate = new Date(2026, 3, 8); // 2026/04/08 (月份從0開始)

function initCalendarStrip() {
    const strip = document.getElementById('calendar-strip');
    const title = document.getElementById('current-date-title');
    if (!strip) return;

    const daysInMonth = new Date(2026, 4, 0).getDate(); // 獲取4月天數
    const weekdays = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    
    let html = '';
    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(2026, 3, i);
        const dayOfWeek = dateObj.getDay();
        const isSelected = i === selectedDate.getDate();
        
        let dayClass = 'calendar-day';
        if (dayOfWeek === 0) dayClass += ' sunday';
        if (dayOfWeek === 6) dayClass += ' saturday';
        if (isSelected) dayClass += ' active';

        html += `
            <div class="${dayClass}" onclick="selectCalendarDate(2026, 3, ${i}, this)">
                <span class="weekday">${weekdays[dayOfWeek]}</span>
                <span class="date-num">${i < 10 ? '0' + i : i}</span>
            </div>
        `;
    }
    strip.innerHTML = html;
}

function selectCalendarDate(year, month, day, element) {
    // 1. 更新選中狀態 UI
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('active'));
    element.classList.add('active');

    // 2. 更新標題
    const formattedDate = `${year}/${(month + 1).toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    document.getElementById('current-date-title').innerText = formattedDate;

    // 3. 重新渲染該日期的詳細列表內容
    renderDailyDetails(formattedDate);
}

// 模擬當日詳細記錄渲染
function renderDailyDetails(dateStr) {
    const container = document.getElementById('calendar-details-container');
    // 這裡可以根據日期顯示不同的資料，目前先放原本的模擬數據
    // renderCalendarDetails(); 
    console.log("切換到日期:", dateStr);
}
function initFabCalendar() {
    const strip = document.getElementById('fab-calendar-strip');
    const headerTitle = document.getElementById('calendar-header-title');
    if (!strip) return;

    const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    // 以 2026/04/08 為中心生成日期
    const baseDate = new Date(2026, 3, 8); 

    strip.innerHTML = ''; // 清空

    for (let i = -15; i <= 15; i++) {
        const d = new Date(2026, 3, 8 + i);
        const isToday = i === 0;
        const dayEl = document.createElement('div');
        
        // 設定週末 Class
        let weekClass = '';
        if (d.getDay() === 0) weekClass = 'sunday';
        if (d.getDay() === 6) weekClass = 'saturday';
        
        dayEl.className = `calendar-day ${weekClass} ${isToday ? 'active' : ''}`;
        dayEl.innerHTML = `
            <span class="weekday">${days[d.getDay()]}</span>
            <span class="date-num">${d.getDate() < 10 ? '0'+d.getDate() : d.getDate()}</span>
        `;

        dayEl.onclick = function() {
            document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
            dayEl.classList.add('active');
            // 連動標題顯示
            headerTitle.innerText = `2026/04/${d.getDate() < 10 ? '0'+d.getDate() : d.getDate()}`;
        };

        strip.appendChild(dayEl);
    }
}

// 確保頁面載入時執行
document.addEventListener('DOMContentLoaded', initFabCalendar);


document.addEventListener('DOMContentLoaded', () => {
    initCalendarStrip();
    // 初始渲染一次詳細內容
    renderDailyDetails("2026/04/08");
});

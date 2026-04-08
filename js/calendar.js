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

function renderFullCalendar() {
    const grid = document.getElementById('full-calendar-grid');
    if (!grid) return;

    const year = 2026;
    const month = 3; // 4月 (JavaScript 月份從0開始)
    const firstDay = new Date(year, month, 1).getDay(); // 4/1 是週三
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    grid.innerHTML = '';

    // 1. 填入上個月的尾巴
    for (let i = firstDay - 1; i >= 0; i--) {
        createDayElement(prevMonthDays - i, 'not-current');
    }

    // 2. 填入本月日期
    for (let i = 1; i <= daysInMonth; i++) {
        const isSelected = (i === 8); // 預設選中 4/8
        createDayElement(i, 'current', isSelected, new Date(year, month, i).getDay());
    }

    // 3. 填入下個月的頭
    const remaining = 42 - (firstDay + daysInMonth);
    for (let i = 1; i <= remaining; i++) {
        createDayElement(i, 'not-current');
    }

    function createDayElement(num, type, isActive = false, weekDay = null) {
        const dayDiv = document.createElement('div');
        let className = `calendar-grid-day ${type} ${isActive ? 'active' : ''}`;
        if (weekDay === 0) className += ' sunday';
        if (weekDay === 6) className += ' saturday';
        
        dayDiv.className = className;
        dayDiv.innerHTML = `<span class="date-val">${num < 10 ? '0' + num : num}</span>`;
        
        if (type === 'current') {
            dayDiv.onclick = () => {
                document.querySelectorAll('.calendar-grid-day').forEach(d => d.classList.remove('active'));
                dayDiv.classList.add('active');
            };
        }
        grid.appendChild(dayDiv);
    }
}

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', renderFullCalendar);






document.addEventListener('DOMContentLoaded', () => {
    initCalendarStrip();
    // 初始渲染一次詳細內容
    renderDailyDetails("2026/04/08");
});

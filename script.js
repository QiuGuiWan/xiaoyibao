// script.js - 修复音乐播放器
(function() {
    // ========== 常量 ==========
    const STORAGE_KEY = 'userData';
    const HEART_STORAGE_KEY = 'heartDiary';
    const CHECKIN_STORAGE_KEY = 'checkinData';
    const HINT_SHOWN_KEY = 'passwordHintShown';
    const THEME_PREF_KEY = 'themePreference';
    const BG_IMAGE_KEY = 'customBackgroundImage';
    const ZOOM_KEY = 'pageZoomLevel';
    const MUSIC_STORAGE_KEY = 'customPlaylist';

    // ========== 状态变量 ==========
    let isLoggedIn = false;
    let currentQQ = '';
    let currentNickname = '';
    let usingCustomBg = false;
    let currentZoom = 100;
    let currentMonth = new Date();
    let checkinData = { records: [], protectedDays: [], currentStreak: 0, maxStreak: 0, totalCheckins: 0, protectCards: 0 };
    let hearts = [];

    // ========== DOM 元素 ==========
    const body = document.body;
    const fullscreenApp = document.querySelector('.fullscreen-app');
    const zoomLevel = document.getElementById('zoomLevel');
    const tabs = document.querySelectorAll('.tab-item');
    const pages = document.querySelectorAll('.page');
    const homePage = document.getElementById('home');
    const friendsPage = document.getElementById('friends');
    const workspacePage = document.getElementById('workspace');
    const profilePage = document.getElementById('profile');
    const settingsPage = document.getElementById('settings');
    const loginView = document.getElementById('loginView');
    const profileView = document.getElementById('profileView');
    const qqInput = document.getElementById('qqInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const avatarImg = document.getElementById('avatarImg');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    const profileAvatar = document.getElementById('profileAvatar');
    const nicknameInput = document.getElementById('nicknameInput');
    const saveNicknameBtn = document.getElementById('saveNicknameBtn');
    const displayQQ = document.getElementById('displayQQ');
    const passwordHint = document.getElementById('passwordHint');
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordToggleIcon = document.getElementById('passwordToggleIcon');
    const settingsEntry = document.getElementById('settingsEntry');
    const settingsBackBtn = document.getElementById('settingsBackBtn');
    const themeDayOption = document.getElementById('themeDayOption');
    const themeNightOption = document.getElementById('themeNightOption');
    const bgDefaultOption = document.getElementById('bgDefaultOption');
    const bgCustomOption = document.getElementById('bgCustomOption');
    const bgImageInput = document.getElementById('bgImageInput');
    const bgUploadBtn = document.getElementById('bgUploadBtn');
    const customBgPreview = document.getElementById('customBgPreview');
    const bgNote = document.getElementById('bgNote');
    const settingsAboutBtn = document.getElementById('settingsAboutBtn');
    const drawer = document.getElementById('drawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawerClose = document.getElementById('drawerClose');
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarYearSelect = document.getElementById('calendarYearSelect');
    const calendarMonthSelect = document.getElementById('calendarMonthSelect');
    const currentStreakEl = document.getElementById('currentStreak');
    const totalCheckinsEl = document.getElementById('totalCheckins');
    const protectCardsEl = document.getElementById('protectCards');
    const checkinBtn = document.getElementById('checkinBtn');
    const profileCurrentStreak = document.getElementById('profileCurrentStreak');
    const profileTotalCheckins = document.getElementById('profileTotalCheckins');
    const profileProtectCards = document.getElementById('profileProtectCards');
    const heartText = document.getElementById('heartText');
    const heartList = document.getElementById('heartList');
    const heartCountDisplay = document.getElementById('heartCountDisplay');
    const heartCount = document.getElementById('heartCount');
    const dailyQuote = document.getElementById('dailyQuote');
    const manualGoBtn = document.getElementById('manualGoBtn');
    const manualRoomUrl = document.getElementById('manualRoomUrl');

    // ========== 通用工具函数 ==========
    function showToast(message, type = 'success', duration = 2000) {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = message;
        toast.classList.add('show');
        clearTimeout(window.toastTimer);
        window.toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
    }

    function switchPage(pageName) {
        pages.forEach(p => p.classList.remove('active'));
        if (pageName === 'home') homePage.classList.add('active');
        else if (pageName === 'friends') friendsPage.classList.add('active');
        else if (pageName === 'workspace') workspacePage.classList.add('active');
        else if (pageName === 'profile') profilePage.classList.add('active');
        else if (pageName === 'settings') settingsPage.classList.add('active');
        tabs.forEach(tab => { tab.classList.remove('active'); if (tab.dataset.page === pageName) tab.classList.add('active'); });
        if (drawer?.classList.contains('active')) closeDrawer();
    }
    window.switchPage = switchPage;

    function closeDrawer() { drawer.classList.remove('active'); drawerOverlay.classList.remove('active'); }

    // ========== 缩放功能 ==========
    function applyZoom() {
        fullscreenApp.style.transform = `scale(${currentZoom / 100})`;
        fullscreenApp.style.width = `${10000 / currentZoom}%`;
        fullscreenApp.style.height = `${10000 / currentZoom}%`;
        zoomLevel.textContent = currentZoom + '%';
    }
    window.zoomIn = function() { if (currentZoom < 200) { currentZoom += 10; applyZoom(); } };
    window.zoomOut = function() { if (currentZoom > 50) { currentZoom -= 10; applyZoom(); } };
    window.resetZoom = function() { currentZoom = 100; applyZoom(); };

    // ========== 主题 ==========
    function loadThemePreference() {
        const saved = localStorage.getItem(THEME_PREF_KEY);
        if (saved === 'night') {
            body.classList.remove('theme-day'); body.classList.add('theme-night');
        } else {
            body.classList.remove('theme-night'); body.classList.add('theme-day');
        }
        updateThemeUI();
    }
    function setTheme(theme) {
        body.classList.remove('theme-day', 'theme-night');
        body.classList.add(theme === 'night' ? 'theme-night' : 'theme-day');
        localStorage.setItem(THEME_PREF_KEY, theme);
        if (usingCustomBg) saveBackgroundImage(null);
        updateThemeUI();
        showToast('主题已切换');
    }
    function updateThemeUI() {
        const night = body.classList.contains('theme-night');
        if (themeDayOption) themeDayOption.classList.toggle('active', !night);
        if (themeNightOption) themeNightOption.classList.toggle('active', night);
    }

    // ========== 背景图片 ==========
    function saveBackgroundImage(dataUrl) {
        if (dataUrl) {
            localStorage.setItem(BG_IMAGE_KEY, dataUrl);
            usingCustomBg = true;
            applyCustomBackground(dataUrl);
        } else {
            localStorage.removeItem(BG_IMAGE_KEY);
            usingCustomBg = false;
            removeCustomBackground();
        }
        updateBgOptionsUI();
    }
    function loadBackgroundImage() {
        const saved = localStorage.getItem(BG_IMAGE_KEY);
        if (saved) {
            usingCustomBg = true;
            applyCustomBackground(saved);
            if (customBgPreview) {
                customBgPreview.style.backgroundImage = `url('${saved}')`;
                customBgPreview.innerHTML = '';
            }
        } else {
            usingCustomBg = false;
            removeCustomBackground();
        }
        updateBgOptionsUI();
    }
    function applyCustomBackground(url) {
        body.style.backgroundImage = `url('${url}')`;
        body.classList.add('custom-bg');
        body.classList.remove('theme-day', 'theme-night');
    }
    function removeCustomBackground() {
        body.style.backgroundImage = '';
        body.classList.remove('custom-bg');
        loadThemePreference();
    }
    function updateBgOptionsUI() {
        if (!bgDefaultOption || !bgCustomOption) return;
        bgDefaultOption.classList.toggle('active', !usingCustomBg);
        bgCustomOption.classList.toggle('active', usingCustomBg);
    }

    // ========== 用户数据 ==========
    function saveUserData(qq, nickname, avatarUrl) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ qq, nickname, avatarUrl, lastLogin: new Date().toISOString() }));
        hidePasswordHintPermanently();
    }
    function loadUserData() {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    }
    function clearUserData() { localStorage.removeItem(STORAGE_KEY); }
    function hidePasswordHintPermanently() { if (passwordHint) passwordHint.classList.add('hidden'); localStorage.setItem(HINT_SHOWN_KEY, 'false'); }

    // ========== 登录视图 ==========
    function showLoginView() {
        if (loginView) loginView.style.display = 'flex';
        if (profileView) { profileView.classList.remove('visible'); profileView.style.display = 'none'; }
        isLoggedIn = false;
        checkPasswordHintVisibility();
    }
    function showProfileView() {
        if (loginView) loginView.style.display = 'none';
        if (profileView) { profileView.style.display = 'flex'; profileView.classList.add('visible'); }
        updateStatsDisplay(); updateHeartStats();
    }
    function updateAvatarPreview(qq) {
        if (!qq || !/^\d+$/.test(qq)) {
            if (avatarImg) avatarImg.style.display = 'none';
            if (avatarPlaceholder) avatarPlaceholder.style.display = 'block';
        } else {
            if (avatarImg) {
                avatarImg.src = `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=640`;
                avatarImg.style.display = 'block';
            }
            if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
        }
    }
    function checkSavedUser() {
        const ud = loadUserData();
        if (ud?.qq) {
            isLoggedIn = true; currentQQ = ud.qq; currentNickname = ud.nickname;
            if (profileAvatar) profileAvatar.src = ud.avatarUrl;
            if (nicknameInput) nicknameInput.value = ud.nickname;
            if (displayQQ) displayQQ.textContent = ud.qq;
            showProfileView();
            hidePasswordHintPermanently();
            return true;
        }
        return false;
    }
    function checkPasswordHintVisibility() {
        const userData = loadUserData();
        const hintShown = localStorage.getItem(HINT_SHOWN_KEY);
        if (userData || hintShown === 'false') {
            if (passwordHint) passwordHint.classList.add('hidden');
        } else {
            if (passwordHint) passwordHint.classList.remove('hidden');
        }
    }

    // ========== 打卡数据 ==========
    function loadCheckinData() {
        const saved = localStorage.getItem(CHECKIN_STORAGE_KEY);
        if (saved) { checkinData = JSON.parse(saved); } else { initDefaultCheckinData(); }
        updateStreak();
    }
    function initDefaultCheckinData() { checkinData = { records: [], protectedDays: [], currentStreak: 0, maxStreak: 0, totalCheckins: 0, protectCards: 0 }; }
    function saveCheckinData() { localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(checkinData)); }
    function updateStreak() {
        let streak = 0, checkDate = new Date();
        while (true) {
            const dateStr = formatDate(checkDate);
            if (checkinData.records.includes(dateStr) || checkinData.protectedDays.includes(dateStr)) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else break;
        }
        checkinData.currentStreak = streak;
        if (streak > checkinData.maxStreak) checkinData.maxStreak = streak;
        updateStatsDisplay(); saveCheckinData();
    }
    function updateStatsDisplay() {
        if (currentStreakEl) currentStreakEl.textContent = checkinData.currentStreak;
        if (totalCheckinsEl) totalCheckinsEl.textContent = checkinData.totalCheckins;
        if (protectCardsEl) protectCardsEl.textContent = checkinData.protectCards;
        if (profileCurrentStreak) profileCurrentStreak.textContent = checkinData.currentStreak;
        if (profileTotalCheckins) profileTotalCheckins.textContent = checkinData.totalCheckins;
        if (profileProtectCards) profileProtectCards.textContent = checkinData.protectCards;
    }
    function canCheckinToday() { const today = formatDate(new Date()); return !checkinData.records.includes(today) && !checkinData.protectedDays.includes(today); }
    window.handleCheckin = function() {
        if (!isLoggedIn) { showToast('请先登录', 'error'); switchPage('profile'); return; }
        const today = formatDate(new Date());
        if (!canCheckinToday()) { showToast('今天已经打卡过了', 'info'); return; }
        const yesterday = formatDate(new Date(Date.now() - 86400000));
        const hasYesterday = checkinData.records.includes(yesterday) || checkinData.protectedDays.includes(yesterday);
        if (!hasYesterday && checkinData.currentStreak > 0) {
            if (checkinData.protectCards > 0 && confirm('昨天忘记打卡了，是否使用一张保护卡？')) {
                checkinData.protectCards--; checkinData.protectedDays.push(yesterday); showToast('已使用保护卡', 'protect');
            } else { checkinData.currentStreak = 0; }
        }
        checkinData.records.push(today); checkinData.totalCheckins++;
        updateStreak();
        if (checkinData.currentStreak % 7 === 0 && checkinData.currentStreak > 0) { checkinData.protectCards++; showToast('🎉 获得一张保护卡'); }
        saveCheckinData(); renderCalendar(); updateStatsDisplay(); showToast('打卡成功！');
    };

    // ========== 日历 ==========
    function formatDate(date) { const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
    function getMonthDays(date) {
        const year = date.getFullYear(), month = date.getMonth(), firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0), firstWeekDay = firstDay.getDay();
        const days = [];
        for (let i = firstWeekDay - 1; i >= 0; i--) { let d = new Date(year, month, -i); days.push({ date: formatDate(d), day: d.getDate(), isOther: true }); }
        for (let i = 1; i <= lastDay.getDate(); i++) { let d = new Date(year, month, i); days.push({ date: formatDate(d), day: i, isOther: false }); }
        const remain = 42 - days.length;
        for (let i = 1; i <= remain; i++) { let d = new Date(year, month + 1, i); days.push({ date: formatDate(d), day: d.getDate(), isOther: true }); }
        return days;
    }
    function renderCalendar() {
        if (!calendarGrid) return;
        const days = getMonthDays(currentMonth), today = formatDate(new Date());
        let html = '';
        days.forEach(item => {
            let cls = 'calendar-day';
            if (item.isOther) cls += ' other-month';
            if (item.date === today) cls += ' day-today';
            if (checkinData.records.includes(item.date)) cls += ' day-checked';
            else if (checkinData.protectedDays.includes(item.date)) cls += ' day-protected';
            html += `<div class="${cls}" title="${item.date}">${item.day}</div>`;
        });
        calendarGrid.innerHTML = html;
        if (checkinBtn) checkinBtn.disabled = !canCheckinToday();
    }
    function initYearSelect() {
        if (!calendarYearSelect) return;
        const currentYear = new Date().getFullYear();
        for (let year = currentYear - 2; year <= currentYear + 2; year++) {
            let opt = document.createElement('option'); opt.value = year; opt.textContent = year + '年';
            if (year === currentMonth.getFullYear()) opt.selected = true;
            calendarYearSelect.appendChild(opt);
        }
    }
    window.changeYear = function(year) { currentMonth.setFullYear(parseInt(year)); renderCalendar(); if (calendarMonthSelect) calendarMonthSelect.value = currentMonth.getMonth(); };
    window.changeMonth = function(month) { currentMonth.setMonth(parseInt(month)); renderCalendar(); };
    window.changeMonthOffset = function(offset) { currentMonth.setMonth(currentMonth.getMonth() + offset); renderCalendar(); if (calendarYearSelect) calendarYearSelect.value = currentMonth.getFullYear(); if (calendarMonthSelect) calendarMonthSelect.value = currentMonth.getMonth(); };
    window.goToToday = function() { currentMonth = new Date(); renderCalendar(); updateDailyQuote(); if (calendarYearSelect) calendarYearSelect.value = currentMonth.getFullYear(); if (calendarMonthSelect) calendarMonthSelect.value = currentMonth.getMonth(); showToast('已回到今天'); };

    // ========== 心记 ==========
    function loadHearts() {
        const saved = localStorage.getItem(HEART_STORAGE_KEY);
        if (saved) { hearts = JSON.parse(saved); } else { hearts = []; saveHearts(); }
    }
    function saveHearts() { localStorage.setItem(HEART_STORAGE_KEY, JSON.stringify(hearts)); }
    function getCurrentTime() { const n = new Date(); return `${n.getFullYear()}/${String(n.getMonth() + 1).padStart(2, '0')}/${String(n.getDate()).padStart(2, '0')} ${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`; }
    function renderHearts() {
        if (!heartList) return;
        if (hearts.length === 0) { heartList.innerHTML = '<div class="heart-empty"><i class="far fa-heart"></i><p>还没有心记</p></div>'; return; }
        heartList.innerHTML = hearts.map((h, i) => `
            <div class="heart-item">
                <div class="heart-item-actions">
                    <button class="edit-btn" onclick="editHeart(${i})"><i class="fas fa-pen"></i></button>
                    <button class="delete-btn" onclick="deleteHeart(${i})"><i class="fas fa-trash"></i></button>
                </div>
                <div class="heart-item-time"><i class="far fa-clock"></i> ${h.time}</div>
                <div class="heart-item-content">${escapeHtml(h.content)}</div>
            </div>`).join('');
    }
    function updateHeartStats() { if (heartCount) heartCount.textContent = hearts.length; if (heartCountDisplay) heartCountDisplay.textContent = hearts.length; }
    function escapeHtml(t) { if (!t) return ''; let div = document.createElement('div'); div.textContent = t; return div.innerHTML; }
    window.addHeart = function() {
        if (!heartText) return;
        let content = heartText.value.trim();
        if (!content) { showToast('写点心里话', 'error'); return; }
        hearts.unshift({ time: getCurrentTime(), content: content });
        heartText.value = ''; saveHearts(); renderHearts(); updateHeartStats(); showToast('✨ 已保存');
    };
    window.editHeart = function(index) { let c = prompt('编辑心记', hearts[index].content); if (c && c.trim() !== '') { hearts[index].content = c.trim(); hearts[index].time = getCurrentTime() + ' (已编辑)'; saveHearts(); renderHearts(); showToast('已更新', 'edit'); } };
    window.deleteHeart = function(index) { if (confirm('确定删除？')) { hearts.splice(index, 1); saveHearts(); renderHearts(); updateHeartStats(); showToast('已删除', 'info'); } };
    window.clearAllHearts = function() { if (hearts.length && confirm('清空全部心记？')) { hearts = []; saveHearts(); renderHearts(); updateHeartStats(); showToast('已清空', 'info'); } };
    function updateDailyQuote() { if (dailyQuote) dailyQuote.textContent = quotes[Math.floor(Math.random() * quotes.length)]; }
    const quotes = ["每一天都是新的开始", "你比想象中更坚强", "小小的进步也是胜利", "今天也要像向日葵一样", "你存在本身就是一种美好"];

    // ========== 音乐播放器 (修复版) ==========
    const DEFAULT_SONGS = [
        { name: '默认歌曲1', url: 'https://music.163.com/song/media/outer/url?id=2079386848.mp3' },
        { name: '默认歌曲2', url: 'https://music.163.com/song/media/outer/url?id=2079386848.mp3' },
        { name: '默认歌曲3', url: 'https://music.163.com/song/media/outer/url?id=2079386848.mp3' }
    ];
    let playlist = []; let currentIndex = 0; let isPlaying = false; let audioElement = null;

    function loadPlaylist() {
        const saved = localStorage.getItem(MUSIC_STORAGE_KEY);
        if (saved) { 
            try { playlist = JSON.parse(saved); } catch { playlist = [...DEFAULT_SONGS]; } 
        } else playlist = [...DEFAULT_SONGS];
        playlist.forEach((item, i) => { if (!item.name) item.name = `歌曲${i + 1}`; });
        savePlaylist();
    }
    function savePlaylist() { localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(playlist)); }
    function initAudio() {
        if (!audioElement) {
            audioElement = new Audio();
            audioElement.loop = false;
            audioElement.addEventListener('ended', () => { 
                if (playlist.length) { 
                    currentIndex = (currentIndex + 1) % playlist.length; 
                    playCurrent(true); 
                } 
            });
            audioElement.addEventListener('error', (e) => { 
                console.error('播放错误', e);
                if (playlist.length > 1) { 
                    currentIndex = (currentIndex + 1) % playlist.length; 
                    playCurrent(true); 
                } else {
                    isPlaying = false;
                    document.getElementById('musicPlayPauseBtn').innerHTML = '<i class="fas fa-play"></i>';
                }
            });
        }
    }
    function updateNowPlayingDisplay() { 
        const display = document.getElementById('nowPlayingDisplay');
        if (display) display.innerText = `🎵 ${playlist[currentIndex]?.name || '无歌曲'}`; 
    }
    function playCurrent(autoPlay = false) {
        if (!playlist.length) return;
        initAudio();
        let current = playlist[currentIndex];
        audioElement.src = current.url;
        audioElement.load(); // 确保加载
        audioElement.play().then(() => {
            isPlaying = true;
            const playBtn = document.getElementById('musicPlayPauseBtn');
            if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            updateNowPlayingDisplay();
            if (!autoPlay) showToast(`播放: ${current.name}`);
        }).catch(err => {
            console.error('播放失败', err);
            isPlaying = false;
            const playBtn = document.getElementById('musicPlayPauseBtn');
            if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
            showToast('播放失败，请检查链接', 'error');
        });
    }
    function playPause() {
        if (!playlist.length) return;
        if (isPlaying) { 
            if (audioElement) audioElement.pause(); 
            isPlaying = false; 
            const playBtn = document.getElementById('musicPlayPauseBtn');
            if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
            showToast('已暂停', 'info'); 
        } else { 
            playCurrent(); 
        }
    }
    function playNext() { 
        if (playlist.length) { 
            currentIndex = (currentIndex + 1) % playlist.length; 
            if (isPlaying) playCurrent(true); 
            else updateNowPlayingDisplay(); 
        } 
    }
    function playPrev() { 
        if (playlist.length) { 
            currentIndex = (currentIndex - 1 + playlist.length) % playlist.length; 
            if (isPlaying) playCurrent(true); 
            else updateNowPlayingDisplay(); 
        } 
    }
    function addSongFromInput() {
        let input = document.getElementById('newSongInput');
        if (!input) return;
        let url = input.value.trim();
        if (!url) return;
        let name = prompt('输入歌曲名称', '新歌');
        if (name === null) return;
        playlist.push({ name: name || '新歌', url });
        savePlaylist(); input.value = ''; showToast(`已添加《${name}》`);
        if (playlist.length === 1) { currentIndex = 0; updateNowPlayingDisplay(); }
    }
    function toggleEditMode() { 
        const area = document.getElementById('musicEditArea');
        if (area) area.style.display = area.style.display === 'none' ? 'flex' : 'none'; 
    }

    function initMusicPlayer() {
        loadPlaylist(); 
        currentIndex = 0; 
        updateNowPlayingDisplay();
        
        const toggleBtn = document.getElementById('musicToggleBtn');
        const panel = document.getElementById('musicPanel');
        const playBtn = document.getElementById('musicPlayPauseBtn');
        const nextBtn = document.getElementById('musicNextBtn');
        const prevBtn = document.getElementById('musicPrevBtn');
        const addBtn = document.getElementById('musicAddBtn');
        const addSongBtn = document.getElementById('addSongBtn');
        
        if (toggleBtn) toggleBtn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            if (panel) panel.classList.toggle('show'); 
        });
        if (playBtn) playBtn.addEventListener('click', playPause);
        if (nextBtn) nextBtn.addEventListener('click', playNext);
        if (prevBtn) prevBtn.addEventListener('click', playPrev);
        if (addBtn) addBtn.addEventListener('click', toggleEditMode);
        if (addSongBtn) addSongBtn.addEventListener('click', addSongFromInput);
        
        document.addEventListener('click', (e) => {
            if (!panel || !toggleBtn) return;
            if (!panel.contains(e.target) && !toggleBtn.contains(e.target) && panel.classList.contains('show')) {
                panel.classList.remove('show');
            }
        });
        
        // 自动播放第一首
        setTimeout(() => { if (playlist.length && !isPlaying) playCurrent(true); }, 1000);
    }

    // ========== 事件绑定 ==========
    tabs.forEach(tab => tab.addEventListener('click', e => { e.preventDefault(); switchPage(tab.dataset.page); }));
    if (settingsEntry) settingsEntry.addEventListener('click', () => switchPage('settings'));
    if (settingsBackBtn) settingsBackBtn.addEventListener('click', () => switchPage('profile'));
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);
    if (settingsAboutBtn) settingsAboutBtn.addEventListener('click', () => { drawer.classList.add('active'); drawerOverlay.classList.add('active'); });
    if (manualGoBtn && manualRoomUrl) manualGoBtn.addEventListener('click', () => window.open(manualRoomUrl.value.trim(), '_blank'));

    if (passwordToggle && passwordInput && passwordToggleIcon) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            passwordToggleIcon.className = type === 'text' ? 'fas fa-eye-slash' : 'fas fa-eye';
        });
    }
    if (qqInput) qqInput.addEventListener('input', e => updateAvatarPreview(e.target.value.trim()));
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            let qq = qqInput ? qqInput.value.trim() : '';
            let pwd = passwordInput ? passwordInput.value.trim() : '';
            if (!qq || !/^\d+$/.test(qq)) { showToast('请输入有效QQ号码', 'error'); return; }
            if (pwd !== '123456' && pwd !== '') { showToast('密码错误', 'error'); return; }
            showToast('登录成功');
            setTimeout(() => {
                isLoggedIn = true; currentQQ = qq;
                let avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=640`;
                if (profileAvatar) profileAvatar.src = avatarUrl;
                if (nicknameInput) { currentNickname = Math.floor(10000000 + Math.random() * 90000000).toString(); nicknameInput.value = currentNickname; }
                if (displayQQ) displayQQ.textContent = qq;
                saveUserData(qq, currentNickname, avatarUrl);
                showProfileView();
            }, 800);
        });
    }
    if (saveNicknameBtn) {
        saveNicknameBtn.addEventListener('click', function() {
            let nn = nicknameInput ? nicknameInput.value.trim() : '';
            if (nn) { 
                currentNickname = nn; 
                let ud = loadUserData(); 
                if (ud) { 
                    ud.nickname = nn; 
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(ud)); 
                } 
                showToast('昵称已更新', 'edit'); 
            } else showToast('昵称不能为空', 'error');
        });
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            clearUserData(); isLoggedIn = false; currentQQ = '';
            if (avatarImg) { avatarImg.src = ''; avatarImg.style.display = 'none'; }
            if (avatarPlaceholder) avatarPlaceholder.style.display = 'block';
            if (profileAvatar) profileAvatar.src = '';
            if (qqInput) qqInput.value = '';
            if (nicknameInput) nicknameInput.value = '';
            if (displayQQ) displayQQ.textContent = '-';
            showLoginView(); showToast('已退出登录', 'logout');
            if (!profilePage.classList.contains('active')) switchPage('profile');
        });
    }

    if (themeDayOption) themeDayOption.addEventListener('click', () => setTheme('day'));
    if (themeNightOption) themeNightOption.addEventListener('click', () => setTheme('night'));

    if (bgDefaultOption) bgDefaultOption.addEventListener('click', () => { saveBackgroundImage(null); loadThemePreference(); showToast('默认背景'); });
    if (bgCustomOption) bgCustomOption.addEventListener('click', () => { if (bgImageInput) bgImageInput.click(); });
    if (bgUploadBtn && bgImageInput) {
        bgUploadBtn.addEventListener('click', e => { e.stopPropagation(); bgImageInput.click(); });
        bgImageInput.addEventListener('change', e => {
            if (e.target.files[0]) {
                let file = e.target.files[0];
                if (!file.type.match('image.*')) { showToast('请选择图片', 'error'); return; }
                let reader = new FileReader();
                reader.onload = function(e) {
                    let dataUrl = e.target.result;
                    if (customBgPreview) { customBgPreview.style.backgroundImage = `url('${dataUrl}')`; customBgPreview.innerHTML = ''; }
                    saveBackgroundImage(dataUrl); showToast('背景已应用');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ========== 初始化 ==========
    loadThemePreference();
    loadBackgroundImage();
    loadCheckinData();
    loadHearts();
    initYearSelect();
    renderCalendar();
    updateDailyQuote();
    renderHearts();
    updateStatsDisplay();
    updateHeartStats();
    
    // 缩放初始化
    const savedZoom = localStorage.getItem(ZOOM_KEY);
    if (savedZoom) { currentZoom = parseInt(savedZoom); } else { currentZoom = 100; }
    applyZoom();
    
    initMusicPlayer();

    if (!checkSavedUser()) { showLoginView(); switchPage('profile'); }
    else { pages.forEach(p => p.classList.remove('active')); profilePage.classList.add('active'); tabs.forEach(t => { t.classList.remove('active'); if (t.dataset.page === 'profile') t.classList.add('active'); }); }
    setInterval(updateDailyQuote, 60000);
})();
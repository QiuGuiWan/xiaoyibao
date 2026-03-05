// ========== 秋归晚论坛 - 主逻辑 (整合日历和日记) ==========
(function() {
    // ---------- 常量 ----------
    const STORAGE_KEY = 'userData';
    const DIARY_STORAGE_KEY = 'healingDiary';  // 日记存储键名
    const HINT_SHOWN_KEY = 'passwordHintShown';
    const THEME_PREF_KEY = 'themePreference';
    const BG_IMAGE_KEY = 'customBackgroundImage';
    
    // ---------- 状态变量 ----------
    let isLoggedIn = false;
    let currentQQ = '';
    let currentNickname = '';
    let usingCustomBg = false;
    
    // 日历相关变量
    let currentMonth = new Date();
    let signRecords = [];      // 签到记录 ['2024-03-15', ...]
    let reSignRecords = [];    // 补签记录
    
    // 日记相关变量
    let diaries = [];          // 日记数组 [{ time, content }, ...]

    // ---------- DOM 元素获取 ----------
    // 页面容器
    const tabs = document.querySelectorAll('.tab-item');
    const pages = document.querySelectorAll('.page');
    const homePage = document.getElementById('home');
    const friendsPage = document.getElementById('friends');
    const workspacePage = document.getElementById('workspace');
    const profilePage = document.getElementById('profile');
    const settingsPage = document.getElementById('settings');

    // 登录相关
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

    // 密码切换相关
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordToggleIcon = document.getElementById('passwordToggleIcon');

    // 设置入口
    const settingsEntry = document.getElementById('settingsEntry');

    // 设置页面相关
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

    // 抽屉
    const drawer = document.getElementById('drawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawerClose = document.getElementById('drawerClose');

    // 主题切换
    const body = document.body;

    // 弹窗
    const toast = document.getElementById('customToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.querySelector('.custom-toast .toast-icon');

    // 日记相关元素
    const diaryText = document.getElementById('diaryText');
    const diaryList = document.getElementById('diaryList');
    const diaryCountDisplay = document.getElementById('diaryCountDisplay');
    const diaryCount = document.getElementById('diaryCount');
    const signCount = document.getElementById('signCount');
    const streakCount = document.getElementById('streakCount');

    // 日历相关元素
    const calendarTitle = document.getElementById('calendar-title');
    const calendarGrid = document.getElementById('calendar-grid');
    const dailyQuote = document.getElementById('dailyQuote');

    // ---------- 治愈语录库 ----------
    const quotes = [
        "每一天都是新的开始，温柔地对待自己。",
        "你比想象中更坚强，也值得被温柔以待。",
        "小小的进步，也是值得庆祝的胜利。",
        "今天也要像向日葵一样，向着阳光生长。",
        "允许自己偶尔停下来，休息是为了走更远的路。",
        "你存在本身，就是一种美好。",
        "慢慢来，一切都来得及。",
        "今天有在好好爱自己吗？",
        "每一个认真生活的日子，都值得被记录。",
        "你温柔对待世界，世界也会温柔待你。",
        "今天也要做个温暖的人呀。",
        "记得给自己一个微笑，你真的很棒。"
    ];

    // ---------- 通用函数 ----------
    
    /**
     * 切换页面
     * @param {string} pageName - 页面名称
     */
    function switchPage(pageName) {
        pages.forEach(page => page.classList.remove('active'));
        
        if (pageName === 'home') homePage.classList.add('active');
        else if (pageName === 'friends') friendsPage.classList.add('active');
        else if (pageName === 'workspace') workspacePage.classList.add('active');
        else if (pageName === 'profile') profilePage.classList.add('active');
        else if (pageName === 'settings') settingsPage.classList.add('active');
        
        if (pageName !== 'settings') {
            tabs.forEach(tab => {
                tab.classList.remove('active');
                if (tab.dataset.page === pageName) tab.classList.add('active');
            });
        }

        if (drawer && drawer.classList.contains('active')) {
            closeDrawer();
        }
    }

    /**
     * 显示自定义弹窗
     */
    function showToast(message, type = 'success', duration = 2000) {
        if (!toast || !toastMessage || !toastIcon) return;
        
        toastMessage.textContent = message;
        
        switch(type) {
            case 'success':
                toastIcon.className = 'fas fa-check-circle toast-icon';
                break;
            case 'error':
                toastIcon.className = 'fas fa-times-circle toast-icon';
                break;
            case 'edit':
                toastIcon.className = 'fas fa-pencil-alt toast-icon';
                break;
            case 'logout':
                toastIcon.className = 'fas fa-sign-out-alt toast-icon';
                break;
            default:
                toastIcon.className = 'fas fa-check-circle toast-icon';
        }
        
        toast.classList.add('show');
        
        clearTimeout(window.toastTimer);
        window.toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // ---------- 密码显示切换功能 ----------
    function initPasswordToggle() {
        if (!passwordToggle || !passwordInput || !passwordToggleIcon) return;
        
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            if (type === 'text') {
                passwordToggleIcon.className = 'fas fa-eye-slash';
            } else {
                passwordToggleIcon.className = 'fas fa-eye';
            }
        });
    }

    // ---------- 密码提示隐藏逻辑 ----------
    function checkPasswordHintVisibility() {
        if (!passwordHint) return;
        
        const userData = loadUserData();
        const hintShown = localStorage.getItem(HINT_SHOWN_KEY);
        
        if (userData || hintShown === 'false') {
            passwordHint.classList.add('hidden');
        } else {
            passwordHint.classList.remove('hidden');
        }
    }

    function hidePasswordHintPermanently() {
        if (passwordHint) {
            passwordHint.classList.add('hidden');
        }
        localStorage.setItem(HINT_SHOWN_KEY, 'false');
    }

    // ---------- 本地存储操作 ----------
    
    function saveUserData(qq, nickname, avatarUrl) {
        const userData = {
            qq: qq,
            nickname: nickname,
            avatarUrl: avatarUrl,
            lastLogin: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        hidePasswordHintPermanently();
    }

    function loadUserData() {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error('解析用户数据失败', e);
            }
        }
        return null;
    }

    function clearUserData() {
        localStorage.removeItem(STORAGE_KEY);
    }

    // ---------- 日记存储 ----------
    function loadDiaries() {
        const saved = localStorage.getItem(DIARY_STORAGE_KEY);
        if (saved) {
            try {
                diaries = JSON.parse(saved);
            } catch (e) {
                console.error('解析日记失败', e);
                diaries = [];
            }
        } else {
            // 添加一些治愈的示例日记
            diaries = [
                { time: getCurrentTime(), content: '今天阳光很好，走在路上感觉很温暖。要学会像太阳一样，温暖自己，也温暖他人。' },
                { time: getCurrentTime(), content: '完成了今天的任务，虽然有点累，但是很有成就感。慢慢来，一切都会变好的。' }
            ];
            saveDiaries();
        }
    }

    function saveDiaries() {
        localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(diaries));
    }

    // ---------- 签到记录存储 (模拟) ----------
    function loadSignRecords() {
        // 模拟一些签到数据
        const today = formatDate(new Date());
        const yesterday = formatDate(new Date(Date.now() - 86400000));
        const twoDaysAgo = formatDate(new Date(Date.now() - 2 * 86400000));
        
        signRecords = [twoDaysAgo, yesterday, today];  // 连续三天打卡
        reSignRecords = [];  // 没有补签
        
        // 随机加一些历史打卡
        for (let i = 3; i < 10; i++) {
            const date = formatDate(new Date(Date.now() - i * 86400000));
            if (Math.random() > 0.3) {  // 70%概率打卡
                signRecords.push(date);
            }
        }
    }

    // ---------- 更新统计信息 ----------
    function updateStats() {
        if (diaryCount) diaryCount.textContent = diaries.length;
        if (signCount) signCount.textContent = signRecords.length;
        
        // 计算连续打卡天数
        let streak = 0;
        const today = formatDate(new Date());
        let checkDate = new Date();
        
        while (signRecords.includes(formatDate(checkDate))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        if (streakCount) streakCount.textContent = streak;
    }

    // ---------- 随机更换治愈语录 ----------
    function updateDailyQuote() {
        if (dailyQuote) {
            const randomIndex = Math.floor(Math.random() * quotes.length);
            dailyQuote.textContent = quotes[randomIndex];
        }
    }

    // ---------- 日历函数 ----------
    function formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getMonthDays(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstWeekDay = firstDay.getDay();
        
        const days = [];
        
        // 添加上月
        for(let i = firstWeekDay - 1; i >= 0; i--) {
            const d = new Date(year, month, -i);
            days.push({
                date: formatDate(d),
                day: d.getDate(),
                isOther: true
            });
        }
        
        // 添加当月
        for(let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            days.push({
                date: formatDate(d),
                day: i,
                isOther: false
            });
        }
        
        // 补充下月
        const remain = 42 - days.length;
        for(let i = 1; i <= remain; i++) {
            const d = new Date(year, month + 1, i);
            days.push({
                date: formatDate(d),
                day: d.getDate(),
                isOther: true
            });
        }
        
        return days;
    }

    function renderCalendar() {
        if (!calendarTitle || !calendarGrid) return;
        
        calendarTitle.innerText = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;
        
        const days = getMonthDays(currentMonth);
        const today = formatDate(new Date());
        
        let html = '';
        days.forEach(item => {
            let cls = 'calendar-day';
            if(item.isOther) cls += ' other-month';
            if(item.date === today) cls += ' day-today';
            
            if(signRecords.includes(item.date)) {
                cls += reSignRecords.includes(item.date) ? ' day-resign' : ' day-sign';
            }
            
            html += `<div class="${cls}" title="${item.date}">${item.day}</div>`;
        });
        
        calendarGrid.innerHTML = html;
    }

    window.changeMonth = function(step) {
        currentMonth.setMonth(currentMonth.getMonth() + step);
        renderCalendar();
    };

    window.goToToday = function() {
        currentMonth = new Date();
        renderCalendar();
        updateDailyQuote();  // 顺便换一句语录
    };

    // ---------- 日记函数 ----------
    function getCurrentTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');
        return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.addDiary = function() {
        if (!diaryText) return;
        
        const content = diaryText.value.trim();
        
        if (!content) {
            showToast('写点温暖的话再保存吧', 'error', 1500);
            return;
        }
        
        diaries.unshift({
            time: getCurrentTime(),
            content: content
        });
        
        diaryText.value = '';
        saveDiaries();
        renderDiaries();
        updateStats();
        showToast('✨ 治愈日记已保存', 'success', 1500);
    };

    function renderDiaries() {
        if (!diaryList || !diaryCountDisplay) return;
        
        diaryCountDisplay.textContent = diaries.length;
        
        if (diaries.length === 0) {
            diaryList.innerHTML = `
                <div class="diary-empty">
                    <i class="far fa-smile"></i>
                    <p>还没有日记，写点温暖的事吧~</p>
                </div>
            `;
            return;
        }
        
        const html = diaries.map((diary, index) => `
            <div class="diary-item">
                <div class="diary-item-actions">
                    <button class="edit-btn" onclick="editDiary(${index})" title="编辑">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteDiary(${index})" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="diary-item-time">
                    <i class="far fa-clock"></i> ${diary.time}
                </div>
                <div class="diary-item-content">
                    ${escapeHtml(diary.content)}
                </div>
            </div>
        `).join('');
        
        diaryList.innerHTML = html;
    }

    window.editDiary = function(index) {
        const diary = diaries[index];
        const newContent = prompt('编辑你的治愈日记：', diary.content);
        
        if (newContent !== null && newContent.trim() !== '') {
            diary.content = newContent.trim();
            diary.time = getCurrentTime() + ' (已编辑)';
            saveDiaries();
            renderDiaries();
            showToast('日记已更新', 'edit', 1500);
        }
    };

    window.deleteDiary = function(index) {
        if (confirm('确定要删除这条温暖记录吗？')) {
            diaries.splice(index, 1);
            saveDiaries();
            renderDiaries();
            updateStats();
            showToast('日记已删除', 'info', 1500);
        }
    };

    window.clearAllDiaries = function() {
        if (diaries.length === 0) return;
        
        if (confirm(`确定要清空全部 ${diaries.length} 条治愈日记吗？`)) {
            diaries = [];
            saveDiaries();
            renderDiaries();
            updateStats();
            showToast('所有日记已清空', 'info', 1500);
        }
    };

    // ---------- 背景图片存储 ----------
    function saveBackgroundImage(imageDataUrl) {
        if (imageDataUrl) {
            localStorage.setItem(BG_IMAGE_KEY, imageDataUrl);
            usingCustomBg = true;
            applyCustomBackground(imageDataUrl);
        } else {
            localStorage.removeItem(BG_IMAGE_KEY);
            usingCustomBg = false;
            removeCustomBackground();
        }
        updateBgOptionsUI();
    }

    function loadBackgroundImage() {
        const savedBg = localStorage.getItem(BG_IMAGE_KEY);
        if (savedBg) {
            usingCustomBg = true;
            applyCustomBackground(savedBg);
            if (customBgPreview) {
                customBgPreview.style.backgroundImage = `url('${savedBg}')`;
                customBgPreview.innerHTML = '';
            }
        } else {
            usingCustomBg = false;
            removeCustomBackground();
        }
        updateBgOptionsUI();
    }

    function applyCustomBackground(imageUrl) {
        body.style.backgroundImage = `url('${imageUrl}')`;
        body.classList.add('custom-bg');
        body.classList.remove('theme-day', 'theme-night');
    }

    function removeCustomBackground() {
        body.style.backgroundImage = '';
        body.classList.remove('custom-bg');
        loadThemePreference();
    }

    // ---------- 登录视图切换 ----------
    
    function showLoginView() {
        if (loginView) loginView.style.display = 'flex';
        if (profileView) {
            profileView.classList.remove('visible');
            profileView.style.display = 'none';
        }
        isLoggedIn = false;
        checkPasswordHintVisibility();
    }

    function showProfileView() {
        if (loginView) loginView.style.display = 'none';
        if (profileView) {
            profileView.style.display = 'flex';
            profileView.classList.add('visible');
        }
        updateStats();  // 显示统计信息
    }

    function updateAvatarPreview(qq) {
        if (!avatarImg || !avatarPlaceholder) return;
        
        if (qq && /^\d+$/.test(qq)) {
            const avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=640`;
            avatarImg.src = avatarUrl;
            avatarImg.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
        } else {
            avatarImg.style.display = 'none';
            avatarPlaceholder.style.display = 'block';
        }
    }

    function generateRandomNickname() {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    }

    function checkSavedUser() {
        const userData = loadUserData();
        if (userData && userData.qq) {
            isLoggedIn = true;
            currentQQ = userData.qq;
            currentNickname = userData.nickname;
            
            if (profileAvatar) profileAvatar.src = userData.avatarUrl;
            if (nicknameInput) nicknameInput.value = userData.nickname;
            if (displayQQ) displayQQ.textContent = userData.qq;
            
            showProfileView();
            hidePasswordHintPermanently();
            
            return true;
        }
        return false;
    }

    // ---------- 抽屉操作 ----------
    
    function openDrawer() {
        drawer.classList.add('active');
        drawerOverlay.classList.add('active');
    }

    function closeDrawer() {
        drawer.classList.remove('active');
        drawerOverlay.classList.remove('active');
    }

    // ---------- 主题切换 ----------
    
    function loadThemePreference() {
        const savedTheme = localStorage.getItem(THEME_PREF_KEY);
        if (savedTheme === 'night') {
            body.classList.remove('theme-day');
            body.classList.add('theme-night');
        } else {
            body.classList.remove('theme-night');
            body.classList.add('theme-day');
        }
        updateThemeUI();
    }

    function setTheme(theme) {
        if (theme === 'night') {
            body.classList.remove('theme-day');
            body.classList.add('theme-night');
            localStorage.setItem(THEME_PREF_KEY, 'night');
        } else {
            body.classList.remove('theme-night');
            body.classList.add('theme-day');
            localStorage.setItem(THEME_PREF_KEY, 'day');
        }
        
        if (usingCustomBg) {
            saveBackgroundImage(null);
        }
        
        updateThemeUI();
        showToast('主题已切换', 'success', 1500);
    }

    function updateThemeUI() {
        const isNight = body.classList.contains('theme-night');
        
        if (themeDayOption && themeNightOption) {
            if (isNight) {
                themeDayOption.classList.remove('active');
                themeNightOption.classList.add('active');
            } else {
                themeDayOption.classList.add('active');
                themeNightOption.classList.remove('active');
            }
        }
    }

    function updateBgOptionsUI() {
        if (!bgDefaultOption || !bgCustomOption) return;
        
        if (usingCustomBg) {
            bgDefaultOption.classList.remove('active');
            bgCustomOption.classList.add('active');
            if (bgNote) bgNote.style.display = 'flex';
        } else {
            bgDefaultOption.classList.add('active');
            bgCustomOption.classList.remove('active');
            if (bgNote) bgNote.style.display = 'none';
        }
    }

    // ---------- 图片上传处理 ----------
    function handleImageUpload(file) {
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            showToast('请选择图片文件', 'error', 1500);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageDataUrl = e.target.result;
            
            if (customBgPreview) {
                customBgPreview.style.backgroundImage = `url('${imageDataUrl}')`;
                customBgPreview.innerHTML = '';
            }
            
            saveBackgroundImage(imageDataUrl);
            showToast('背景图片已应用', 'success', 1500);
        };
        reader.readAsDataURL(file);
    }

    // ---------- 事件绑定 ----------
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const pageName = this.dataset.page;
            switchPage(pageName);
        });
    });

    if (settingsEntry) {
        settingsEntry.addEventListener('click', function() {
            switchPage('settings');
            updateThemeUI();
            updateBgOptionsUI();
        });
    }

    if (settingsBackBtn) {
        settingsBackBtn.addEventListener('click', function() {
            switchPage('profile');
        });
    }

    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

    if (settingsAboutBtn) {
        settingsAboutBtn.addEventListener('click', openDrawer);
    }

    if (qqInput) {
        qqInput.addEventListener('input', function(e) {
            const qq = e.target.value.trim();
            updateAvatarPreview(qq);
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            const qq = qqInput ? qqInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value.trim() : '';

            if (!qq || !/^\d+$/.test(qq)) {
                showToast('请输入有效的QQ号码', 'error', 1500);
                return;
            }

            if (password !== '123456' && password !== '') {
                showToast('密码错误，默认密码为123456', 'error', 1500);
                return;
            }

            showToast('登录成功', 'success', 1500);
            
            setTimeout(() => {
                isLoggedIn = true;
                currentQQ = qq;
                
                const avatarUrl = `https://q1.qlogo.cn/g?b=qq&nk=${qq}&s=640`;
                
                if (profileAvatar) profileAvatar.src = avatarUrl;
                
                if (nicknameInput) {
                    currentNickname = generateRandomNickname();
                    nicknameInput.value = currentNickname;
                }
                
                if (displayQQ) displayQQ.textContent = qq;
                
                saveUserData(qq, currentNickname, avatarUrl);
                
                showProfileView();
                
                tabs.forEach(tab => {
                    if (tab.dataset.page === 'profile') {
                        tab.classList.add('active');
                    }
                });
            }, 800);
        });
    }

    if (saveNicknameBtn) {
        saveNicknameBtn.addEventListener('click', function() {
            const newNickname = nicknameInput ? nicknameInput.value.trim() : '';
            if (newNickname) {
                currentNickname = newNickname;
                const userData = loadUserData();
                if (userData) {
                    userData.nickname = newNickname;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
                }
                showToast('昵称已更新', 'edit', 1500);
            } else {
                showToast('昵称不能为空', 'error', 1500);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            clearUserData();
            
            isLoggedIn = false;
            currentQQ = '';
            currentNickname = '';
            
            if (avatarImg) {
                avatarImg.src = '';
                avatarImg.style.display = 'none';
            }
            if (avatarPlaceholder) {
                avatarPlaceholder.style.display = 'block';
            }
            
            if (profileAvatar) profileAvatar.src = '';
            if (qqInput) qqInput.value = '';
            if (nicknameInput) nicknameInput.value = '';
            if (displayQQ) displayQQ.textContent = '-';
            
            showLoginView();
            showToast('已退出登录', 'logout', 1500);
            
            if (!profilePage.classList.contains('active')) {
                switchPage('profile');
            }
        });
    }

    if (themeDayOption) {
        themeDayOption.addEventListener('click', function() {
            setTheme('day');
        });
    }

    if (themeNightOption) {
        themeNightOption.addEventListener('click', function() {
            setTheme('night');
        });
    }

    if (bgDefaultOption) {
        bgDefaultOption.addEventListener('click', function() {
            saveBackgroundImage(null);
            loadThemePreference();
            showToast('已使用默认背景', 'success', 1500);
        });
    }

    if (bgCustomOption) {
        bgCustomOption.addEventListener('click', function() {
            if (bgImageInput) {
                bgImageInput.click();
            }
        });
    }

    if (bgUploadBtn && bgImageInput) {
        bgUploadBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            bgImageInput.click();
        });

        bgImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file);
            }
        });
    }

    // 添加键盘快捷键 Ctrl+Enter 保存日记
    if (diaryText) {
        diaryText.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                addDiary();
            }
        });
    }

    // ---------- 初始化 ----------
    
    initPasswordToggle();
    checkPasswordHintVisibility();
    loadThemePreference();
    loadBackgroundImage();
    loadDiaries();           // 加载日记
    loadSignRecords();       // 加载签到记录
    renderCalendar();        // 渲染日历
    updateDailyQuote();      // 更新治愈语录
    renderDiaries();         // 渲染日记列表
    updateStats();           // 更新统计信息

    if (!checkSavedUser()) {
        showLoginView();
        switchPage('profile');
    } else {
        pages.forEach(page => page.classList.remove('active'));
        profilePage.classList.add('active');
        tabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.page === 'profile') tab.classList.add('active');
        });
    }

    // 每隔一段时间自动更换语录 (可选)
    setInterval(updateDailyQuote, 60000); // 每分钟换一句
})();
<!-- index.html -->
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>秋归晚论坛 · 三文件版</title>
    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <!-- 外部样式 -->
    <link rel="stylesheet" href="style.css">
</head>
<body class="theme-day">
    <div class="fullscreen-app">
        <!-- 缩放控件 -->
        <div class="zoom-controls">
            <button class="zoom-btn" onclick="zoomOut()"><i class="fas fa-search-minus"></i></button>
            <span class="zoom-level" id="zoomLevel">100%</span>
            <button class="zoom-btn" onclick="zoomIn()"><i class="fas fa-search-plus"></i></button>
            <button class="zoom-btn" onclick="resetZoom()"><i class="fas fa-sync-alt"></i></button>
        </div>

        <!-- 音乐播放器组件 (修复版) -->
        <div class="music-player-entry">
            <div class="music-toggle-btn" id="musicToggleBtn"><i class="fas fa-music"></i></div>
            <div class="music-control-panel" id="musicPanel">
                <div class="now-playing" id="nowPlayingDisplay">🎵 未播放</div>
                <div class="music-buttons">
                    <button class="music-btn" id="musicPrevBtn"><i class="fas fa-step-backward"></i></button>
                    <button class="music-btn special" id="musicPlayPauseBtn"><i class="fas fa-play"></i></button>
                    <button class="music-btn" id="musicNextBtn"><i class="fas fa-step-forward"></i></button>
                    <button class="music-btn" id="musicAddBtn"><i class="fas fa-plus"></i></button>
                </div>
                <!-- 编辑区域 -->
                <div class="music-add-edit-area" id="musicEditArea" style="display: none;">
                    <div class="music-add-input">
                        <input type="text" id="newSongInput" placeholder="粘贴音乐链接（支持MP3直链）...">
                        <button id="addSongBtn"><i class="fas fa-check"></i> 添加</button>
                    </div>
                    <div class="edit-mode-hint"><i class="fas fa-info-circle"></i> 默认三首·循环播放</div>
                </div>
            </div>
        </div>

        <!-- 关于抽屉 -->
        <div class="drawer-overlay" id="drawerOverlay"></div>
        <div class="drawer" id="drawer">
            <div class="drawer-header">
                <span>关于</span>
                <div class="drawer-close" id="drawerClose"><i class="fas fa-times"></i></div>
            </div>
            <div class="about-panel" id="aboutPanel">
                <p>✨ 秋归晚论坛</p><p>版本: 1.0.4</p><p>作者: 秋归晚</p><p>当时年少青衫薄，骑马倚斜桥</p><p>企鹅🐧:2878494914</p>
            </div>
            <a href="https://b23.tv/skV63Jp" target="_blank" style="text-decoration:none;">
                <div class="drawer-item follow-btn"><i class="fas fa-heart drawer-item-icon"></i><span>关注作者 (B站)</span></div>
            </a>
        </div>

        <!-- 弹窗 -->
        <div id="customToast" class="custom-toast">
            <i class="fas fa-check-circle toast-icon"></i>
            <span class="toast-message" id="toastMessage">操作成功</span>
        </div>

        <!-- 主要内容区 -->
        <div class="content-area">
            <!-- 主页 - 心历 + 心记 -->
            <div id="home" class="page active">
                <div class="home-dual-container">
                    <!-- 心历卡片 -->
                    <div class="heart-calendar-card">
                        <h2 class="heart-calendar-title"><i class="fas fa-heart" style="color:#ff9f9f;"></i> 心历</h2>
                        <div class="calendar-header">
                            <div class="calendar-year-month">
                                <select id="calendarYearSelect" class="calendar-select"></select>
                                <select id="calendarMonthSelect" class="calendar-select">
                                    <option value="0">1月</option><option value="1">2月</option><option value="2">3月</option>
                                    <option value="3">4月</option><option value="4">5月</option><option value="5">6月</option>
                                    <option value="6">7月</option><option value="7">8月</option><option value="8">9月</option>
                                    <option value="9">10月</option><option value="10">11月</option><option value="11">12月</option>
                                </select>
                            </div>
                            <div class="calendar-nav-buttons">
                                <button class="calendar-nav-btn" onclick="changeMonthOffset(-1)"><i class="fas fa-chevron-left"></i></button>
                                <button class="calendar-nav-btn" onclick="changeMonthOffset(1)"><i class="fas fa-chevron-right"></i></button>
                            </div>
                        </div>
                        <div class="calendar-week">
                            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
                        </div>
                        <div class="calendar-grid" id="calendarGrid"></div>
                        <div class="calendar-footer">
                            <button class="checkin-btn" id="checkinBtn" onclick="handleCheckin()"><i class="fas fa-check-circle"></i> 今日打卡</button>
                            <div class="checkin-stats">
                                <div class="stat-item"><span class="stat-value" id="currentStreak">0</span><span class="stat-label">连续</span></div>
                                <div class="stat-item"><span class="stat-value" id="totalCheckins">0</span><span class="stat-label">累计</span></div>
                                <div class="stat-item"><span class="stat-value" id="protectCards">0</span><span class="stat-label">保护卡</span></div>
                            </div>
                        </div>
                        <div class="calendar-toolbar">
                            <button class="toolbar-btn" onclick="goToToday()"><i class="fas fa-calendar-day"></i> 回到今天</button>
                        </div>
                        <div class="calendar-legend">
                            <span class="legend-item"><span class="legend-color" style="background:var(--sign);"></span> 已打卡</span>
                            <span class="legend-item"><span class="legend-color" style="border:2px solid var(--main); background:transparent;"></span> 今天</span>
                            <span class="legend-item"><span class="legend-color" style="background:var(--resign);"></span> 保护打卡</span>
                        </div>
                    </div>
                    <!-- 心记卡片 -->
                    <div class="heart-diary-card">
                        <h2 class="heart-diary-title"><i class="fas fa-heart" style="color:#ff9f9f;"></i> 心记</h2>
                        <div class="heart-input-area">
                            <textarea id="heartText" class="heart-textarea" rows="3" placeholder="记录此刻的心情... ✨"></textarea>
                            <button class="heart-save-btn" onclick="addHeart()"><i class="fas fa-feather-alt"></i> 保存心记</button>
                        </div>
                        <div class="heart-list-header">
                            <span class="heart-count"><i class="far fa-heart"></i> 共 <span id="heartCountDisplay">0</span> 条心事</span>
                            <button class="heart-clear-btn" onclick="clearAllHearts()"><i class="far fa-trash-alt"></i></button>
                        </div>
                        <div class="heart-list" id="heartList"></div>
                        <div class="daily-quote">
                            <p class="quote-text-small" id="dailyQuote">每一天都是新的开始</p>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 好友页面 -->
            <div id="friends" class="page">
                <div class="friends-container">
                    <div class="friend-card">
                        <div class="friend-header"><i class="fas fa-user-friends"></i><h3>好友聊天室</h3></div>
                        <div class="friend-description"><i class="fas fa-comment-dots"></i> 点击下方按钮直接进入公共聊天室。</div>
                        <a href="https://chat.freserafim.com/zh-CN/rooms/5af7397a-674a-491f-baf8-e7f9c8f9a05c" target="_blank" style="text-decoration:none;">
                            <button class="friend-action-btn"><i class="fas fa-sign-in-alt"></i> 立即进入</button>
                        </a>
                        <div class="manual-section">
                            <div class="manual-label"><i class="fas fa-external-link-alt"></i> 备用URL</div>
                            <div class="manual-input-group">
                                <input type="text" class="manual-input" id="manualRoomUrl" value="https://chat.freserafim.com/zh-CN/rooms/5af7397a-674a-491f-baf8-e7f9c8f9a05c" readonly>
                                <button class="manual-go-btn" id="manualGoBtn"><i class="fas fa-arrow-right"></i> 访问</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 工作台 (恢复班级抽签) -->
            <div id="workspace" class="page">
                <div class="workspace-container">
                    <div class="draw-card" onclick="window.location.href='index3.html'">
                        <i class="fas fa-dice-d20 draw-icon"></i>
                        <h2 class="draw-title">班级抽签</h2>
                        <p class="draw-desc">点击进入抽签系统</p>
                        <div class="draw-badge"><i class="fas fa-star"></i> 新功能</div>
                    </div>
                    <div class="draw-card" onclick="window.open('https://www.codedex.io','_blank')">
                        <i class="fas fa-laptop-code draw-icon"></i>
                        <h2 class="draw-title">代码学习</h2>
                        <p class="draw-desc">免费编程课程</p>
                        <div class="feature-tags">
                            <span class="tag"><i class="fab fa-python"></i> Python</span>
                            <span class="tag"><i class="fab fa-js"></i> JavaScript</span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 个人空间 (修复头像比例) -->
            <div id="profile" class="page">
                <div id="loginView" class="login-only" style="display:flex;">
                    <div class="login-container">
                        <h2><i class="fab fa-qq"></i> QQ登录</h2>
                        <div class="qq-avatar" id="avatarDisplay">
                            <img id="avatarImg" src="" style="display:none;" alt="头像">
                            <span id="avatarPlaceholder"><i class="fas fa-user-circle"></i> 输入QQ预览</span>
                        </div>
                        <input type="text" id="qqInput" class="input-field" placeholder="输入QQ号码">
                        <div class="password-wrapper">
                            <input type="password" id="passwordInput" class="input-field password-field" placeholder="密码" value="123456">
                            <button type="button" class="password-toggle" id="passwordToggle"><i class="fas fa-eye"></i></button>
                        </div>
                        <div id="passwordHint" class="password-hint"><i class="fas fa-lock"></i> 默认密码: 123456</div>
                        <button id="loginBtn" class="login-btn"><i class="fas fa-sign-in-alt"></i> 登录</button>
                    </div>
                </div>
                <div id="profileView" class="profile-container profile-only">
                    <div class="profile-sidebar">
                        <div class="profile-avatar-large"><img id="profileAvatar" src="" alt="用户头像"></div>
                        <div class="profile-name-section">
                            <input type="text" id="nicknameInput" class="profile-nickname-input" placeholder="昵称">
                            <button id="saveNicknameBtn" class="profile-save-btn"><i class="fas fa-save"></i></button>
                        </div>
                        <div class="profile-qq-info"><i class="fab fa-qq"></i> <span id="displayQQ">-</span></div>
                        <div class="profile-stats">
                            <div class="stat-item"><span class="stat-value" id="profileCurrentStreak">0</span><span class="stat-label">连续</span></div>
                            <div class="stat-item"><span class="stat-value" id="profileTotalCheckins">0</span><span class="stat-label">累计</span></div>
                            <div class="stat-item"><span class="stat-value" id="profileProtectCards">0</span><span class="stat-label">保护卡</span></div>
                        </div>
                        <div class="profile-heart-stats"><i class="fas fa-heart" style="color:#ff9f9f;"></i> <span id="heartCount">0</span> 条心记</div>
                        <button id="logoutBtn" class="profile-logout-btn"><i class="fas fa-sign-out-alt"></i> 退出</button>
                    </div>
                    <div class="profile-content-placeholder">
                        <i class="fas fa-heart" style="font-size:50px; color:#ff9f9f; opacity:0.5; margin-bottom:20px;"></i>
                        <p>心历和心记已整合到主页</p>
                        <button class="goto-home-btn" onclick="switchPage('home')"><i class="fas fa-arrow-right"></i> 前往主页</button>
                    </div>
                    <div class="settings-entry" id="settingsEntry"><i class="fas fa-cog"></i></div>
                </div>
            </div>
            <!-- 设置页面 -->
            <div id="settings" class="page">
                <div class="settings-container">
                    <div class="settings-header">
                        <h2><i class="fas fa-cog"></i> 设置中心</h2>
                        <button class="settings-back-btn" id="settingsBackBtn"><i class="fas fa-arrow-left"></i> 返回</button>
                    </div>
                    <div class="settings-group">
                        <h3 class="settings-group-title"><i class="fas fa-palette"></i> 主题</h3>
                        <div class="theme-options">
                            <div class="theme-option" id="themeDayOption">
                                <div class="theme-preview theme-preview-day"></div>
                                <span class="theme-name">日间</span><i class="fas fa-check theme-check"></i>
                            </div>
                            <div class="theme-option" id="themeNightOption">
                                <div class="theme-preview theme-preview-night"></div>
                                <span class="theme-name">夜间</span><i class="fas fa-check theme-check"></i>
                            </div>
                        </div>
                    </div>
                    <div class="settings-group">
                        <h3 class="settings-group-title"><i class="fas fa-image"></i> 背景</h3>
                        <div class="bg-options">
                            <div class="bg-option" id="bgDefaultOption">
                                <div class="bg-preview bg-preview-default"></div>
                                <span class="bg-name">默认</span><i class="fas fa-check bg-check"></i>
                            </div>
                            <div class="bg-option" id="bgCustomOption">
                                <div class="bg-preview bg-preview-custom" id="customBgPreview"><i class="fas fa-plus"></i></div>
                                <span class="bg-name">自定义</span>
                                <input type="file" id="bgImageInput" accept="image/*" style="display:none;">
                                <button class="bg-upload-btn" id="bgUploadBtn"><i class="fas fa-upload"></i> 选择</button>
                            </div>
                        </div>
                    </div>
                    <div class="settings-footer">
                        <button class="settings-footer-btn" id="settingsAboutBtn"><i class="fas fa-info-circle"></i> 关于</button>
                        <a href="https://b23.tv/skV63Jp" target="_blank" class="settings-footer-btn"><i class="fas fa-heart"></i> 关注</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- 底栏导航 -->
        <div class="glass-tabbar">
            <div class="tab-item active" data-page="home"><i class="fas fa-home tab-icon"></i><span class="tab-label">主页</span></div>
            <div class="tab-item" data-page="friends"><i class="fas fa-user-friends tab-icon"></i><span class="tab-label">好友</span></div>
            <div class="tab-item" data-page="workspace"><i class="fas fa-tools tab-icon"></i><span class="tab-label">工作台</span></div>
            <div class="tab-item" data-page="profile"><i class="fas fa-user tab-icon"></i><span class="tab-label">个人</span></div>
        </div>
    </div>

    <!-- 外部脚本 -->
    <script src="script.js"></script>
</body>
</html>

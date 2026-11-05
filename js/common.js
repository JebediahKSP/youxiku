(function () {
  'use strict';

  // ========== 微信/QQ 浏览器环境检测引导 ==========
  function checkWeChatQQ() {
    var ua = navigator.userAgent.toLowerCase();
    var isWeChat = ua.indexOf('micromessenger') !== -1;
    var isQQ = ua.indexOf(' qq') !== -1; // 注意前面的空格，防止误杀部分机型
    // 如果是微信/QQ，且用户没关闭过提示
    if ((isWeChat || isQQ) && !sessionStorage.getItem('guide_closed')) {
      var guide = document.createElement('div');
      guide.id = 'wechat-guide';
      guide.className = 'show';
      guide.innerHTML = `
        <div class="guide-arrow">↗</div>
        <div class="guide-text">
          为了获得最佳体验（支持直接下载）<br>
          请点击右上角 <span>···</span><br>
          选择 <span>“在浏览器中打开”</span>
        </div>
      `;
      document.body.appendChild(guide);
      
      // 点击遮罩关闭（本次会话不再显示）
      guide.addEventListener('click', function() {
        guide.classList.remove('show');
        sessionStorage.setItem('guide_closed', 'true');
      });
    }
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light-theme');
  }

  window.toast = function (msg, duration) {
    duration = duration || 2200;
    var el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(function () { el.classList.remove('show'); }, duration);
  };

  var fallbackImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'%3E%3Crect width='200' height='100' fill='%23f5f5f7'/%3E%3Ctext x='100' y='55' font-family='Arial' font-size='14' fill='%23d1d1d6' text-anchor='middle'%3E极速游戏库%3C/text%3E%3C/svg%3E";
  document.addEventListener('error', function(e) {
    if (e.target.tagName.toLowerCase() === 'img') {
      if (!e.target.src.includes('data:image/svg+xml')) {
        e.target.src = fallbackImg;
        e.target.style.objectFit = 'contain';
        e.target.classList.remove('img-blur');
        e.target.classList.add('img-loaded');
      }
    }
  }, true);

  window.renderRanking = function(data) {
    var container = document.getElementById('rankList');
    if (!container || !Array.isArray(data)) return;
    
    var stats = JSON.parse(localStorage.getItem('download_stats') || '{}');
    var sorted = [...data].sort((a, b) => (stats[b.id] || 0) - (stats[a.id] || 0)).slice(0, 5);
    
    if (sorted.length === 0) {
      container.innerHTML = '<li style="padding:10px;color:var(--text-dim);text-align:center;">暂无数据</li>';
      return;
    }

    var isPage = location.pathname.includes('/pages/');
    var basePath = isPage ? 'game.html' : 'pages/game.html';

    container.innerHTML = sorted.map((g, i) => {
      var count = stats[g.id] || 0;
      var color = i === 0 ? '#ff3b30' : (i === 1 ? '#ff9500' : (i === 2 ? '#ffcc00' : 'var(--text-dim)'));
      return `<li>
        <a href="${basePath}?id=${g.id}" style="display:flex; justify-content:space-between; align-items:center; width:100%; padding: 8px 0;">
          <span style="display:flex; align-items:center; gap:8px; overflow:hidden;">
            <span style="color:${color}; font-weight:bold; min-width:16px;">${i+1}</span>
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${g.name}</span>
          </span>
          <span style="font-size:13px; color:var(--text-dim);">${count}次</span>
        </a>
      </li>`;
    }).join('');
  };

  document.addEventListener('DOMContentLoaded', function () {
    checkWeChatQQ(); // 运行微信检测

    var isPage = location.pathname.includes('/pages/');
    var basePath = isPage ? '../' : '';

    document.addEventListener('keydown', function(e) {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        var searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    });

    var dayEl = document.getElementById('siteDays');
    if (dayEl) {
      var siteStartDateStr = '2026-11-04'; 
      var start = new Date(siteStartDateStr);
      var now = new Date();
      start.setHours(0,0,0,0);
      now.setHours(0,0,0,0);
      var diffTime = Math.abs(now - start);
      var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      dayEl.textContent = diffDays === 0 ? 1 : diffDays; 
    }

    var mobileSelect = document.getElementById('mobileNavSelect');
    if (mobileSelect) {
      mobileSelect.addEventListener('change', function() {
        if(this.value !== "") location.href = this.value;
      });
    }

    if (!localStorage.getItem('announcement_hide')) {
      var ann = document.createElement('div');
      ann.className = 'announcement-bar';
      ann.innerHTML = '📢 欢迎来到极速游戏库！本站资源已全量接入夸克网盘，下载速度起飞！ <button class="ann-close" onclick="closeAnn()">✕</button>';
      document.body.insertBefore(ann, document.body.firstChild);
    }

    var fabHtml = `
      <div class="fab-container">
        <div class="fab-menu">
          <button class="fab-item" onclick="openModal('group')" title="加入交流群">💬</button>
          <button class="fab-item" onclick="openModal('support')" title="赞赏支持">☕</button>
          <button class="fab-item" onclick="openModal('notice')" title="免责声明">📄</button>
          <button class="fab-item" onclick="location.href='${basePath}admin.html'" title="站长控制台">🛠️</button>
          <button class="fab-item" onclick="window.scrollTo({top:0,behavior:'smooth'})" title="返回顶部">⬆️</button>
        </div>
        <button class="fab-main" onclick="document.querySelector('.fab-menu').classList.toggle('show')">⚙️</button>
      </div>
      <div class="modal-overlay" id="modalOverlay" onclick="closeModal(event)">
        <div class="modal-box">
          <button class="modal-close" onclick="closeModal(event)">✕</button>
          <div id="modalContent"></div>
        </div>
      </div>
    `;
    var fabWrap = document.createElement('div');
    fabWrap.innerHTML = fabHtml;
    document.body.appendChild(fabWrap);

    window.openModal = function(type) {
      var content = '';
      if (type === 'group') {
        content = `
          <h3 style="text-align:center;margin-bottom:16px;">赛博精神病收容所</h3>
          <div style="text-align:center;margin-bottom:16px;">
            <img src="${basePath}images/qq-group.jpg" alt="QQ群二维码" style="width:100%;max-width:240px;border-radius:12px;border:1px solid var(--glass-border);margin:0 auto;display:block;">
          </div>
          <p style="text-align:center;font-size:14px;margin-bottom:8px;">
            群号：<strong style="color:var(--brand);font-size:16px;">1128541840</strong>
            <button onclick="navigator.clipboard.writeText('1128541840').then(()=>toast('群号已复制，快去QQ搜索吧！'))" style="margin-left:8px;padding:4px 10px;border-radius:4px;border:1px solid var(--glass-border);background:rgba(255,255,255,0.6);color:var(--text);cursor:pointer;font-size:12px;">复制群号</button>
          </p>
          <p style="text-align:center;font-size:12px;color:var(--text-dim);margin-bottom:16px;">群主 QQ：1197262294</p>
          <div style="background:rgba(255,255,255,0.4);padding:16px;border-radius:8px;font-size:13px;color:var(--text-dim);line-height:1.8;">
            <strong>📌 进群须知：</strong><br>
            1. 本站资源主打夸克网盘，<strong>无解压密码</strong>，解压即玩。<br>
            2. 链接失效或文件被吞，进群直接艾特群主补档。<br>
            3. 拒绝内卷，只聊游戏，严禁广告！
          </div>
        `;
      } else if (type === 'support') {
        content = `
          <h3 style="text-align:center;margin-bottom:8px;">☕ 请作者喝杯咖啡</h3>
          <p style="text-align:center;font-size:13px;color:var(--text-dim);margin-bottom:16px;">您的支持是本站持续更新的最大动力！</p>
          <div style="text-align:center;">
            <img src="${basePath}images/support.jpg" alt="赞赏码" style="width:100%;max-width:240px;border-radius:12px;border:1px solid var(--glass-border);margin:0 auto;display:block;">
          </div>
        `;
      } else if (type === 'notice') {
        content = '<h3>📄 免责声明与安装说明</h3><p>1. 本站所有资源均来自网络，仅供学习交流，请于下载后24小时内删除。</p><p>2. 如遇缺少运行库报错，请安装目录内 _CommonRedist 文件夹下的对应组件。</p>';
      }
      document.getElementById('modalContent').innerHTML = content;
      document.getElementById('modalOverlay').classList.add('show');
    };

    window.closeModal = function(e) {
      if (!e || e.target.id === 'modalOverlay' || e.target.classList.contains('modal-close')) {
        document.getElementById('modalOverlay').classList.remove('show');
      }
    };

    window.closeAnn = function() {
      document.querySelector('.announcement-bar').style.display = 'none';
      localStorage.setItem('announcement_hide', 'true');
    };

    var header = document.querySelector('header');
    window.addEventListener('scroll', function() {
      var top = window.pageYOffset || document.documentElement.scrollTop;
      if (header) header.classList.toggle('scrolled', top > 10);
    }, { passive: true });

    var navInner = document.querySelector('.nav-inner');
    if (navInner) {
      navInner.addEventListener('click', function (e) {
        var link = e.target.closest('a');
        if (!link) return;
        var cat = link.getAttribute('data-category');
        if (cat && cat !== '首页' && !document.getElementById('gameList')) {
          e.preventDefault();
          location.href = basePath + 'index.html?cat=' + encodeURIComponent(cat);
        }
      });
    }

    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: .1 }) : null;
    window.observeReveal = function (root) {
      (root || document).querySelectorAll('.reveal:not(.in)').forEach(function (n) {
        if (io) io.observe(n); else n.classList.add('in');
      });
    };
    window.observeReveal(document);
  });
})();
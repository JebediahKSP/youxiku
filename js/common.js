(function () {
  'use strict';

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

  // 全局图片加载失败兜底（防破图）
  var fallbackImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 100'%3E%3Crect width='200' height='100' fill='%23141417'/%3E%3Ctext x='100' y='55' font-family='Arial' font-size='14' fill='%23666' text-anchor='middle'%3E极速游戏库%3C/text%3E%3C/svg%3E";
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

  // 全局热度排行榜渲染引擎
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
      var color = i === 0 ? '#ff4d4f' : (i === 1 ? '#ff7a45' : (i === 2 ? '#ffa940' : 'var(--text-dim)'));
      return `<li>
        <a href="${basePath}?id=${g.id}" style="display:flex; justify-content:space-between; align-items:center; width:100%; padding: 8px 0;">
          <span style="display:flex; align-items:center; gap:8px; overflow:hidden;">
            <span style="color:${color}; font-weight:bold; min-width:16px;">${i+1}</span>
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px;">${g.name}</span>
          </span>
          <span style="font-size:12px; color:var(--text-dim);">${count}次</span>
        </a>
      </li>`;
    }).join('');
  };

  document.addEventListener('DOMContentLoaded', function () {
    var isPage = location.pathname.includes('/pages/');
    var basePath = isPage ? '../' : '';

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
            <img src="${basePath}images/qq-group.jpg" alt="QQ群二维码" style="width:100%;max-width:240px;border-radius:12px;border:1px solid var(--border);margin:0 auto;display:block;">
          </div>
          <p style="text-align:center;font-size:14px;margin-bottom:8px;">
            群号：<strong style="color:var(--brand);font-size:16px;">1128541840</strong>
            <button onclick="navigator.clipboard.writeText('1128541840').then(()=>toast('群号已复制，快去QQ搜索吧！'))" style="margin-left:8px;padding:4px 10px;border-radius:4px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);cursor:pointer;font-size:12px;">复制群号</button>
          </p>
          <p style="text-align:center;font-size:12px;color:var(--text-dim);margin-bottom:16px;">群主 QQ：1197262294</p>
          <div style="background:rgba(255,255,255,.03);padding:12px;border-radius:8px;font-size:12px;color:var(--text-dim);line-height:1.8;">
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
            <img src="${basePath}images/support.png" alt="赞赏码" style="width:100%;max-width:240px;border-radius:12px;border:1px solid var(--border);margin:0 auto;display:block;">
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

    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.textContent = document.documentElement.classList.contains('light-theme') ? '☀️' : '🌙';
      themeBtn.addEventListener('click', function() {
        document.documentElement.classList.toggle('light-theme');
        const isLight = document.documentElement.classList.contains('light-theme');
        this.textContent = isLight ? '☀️' : '🌙';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
      });
    }

    var glow = document.createElement('div');
    glow.id = 'cursor-glow';
    document.body.appendChild(glow);
    var mouseX = 0, mouseY = 0, glowRaf = null;
    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
      if (!glowRaf) {
        glowRaf = requestAnimationFrame(function() {
          glow.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
          glowRaf = null;
        });
      }
    });

    var header = document.querySelector('header');
    var scrollRaf = null;
    function updateScroll() {
      var doc = document.documentElement;
      var top = window.pageYOffset || doc.scrollTop;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? (top / max) * 100 : 0;
      if (header) {
        header.style.setProperty('--progress', p.toFixed(2) + '%');
        header.classList.toggle('scrolled', top > 10);
      }
      scrollRaf = null;
    }
    window.addEventListener('scroll', function() {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(updateScroll);
    }, { passive: true });
    updateScroll();

    var navInner = document.querySelector('.nav-inner');
    if (navInner) {
      var indicator = document.createElement('div');
      indicator.className = 'nav-indicator';
      navInner.appendChild(indicator);
      window.moveNavIndicator = function (el) {
        if (!el) { indicator.style.opacity = 0; return; }
        indicator.style.left = el.offsetLeft + 'px';
        indicator.style.width = el.offsetWidth + 'px';
        indicator.style.opacity = 1;
      };
      navInner.addEventListener('mouseover', function (e) {
        var link = e.target.closest('a');
        if (link) window.moveNavIndicator(link);
      });
      navInner.addEventListener('mouseleave', function () {
        window.moveNavIndicator(navInner.querySelector('a.active'));
      });
      navInner.addEventListener('click', function (e) {
        var link = e.target.closest('a');
        if (!link) return;
        var cat = link.getAttribute('data-category');
        if (cat && cat !== '首页' && !document.getElementById('gameList')) {
          e.preventDefault();
          location.href = basePath + 'index.html?cat=' + encodeURIComponent(cat);
        }
      });
      setTimeout(function () { window.moveNavIndicator(navInner.querySelector('a.active')); }, 100);
    }

    window.bindCardSpotlight = function (card) {
      if (card._spotlight) return;
      card._spotlight = true;
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty('--cx', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--cy', (e.clientY - rect.top) + 'px');
      });
    };

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

    var searchContainer = document.querySelector('.search-container');
    var searchInput = document.getElementById('searchInput');
    var suggestBox = document.getElementById('searchSuggestions');

    if (searchContainer && searchInput && suggestBox) {
      var groupBtn = document.createElement('button');
      groupBtn.innerHTML = '💬';
      groupBtn.title = "加入交流群";
      groupBtn.onclick = function() { openModal('group'); };
      
      if (window.innerWidth < 768) {
        groupBtn.style.cssText = 'margin-left:8px; width:36px; height:36px; flex-shrink:0; border-radius:8px; border:1px solid var(--border); background:var(--card-bg); color:var(--text); cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center;';
        var searchBox = searchContainer.querySelector('.search-box');
        var wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.alignItems = 'center';
        searchContainer.insertBefore(wrap, searchBox);
        wrap.appendChild(searchBox);
        wrap.appendChild(groupBtn);
        searchBox.style.flex = '1';
      } else {
        groupBtn.style.cssText = 'position:absolute; right:-45px; top:50%; transform:translateY(-50%); width:34px; height:34px; border-radius:8px; border:1px solid var(--border); background:var(--card-bg); color:var(--text); cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; transition:all .2s;';
        searchContainer.appendChild(groupBtn);
        searchContainer.style.marginRight = '50px'; 
      }

      function saveSearchHistory(kw) {
        if (!kw) return;
        var history = JSON.parse(localStorage.getItem('search_history') || '[]');
        history = history.filter(item => item !== kw);
        history.unshift(kw);
        if (history.length > 5) history.pop();
        localStorage.setItem('search_history', JSON.stringify(history));
      }
      window.saveSearchHistory = saveSearchHistory;

      searchInput.addEventListener('focus', function() {
        var val = this.value.trim();
        if (!val) {
          var history = JSON.parse(localStorage.getItem('search_history') || '[]');
          if (history.length > 0) {
            suggestBox.innerHTML = history.map(kw => 
              `<div class="suggestion-item" onclick="location.href='${basePath}index.html?kw=${encodeURIComponent(kw)}'">
                 <span style="color:var(--text-dim); margin-right:8px;">🕒</span>${kw}
               </div>`
            ).join('');
            suggestBox.classList.add('show');
          }
        }
      });
    }
  });
})();
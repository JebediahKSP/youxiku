(function () {
  'use strict';
  var HOME_URL = '../index.html';
  var currentGame = null; 
  var currentLightboxIndex = 0;
  var lightboxImgs = [];

  function proxyImg(url) {
    if (!url) return '';
    if (url.includes('images.weserv.nl')) return url;
    return 'https://images.weserv.nl/?url=' + encodeURIComponent(url.replace('https://', '')) + '&w=400&output=webp';
  }

  window.toSearch = function () {
    var input = document.getElementById('searchInput');
    if (!input) return;
    var kw = input.value.trim();
    if (!kw) { toast('请输入游戏名称'); input.focus(); return; }
    location.href = HOME_URL + '?kw=' + encodeURIComponent(kw);
  };

  window.copyLink = function(text) {
    navigator.clipboard.writeText(text).then(() => toast('链接已复制，快去网盘APP打开吧！')).catch(() => toast('复制失败'));
  };

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('searchInput');
    var btn = document.getElementById('searchBtn');
    var suggestBox = document.getElementById('searchSuggestions');
    var urlParams = new URLSearchParams(window.location.search);
    var gameId = urlParams.get('id');

    if (btn) btn.addEventListener('click', window.toSearch);
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); window.toSearch(); }
      });
    }

    fetch('../data/games.json')
      .then(res => res.json())
      .then(data => {
        var countEl = document.getElementById('gameCount');
        if (countEl) countEl.textContent = data.length;

        if (input && suggestBox && Array.isArray(data)) {
          input.addEventListener('input', function() {
            var val = this.value.trim().toLowerCase();
            if (!val) { suggestBox.classList.remove('show'); return; }
            var matches = data.filter(g => g.name.toLowerCase().includes(val) || (g.aliases && g.aliases.some(a => a.toLowerCase().includes(val)))).slice(0, 5);
            if (matches.length) {
              suggestBox.innerHTML = matches.map(g => `<div class="suggestion-item" onclick="location.href='game.html?id=${g.id}'"><img src="${proxyImg(g.cover)}" referrerpolicy="no-referrer" loading="lazy"><span>${g.name}</span></div>`).join('');
              suggestBox.classList.add('show');
            } else {
              suggestBox.classList.remove('show');
            }
          });
          document.addEventListener('click', function(e) {
            if (!e.target.closest('.search-container')) suggestBox.classList.remove('show');
          });
        }

        if (!gameId) {
          document.querySelector('.main-box').innerHTML = '<div class="empty-tip">没有指定游戏 ID，请返回首页。</div>';
          return;
        }

        var game = Array.isArray(data) ? data.find(g => g.id === gameId) : null;
        if (!game) {
          document.querySelector('.main-box').innerHTML = '<div class="empty-tip">找不到该游戏，可能已下架。</div>';
          return;
        }
        currentGame = game;

        document.title = `${game.name} 下载 - 极速游戏库`;
        var metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = "description"; document.head.appendChild(metaDesc); }
        metaDesc.content = `${game.name}下载。${game.desc && game.desc.length > 0 ? game.desc[0] : ''}`;

        var bgBlur = document.getElementById('gameBgBlur');
        if (bgBlur) bgBlur.style.backgroundImage = `url(${proxyImg(game.cover)})`;

        var catName = (game.category && game.category.length > 0) ? game.category[0] : '单机游戏';
        var breadHtml = `<a href="../index.html">首页</a> <span>></span> <a href="../index.html?cat=${encodeURIComponent(catName)}">${catName}</a> <span>></span> <span style="color:var(--text)">${game.name}</span>`;
        document.getElementById('breadcrumb').innerHTML = breadHtml;

        document.getElementById('gameTitle').innerHTML = `${game.name} <span>(${game.en_name || ''})</span>`;
        
        var coverImg = document.getElementById('gameCover');
        coverImg.classList.add('img-blur');
        coverImg.src = proxyImg(game.cover);
        coverImg.alt = game.name;
        coverImg.setAttribute('referrerpolicy', 'no-referrer');
        coverImg.setAttribute('crossorigin', 'anonymous'); 
        if (coverImg.complete) {
          coverImg.classList.remove('img-blur'); coverImg.classList.add('img-loaded');
        } else {
          coverImg.onload = function() { this.classList.remove('img-blur'); this.classList.add('img-loaded'); };
        }

        var tagsContainer = document.getElementById('gameTags');
        if (game.tags && game.tags.length > 0 && tagsContainer) {
          tagsContainer.innerHTML = game.tags.map(t => 
            `<a href="../index.html?tag=${encodeURIComponent(t)}" class="game-tag" style="text-decoration:none;"># ${t}</a>`
          ).join('');
        }

        renderRating(gameId);

        if (game.guide) {
          document.getElementById('gameGuideBox').style.display = 'block';
          document.getElementById('gameGuide').innerHTML = game.guide;
        }

        document.getElementById('gameDesc').innerHTML = game.desc ? game.desc.map(p => `<p class="game-desc">${p}</p>`).join('') : '';

        var shotEl = document.getElementById('screenshotSlider');
        if (game.screenshots && Array.isArray(game.screenshots)) {
          shotEl.innerHTML = game.screenshots.map(src => 
            `<a class="shot" href="javascript:void(0)"><img src="${proxyImg(src)}" class="img-blur" alt="截图" loading="lazy" referrerpolicy="no-referrer" onload="this.classList.remove('img-blur'); this.classList.add('img-loaded');"></a>`
          ).join('');
        }

        if (game.config && game.config.min && game.config.rec) {
          document.getElementById('configMin').innerHTML = `
            <h4>最低配置</h4>
            <div>系统：${game.config.min.os || '-'}</div><div>CPU：${game.config.min.cpu || '-'}</div>
            <div>内存：${game.config.min.ram || '-'}</div><div>显卡：${game.config.min.gpu || '-'}</div>
            <div>硬盘：${game.config.min.disk || '-'}</div>`;
          document.getElementById('configRec').innerHTML = `
            <h4>推荐配置</h4>
            <div>系统：${game.config.rec.os || '-'}</div><div>CPU：${game.config.rec.cpu || '-'}</div>
            <div>内存：${game.config.rec.ram || '-'}</div><div>显卡：${game.config.rec.gpu || '-'}</div>
            <div>硬盘：${game.config.rec.disk || '-'}</div>`;
        }

        var dlArea = document.querySelector('.download-main');
        if (dlArea) {
          var officialLink = game.official; 
          var steamAppId = game.steam_appid;
          var pcLink = game.quark_pc || game.quark;
          var mbLink = game.quark_mobile;
          var btnHtml = '';

          // 【核心联动】判断该游戏是否有 MOD 数据，有的话显示专属按钮
          if (game.id === 'ksp' || game.id === 'citiesskylines') {
            btnHtml += `<a href="mod-game.html?id=${game.id}" class="download-btn" style="background:#ff9500; box-shadow:0 4px 12px rgba(255,149,0,0.3);">🛠️ 查看热门 MOD</a>`;
          }

          if (officialLink && officialLink.trim() !== '') {
            btnHtml += `<a href="${officialLink}" class="download-btn official-btn" target="_blank" rel="noopener noreferrer">🌐 前往官网</a>`;
          }
          if (steamAppId && steamAppId.trim() !== '') {
            btnHtml += `<a href="https://store.steampowered.com/app/${steamAppId}/" class="download-btn steam-btn" target="_blank" rel="noopener noreferrer">🎮 Steam 商店</a>`;
          }
          if (pcLink && pcLink.trim() !== '') {
            btnHtml += `<a href="${pcLink}" class="download-btn" target="_blank" rel="noopener noreferrer">💻 PC版下载</a>`;
            btnHtml += `<button class="download-btn" style="background:#f0f0f5; color:var(--text); box-shadow:none; border:1px solid var(--border);" onclick="copyLink('${pcLink}')">📋 复制链接</button>`;
          }
          if (mbLink && mbLink.trim() !== '') {
            btnHtml += `<a href="${mbLink}" class="download-btn mobile-btn" target="_blank" rel="noopener noreferrer">📱 手机版下载</a>`;
          }
          if (btnHtml === '') {
            btnHtml += `<span class="download-btn disabled-btn">暂无下载</span>`;
          }

          dlArea.innerHTML = `
            <div class="download-btn-group">
              ${btnHtml}
            </div>
            <div class="download-info">
              <div><strong>文件大小：</strong>${game.size || '未知'}</div>
              <div><strong>版本：</strong>${game.version || '未知'}</div>
            </div>
          `;

          var downloadLinks = dlArea.querySelectorAll('a[target="_blank"]');
          downloadLinks.forEach(function(link) {
            link.addEventListener('click', function() {
              var stats = JSON.parse(localStorage.getItem('download_stats') || '{}');
              stats[gameId] = (stats[gameId] || 0) + 1;
              localStorage.setItem('download_stats', JSON.stringify(stats));
              if (window.renderRanking) window.renderRanking(data);
            });
          });
        }

        var moyuEl = document.getElementById('moyuTip');
        if (moyuEl) {
          var h = new Date().getHours();
          var tip = "🎮 祝你游戏愉快！";
          if (h >= 0 && h < 6) tip = "🌙 凌晨修仙中，注意护肝。";
          else if (h >= 6 && h < 9) tip = "🌅 早起打游戏，一天好心情。";
          else if (h >= 9 && h < 12) tip = "💼 上午摸鱼时间。";
          else if (h >= 12 && h < 14) tip = "🍱 午休时间到。";
          else if (h >= 14 && h < 18) tip = "☕ 下午犯困，提提神吧。";
          else if (h >= 18 && h < 23) tip = "🎮 属于你的游戏时间！";
          moyuEl.textContent = tip;
        }

        var shots = document.querySelectorAll('.shot');
        if (shots.length) {
          lightboxImgs = Array.from(shots).map(s => s.querySelector('img').src);
          
          var lb = document.createElement('div');
          lb.className = 'lightbox';
          lb.innerHTML = '<button class="lightbox-close" type="button">✕</button><img alt="">';
          document.body.appendChild(lb);
          var lbImg = lb.querySelector('img');
          
          shots.forEach((s, index) => {
            s.addEventListener('click', function (e) {
              e.preventDefault();
              currentLightboxIndex = index;
              lbImg.src = lightboxImgs[currentLightboxIndex];
              lb.classList.add('show'); 
              document.body.style.overflow = 'hidden';
            });
          });

          lb.addEventListener('click', function (e) {
            if (e.target === lb || e.target.classList.contains('lightbox-close')) {
              lb.classList.remove('show'); document.body.style.overflow = '';
            }
          });

          document.addEventListener('keydown', function(e) {
            if (!lb.classList.contains('show')) return;
            if (e.key === 'ArrowLeft') {
              currentLightboxIndex = (currentLightboxIndex - 1 + lightboxImgs.length) % lightboxImgs.length;
              lbImg.src = lightboxImgs[currentLightboxIndex];
            } else if (e.key === 'ArrowRight') {
              currentLightboxIndex = (currentLightboxIndex + 1) % lightboxImgs.length;
              lbImg.src = lightboxImgs[currentLightboxIndex];
            }
          });
        }

        var relList = document.getElementById('relatedList');
        if (relList && Array.isArray(data)) {
          var otherGames = data.filter(g => g.id !== gameId);
          otherGames.forEach(function(g) {
            g.matchScore = 0;
            if (game.tags && g.tags) {
              game.tags.forEach(function(t) {
                if (g.tags.includes(t)) g.matchScore++;
              });
            }
            g.matchScore += Math.random() * 0.5; 
          });
          otherGames.sort((a, b) => b.matchScore - a.matchScore);
          var related = otherGames.slice(0, 3); 
          
          relList.innerHTML = related.map(g => `
            <a href="game.html?id=${g.id}" class="recommend-card">
              <img src="${proxyImg(g.cover)}" alt="${g.name}" referrerpolicy="no-referrer">
              <span>${g.name}</span>
            </a>
          `).join('');
        }

        var shareTextBtn = document.getElementById('shareTextBtn');
        if (shareTextBtn) {
          shareTextBtn.addEventListener('click', function() {
            var text = `【推荐游戏】${game.name}\n下载链接：${location.href}\n来自极速游戏库，全网无广告，无解压密码！`;
            navigator.clipboard.writeText(text).then(() => toast('分享文案已复制，快去发给朋友吧！')).catch(() => toast('复制失败'));
          });
        }

        var posterBtn = document.getElementById('posterBtn');
        if (posterBtn) {
          posterBtn.addEventListener('click', function() {
            generatePoster(game);
          });
        }

        if(window.renderRanking) window.renderRanking(data);
        loadGiscus(gameId, game.name);
      })
      .catch(err => {
        console.error(err);
        document.querySelector('.main-box').innerHTML = '<div class="empty-tip">数据加载失败，请刷新重试。</div>';
      });
  });

  function renderRating(gameId) {
    var ratingKey = 'rating_' + gameId;
    var savedRating = parseInt(localStorage.getItem(ratingKey)) || 0;
    var stars = document.querySelectorAll('#starsContainer span');
    var scoreEl = document.getElementById('ratingScore');
    
    function updateStars(val) {
      stars.forEach(s => {
        if (parseInt(s.getAttribute('data-val')) <= val) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
      if(val > 0) scoreEl.textContent = `我的评分：${val}.0 分`;
      else scoreEl.textContent = '点击星星评分';
    }

    if(savedRating > 0) updateStars(savedRating);

    stars.forEach(s => {
      s.addEventListener('click', function() {
        var val = parseInt(this.getAttribute('data-val'));
        localStorage.setItem(ratingKey, val);
        updateStars(val);
        toast('感谢您的评分！');
      });
    });
  }

  function generatePoster(game) {
    var modal = document.getElementById('posterModal');
    var canvas = document.getElementById('posterCanvas');
    if (!modal || !canvas) return;
    
    var ctx = canvas.getContext('2d');
    var w = 600; var h = 900;
    canvas.width = w; canvas.height = h;

    var img = new Image();
    img.crossOrigin = 'anonymous'; 
    img.src = proxyImg(game.cover);

    img.onload = function() {
      ctx.fillStyle = '#f5f5f7';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, 337);
      ctx.fillStyle = '#ffffff';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(40, 300, w-80, h-340, 24);
        ctx.fill();
      } else {
        ctx.fillRect(40, 300, w-80, h-340);
      }
      ctx.fillStyle = '#1d1d1f';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      var title = game.name;
      if(title.length > 12) title = title.substring(0, 12) + '...';
      ctx.fillText(title, w/2, 400);
      ctx.fillStyle = '#86868b';
      ctx.font = '24px sans-serif';
      ctx.fillText(game.type || '单机游戏', w/2, 450);
      ctx.strokeStyle = '#e5e5ea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100, 500);
      ctx.lineTo(w-100, 500);
      ctx.stroke();
      ctx.fillStyle = '#ff6600';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('扫码或访问网址获取', w/2, 580);
      ctx.fillStyle = '#1d1d1f';
      ctx.font = '28px monospace';
      var domain = window.location.hostname;
      ctx.fillText(domain, w/2, 640);
      ctx.fillStyle = '#86868b';
      ctx.font = '20px sans-serif';
      ctx.fillText('极速游戏库 · 免费无密码下载', w/2, 800);
      modal.classList.add('show');
    };
    img.onerror = function() { toast('封面加载失败，无法生成海报'); };
  }

  function loadGiscus(gameId, gameName) {
    var giscusContainer = document.querySelector('.giscus');
    if(!giscusContainer) return;
    var repoName = "你的GitHub用户名/你的仓库名";
    if (repoName.includes("你的GitHub用户名")) {
      giscusContainer.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-dim);border:1px dashed var(--glass-border);border-radius:8px;">💬 评论系统配置中...</div>';
      return;
    }
  }
})();
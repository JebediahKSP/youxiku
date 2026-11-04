(function () {
  'use strict';

  var gameData = [];
  var MAX_HOT_SLOTS = 4;
  var currentCategory = '首页';

  var quotes = [
    "不要相信光圈科技。——光圈实验室", "快去发射火箭吧，坎巴拉人！——KSP",
    "物理定律永远是对的，错的是你的推力不够。——宇宙沙盒", "今天你兽化了吗？——Changed",
    "下载千万条，安全第一条，解压不规范，亲人两行泪。", "如果找不到路，就跟着星星走。——极速游戏库"
  ];

  function getFavs() {
    try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch(e) { return []; }
  }
  
  function toggleFav(id, event) {
    if(event) { event.preventDefault(); event.stopPropagation(); }
    var favs = getFavs();
    if (favs.includes(id)) {
      favs = favs.filter(x => x !== id);
      toast('已取消收藏');
    } else {
      favs.push(id);
      toast('已添加到收藏 ❤️');
    }
    localStorage.setItem('favorites', JSON.stringify(favs));
    if (currentCategory === '我的收藏') {
      render(document.getElementById('searchInput').value);
    } else {
      document.querySelectorAll(`.card-fav-btn[data-id="${id}"]`).forEach(btn => btn.classList.toggle('active'));
    }
  }
  window.toggleFav = toggleFav;

  function cardHTML(g, i) {
    var isFav = getFavs().includes(g.id);
    var isNew = false;
    if (g.date_added) {
      var addTime = new Date(g.date_added).getTime();
      var now = new Date().getTime();
      if ((now - addTime) / (1000 * 3600 * 24) <= 7) isNew = true;
    }
    var newTag = isNew ? '<span class="new-tag">NEW</span>' : '';

    return `<a class="game-card reveal" style="--i:${i}" href="pages/game.html?id=${g.id}">
      ${newTag}
      <button class="card-fav-btn ${isFav ? 'active' : ''}" data-id="${g.id}" onclick="toggleFav('${g.id}', event)" title="收藏">❤</button>
      <img src="${g.cover}" class="img-blur" alt="${g.name}" loading="lazy" referrerpolicy="no-referrer" onload="this.classList.remove('img-blur'); this.classList.add('img-loaded');">
      <div class="game-card-info"><h4>${g.name}</h4><p>${g.type}</p></div>
    </a>`;
  }

  function matchGame(g, kw) {
    if (!kw) return true;
    if (g.name.toLowerCase().includes(kw)) return true;
    if (g.type.toLowerCase().includes(kw)) return true;
    if (g.aliases && g.aliases.some(a => a.toLowerCase().includes(kw))) return true;
    return false;
  }

  function fillPlaceholder(id, total) {
    var box = document.getElementById(id);
    if (!box) return;
    var have = box.querySelectorAll('.game-card').length;
    var need = Math.max(0, total - have);
    for (var i = 0; i < need; i++) {
      var d = document.createElement('div');
      d.className = 'game-card placeholder reveal';
      d.style.setProperty('--i', have + i);
      d.textContent = '更多游戏更新中';
      box.appendChild(d);
    }
  }

  function enhanceCards(root) {
    (root || document).querySelectorAll('.game-card:not(.placeholder):not(.skeleton)').forEach(c => {
      if (window.bindCardSpotlight) window.bindCardSpotlight(c);
    });
    if (window.observeReveal) window.observeReveal(root);
  }

  function renderSkeleton() {
    var skel = '<div class="game-card skeleton"></div><div class="game-card skeleton"></div><div class="game-card skeleton"></div><div class="game-card skeleton"></div>';
    if (document.getElementById('gameList')) document.getElementById('gameList').innerHTML = skel;
    if (document.getElementById('hotList')) document.getElementById('hotList').innerHTML = skel;
  }

  function render(keyword) {
    var kw = (keyword || '').trim().toLowerCase();
    var latestList = document.getElementById('gameList');
    var latestTitle = document.getElementById('latestTitle');
    var hotSection = document.getElementById('hotSection');
    var hotList = document.getElementById('hotList');

    if (kw) {
      var res = gameData.filter(g => matchGame(g, kw));
      latestTitle.innerHTML = `<span>搜索结果（${res.length}）</span>`;
      hotSection.hidden = true;
      latestList.innerHTML = res.length ? res.map(cardHTML).join('') : '<div class="empty-state"><div class="empty-icon">🔍</div><p>没有找到匹配的游戏，换个词试试吧。</p></div>';
      enhanceCards(latestList);
      return;
    }

    if (currentCategory === '我的收藏') {
      var favs = getFavs();
      var favRes = gameData.filter(g => favs.includes(g.id));
      latestTitle.innerHTML = `<span>我的收藏（${favRes.length}）</span>`;
      hotSection.hidden = true;
      latestList.innerHTML = favRes.length ? favRes.map(cardHTML).join('') : '<div class="empty-state"><div class="empty-icon">❤️</div><p>你还没有收藏任何游戏哦~</p></div>';
      enhanceCards(latestList);
      return;
    }

    if (currentCategory !== '首页') {
      var catRes = gameData.filter(g => g.category && g.category.includes(currentCategory));
      latestTitle.innerHTML = `<span>${currentCategory}（${catRes.length}）</span>`;
      hotSection.hidden = true;
      latestList.innerHTML = catRes.length ? catRes.map(cardHTML).join('') : '<div class="empty-state"><div class="empty-icon">🛸</div><p>该星区正在跃迁中，敬请期待...</p></div>';
      enhanceCards(latestList);
      return;
    }

    latestTitle.innerHTML = '<span>最新资源</span>';
    hotSection.hidden = false;
    latestList.innerHTML = gameData.filter(g => g.latest !== false).map(cardHTML).join('');
    hotList.innerHTML = gameData.filter(g => g.hot).map(cardHTML).join('');
    fillPlaceholder('hotList', MAX_HOT_SLOTS);
    enhanceCards(latestList);
    enhanceCards(hotList);
  }

  function switchCategory(cat) {
    currentCategory = cat;
    var navBar = document.getElementById('navBar');
    var pills = document.getElementById('filterPills');
    if (document.getElementById('searchSuggestions')) document.getElementById('searchSuggestions').classList.remove('show');

    if (navBar) {
      navBar.querySelectorAll('a').forEach(a => a.classList.remove('active'));
      var navMatch = navBar.querySelector(`a[data-category="${cat}"]`);
      if (navMatch) {
        navMatch.classList.add('active');
        if (window.moveNavIndicator) window.moveNavIndicator(navMatch);
      }
    }
    if (pills) {
      pills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      var pillMatch = pills.querySelector(`.pill[data-filter="${cat}"]`);
      if (pillMatch) pillMatch.classList.add('active');
    }
  }

  window.searchGame = function () {
    switchCategory('首页');
    render(document.getElementById('searchInput').value);
  };

  document.addEventListener('DOMContentLoaded', function () {
    var input = document.getElementById('searchInput');
    var btn = document.getElementById('searchBtn');
    var navBar = document.getElementById('navBar');
    var pills = document.getElementById('filterPills');
    var suggestBox = document.getElementById('searchSuggestions');

    var qEl = document.getElementById('dailyQuote');
    if (qEl) qEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    renderSkeleton();

    if (btn) btn.addEventListener('click', window.searchGame);
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); window.searchGame(); }
      });
      input.addEventListener('input', function () {
        var val = this.value.trim().toLowerCase();
        if (!val) {
          suggestBox.classList.remove('show');
          if (currentCategory === '首页') switchCategory('首页');
          render('');
          return;
        }
        var matches = gameData.filter(g => matchGame(g, val)).slice(0, 5);
        if (matches.length > 0) {
          suggestBox.innerHTML = matches.map(g => 
            `<div class="suggestion-item" onclick="location.href='pages/game.html?id=${g.id}'">
               <img src="${g.cover}" referrerpolicy="no-referrer" alt=""><span>${g.name}</span>
             </div>`
          ).join('');
          suggestBox.classList.add('show');
        } else {
          suggestBox.classList.remove('show');
        }
      });
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) suggestBox.classList.remove('show');
      });
    }

    var randomBtn = document.getElementById('randomBtn');
    if (randomBtn) {
      randomBtn.addEventListener('click', function() {
        if(!gameData.length) return;
        var randomGame = gameData[Math.floor(Math.random() * gameData.length)];
        location.href = 'pages/game.html?id=' + randomGame.id;
      });
    }

    if (navBar) {
      navBar.addEventListener('click', function (e) {
        var link = e.target.closest('a');
        if (!link) return;
        var cat = link.getAttribute('data-category');
        if (cat === '首页' || !cat) return;
        e.preventDefault();
        if(input) input.value = '';
        switchCategory(cat);
        render('');
      });
    }
    
    if (pills) {
      pills.addEventListener('click', function (e) {
        var btn = e.target.closest('.pill');
        if (!btn) return;
        if(input) input.value = '';
        switchCategory(btn.getAttribute('data-filter'));
        render('');
      });
    }

    fetch('data/games.json')
      .then(res => res.json())
      .then(data => {
        gameData = data;
        var urlParams = new URLSearchParams(window.location.search);
        var kwParam = urlParams.get('kw');
        var catParam = urlParams.get('cat');
        
        if (kwParam) {
          if(input) input.value = kwParam;
          switchCategory('首页');
          render(kwParam);
        } else if (catParam) {
          switchCategory(catParam);
          render('');
        } else {
          render('');
        }
        if(window.renderRanking) window.renderRanking(data);
      })
      .catch(() => { 
        document.getElementById('gameList').innerHTML = '<div class="empty-tip">游戏数据加载失败，请刷新重试。</div>'; 
      });
  });
})();
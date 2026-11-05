(function () {
  'use strict';

  var gameData = [];
  var currentCategory = '首页';
  var TOP_FEATURED_IDS = ['ksp', 'citiesskylines', 'changed', 'us'];

  var quotes = [
    "不要相信光圈科技。——光圈实验室", "快去发射火箭吧，坎巴拉人！——KSP",
    "物理定律永远是对的，错的是你的推力不够。——宇宙沙盒", "今天你兽化了吗？——Changed",
    "下载千万条，安全第一条，解压不规范，亲人两行泪。", "如果找不到路，就跟着星星走。——极速游戏库"
  ];

  function proxyImg(url) {
    if (!url) return '';
    if (url.includes('images.weserv.nl')) return url;
    return 'https://images.weserv.nl/?url=' + encodeURIComponent(url.replace('https://', '')) + '&w=400&output=webp';
  }

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

  function cardHTML(g, i, isCarousel) {
    var isFav = getFavs().includes(g.id);
    var isNew = false;
    if (g.date_added) {
      var addTime = new Date(g.date_added).getTime();
      var now = new Date().getTime();
      if ((now - addTime) / (1000 * 3600 * 24) <= 7) isNew = true;
    }
    var newTag = isNew ? '<span class="new-tag">NEW</span>' : '';
    var imgSrc = proxyImg(g.cover);

    if (isCarousel) {
      return `<a class="carousel-item" href="pages/game.html?id=${g.id}">
        ${newTag}
        <img src="${imgSrc}" alt="${g.name}" loading="lazy" onerror="this.style.visibility='hidden'">
        <div class="info">
          <h4>${g.name}</h4>
          <p>${g.type}</p>
        </div>
      </a>`;
    }

    return `<a class="game-card reveal" style="--i:${i}" href="pages/game.html?id=${g.id}">
      ${newTag}
      <button class="card-fav-btn ${isFav ? 'active' : ''}" data-id="${g.id}" onclick="toggleFav('${g.id}', event)" title="收藏">❤</button>
      <img src="${imgSrc}" class="img-blur" alt="${g.name}" loading="lazy" onload="this.classList.remove('img-blur'); this.classList.add('img-loaded');">
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

  function renderTags() {
    var tagCloud = document.getElementById('tagCloud');
    if(!tagCloud) return;
    var allTags = new Set();
    gameData.forEach(g => {
      if(g.tags) g.tags.forEach(t => allTags.add(t));
    });
    // 标签直接变成链接，利于SEO
    tagCloud.innerHTML = Array.from(allTags).map(t => 
      `<a href="?tag=${encodeURIComponent(t)}" class="tag-item" style="text-decoration:none;"># ${t}</a>`
    ).join('');
  }

  function renderRecent() {
    var recentList = document.getElementById('recentList');
    if(!recentList) return;
    var recent = JSON.parse(localStorage.getItem('recent_views') || '[]');
    if(recent.length === 0){
      recentList.innerHTML = '<li style="padding:10px;color:var(--text-dim);text-align:center;">暂无浏览记录</li>';
      return;
    }
    recentList.innerHTML = recent.map(id => {
      var g = gameData.find(item => item.id === id);
      if(!g) return '';
      return `<li><a href="pages/game.html?id=${g.id}">· ${g.name}</a></li>`;
    }).join('');
  }

  function render(keyword) {
    var kw = (keyword || '').trim().toLowerCase();
    var latestList = document.getElementById('gameList');
    var latestTitle = document.getElementById('latestTitle');
    var hotSection = document.getElementById('hotSection');
    var topFeaturedBox = document.getElementById('topFeaturedBox');

    if (topFeaturedBox) {
      if (kw || currentCategory !== '首页' || new URLSearchParams(window.location.search).get('tag')) topFeaturedBox.style.display = 'none';
      else topFeaturedBox.style.display = 'block';
    }

    if (kw) {
      var res = gameData.filter(g => matchGame(g, kw));
      latestTitle.innerHTML = `搜索结果（${res.length}）`;
      if(hotSection) hotSection.hidden = true;
      latestList.innerHTML = res.length ? res.map(cardHTML).join('') : '<div class="empty-state"><div class="empty-icon">🔍</div><p>没有找到匹配的游戏。</p></div>';
      enhanceCards(latestList);
      return;
    }

    if (currentCategory === '我的收藏') {
      var favs = getFavs();
      var favRes = gameData.filter(g => favs.includes(g.id));
      latestTitle.innerHTML = `我的收藏（${favRes.length}）`;
      if(hotSection) hotSection.hidden = true;
      latestList.innerHTML = favRes.length ? favRes.map(cardHTML).join('') : '<div class="empty-state"><div class="empty-icon">❤️</div><p>你还没有收藏任何游戏哦~</p></div>';
      enhanceCards(latestList);
      return;
    }

    if (currentCategory !== '首页') {
      var catRes = gameData.filter(g => g.category && g.category.includes(currentCategory));
      latestTitle.innerHTML = `${currentCategory}（${catRes.length}）`;
      if(hotSection) hotSection.hidden = true;
      latestList.innerHTML = catRes.length ? catRes.map(cardHTML).join('') : '<div class="empty-state"><div class="empty-icon">🛸</div><p>该分类下暂无游戏</p></div>';
      enhanceCards(latestList);
      return;
    }

    latestTitle.innerHTML = '✨ 发现好游戏';
    if(hotSection) hotSection.hidden = true;
    var shuffledGames = [...gameData].sort(() => 0.5 - Math.random());
    var displayGames = shuffledGames.slice(0, 16);
    latestList.innerHTML = displayGames.map(cardHTML).join('');
    enhanceCards(latestList);
  }

  // 标签点击过滤（兼容旧逻辑）
  window.filterByTag = function(tag) {
    var latestList = document.getElementById('gameList');
    var latestTitle = document.getElementById('latestTitle');
    var hotSection = document.getElementById('hotSection');
    var topFeaturedBox = document.getElementById('topFeaturedBox');
    
    var res = gameData.filter(g => g.tags && g.tags.includes(tag));
    latestTitle.innerHTML = `标签：${tag}（${res.length}）`;
    if (hotSection) hotSection.hidden = true;
    if (topFeaturedBox) topFeaturedBox.style.display = 'none';
    latestList.innerHTML = res.length ? res.map(cardHTML).join('') : '<div class="empty-state"><div class="empty-icon">🏷️</div><p>该标签下暂无游戏</p></div>';
    enhanceCards(latestList);
  };

  function renderCarousel() {
    var track = document.getElementById('featuredList');
    if (!track) return;
    var featuredGames = TOP_FEATURED_IDS.map(id => gameData.find(g => g.id === id)).filter(Boolean);
    if (featuredGames.length < 5) {
      var hotGames = gameData.filter(g => g.hot && !featuredGames.includes(g)).slice(0, 5);
      featuredGames = featuredGames.concat(hotGames);
    }
    track.innerHTML = featuredGames.map(g => cardHTML(g, 0, true)).join('');
  }

  function enhanceCards(root) {
    (root || document).querySelectorAll('.game-card:not(.placeholder):not(.skeleton)').forEach(c => {
      if (window.bindCardSpotlight) window.bindCardSpotlight(c);
    });
    if (window.observeReveal) window.observeReveal(root);
  }

  function switchCategory(cat) {
    currentCategory = cat;
    var navBar = document.getElementById('navBar');
    var pills = document.getElementById('filterPills');
    if (document.getElementById('searchSuggestions')) document.getElementById('searchSuggestions').classList.remove('show');

    if (navBar) {
      navBar.querySelectorAll('a').forEach(a => a.classList.remove('active'));
      var navMatch = navBar.querySelector(`a[data-category="${cat}"]`);
      if (navMatch) navMatch.classList.add('active');
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
               <img src="${proxyImg(g.cover)}" referrerpolicy="no-referrer" alt=""><span>${g.name}</span>
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

    var btnPrev = document.getElementById('btnPrev');
    var btnNext = document.getElementById('btnNext');
    var track = document.getElementById('featuredList');
    if(btnPrev && btnNext && track) {
      btnPrev.addEventListener('click', () => track.scrollBy({ left: -260, behavior: 'smooth' }));
      btnNext.addEventListener('click', () => track.scrollBy({ left: 260, behavior: 'smooth' }));
    }

    fetch('data/games.json')
      .then(res => res.json())
      .then(data => {
        gameData = data;
        
        var countEl = document.getElementById('gameCount');
        if (countEl) countEl.textContent = data.length;

        renderTags();
        renderRecent();
        renderCarousel();
        
        var urlParams = new URLSearchParams(window.location.search);
        var kwParam = urlParams.get('kw');
        var catParam = urlParams.get('cat');
        var tagParam = urlParams.get('tag'); // 读取标签参数
        
        if (kwParam) {
          if(input) input.value = kwParam;
          switchCategory('首页');
          render(kwParam);
        } else if (catParam) {
          switchCategory(catParam);
          render('');
        } else if (tagParam) {
          switchCategory('首页');
          window.filterByTag(tagParam); // 如果是标签跳转，执行标签过滤
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
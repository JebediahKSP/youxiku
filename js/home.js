(function () {
  'use strict';

  var gameData = [];
  var currentCategory = '首页';
  var TOP_FEATURED_IDS = ['ksp', 'citiesskylines', 'changed', 'us']; 
  var selectedTags = []; // 存储选中的标签

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
      render();
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
    var clearBtn = document.getElementById('clearTagsBtn');
    if(!tagCloud) return;
    
    var allTags = new Set();
    gameData.forEach(g => {
      if(g.tags) g.tags.forEach(t => allTags.add(t));
    });
    
    // 生成标签按钮，并绑定点击事件
    tagCloud.innerHTML = Array.from(allTags).map(t => 
      `<span class="tag-item ${selectedTags.includes(t) ? 'active' : ''}" onclick="toggleTag('${t}')"># ${t}</span>`
    ).join('');

    // 如果有选中的标签，显示“清除”按钮
    if(selectedTags.length > 0) {
      clearBtn.style.display = 'block';
    } else {
      clearBtn.style.display = 'none';
    }
  }

  // 切换标签选中状态
  window.toggleTag = function(tag) {
    var index = selectedTags.indexOf(tag);
    if (index > -1) {
      selectedTags.splice(index, 1); // 已选中，则取消
    } else {
      selectedTags.push(tag); // 未选中，则添加
    }
    renderTags(); // 重新渲染标签样式
    render(); // 重新渲染游戏列表
  };

  // 清除所有标签
  window.clearAllTags = function() {
    selectedTags = [];
    renderTags();
    render();
  };

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
    var topFeaturedBox = document.getElementById('topFeaturedBox');

    // 如果搜索、选分类、或者选了标签，隐藏顶部的轮播
    if (topFeaturedBox) {
      if (kw || currentCategory !== '首页' || selectedTags.length > 0) topFeaturedBox.style.display = 'none';
      else topFeaturedBox.style.display = 'block';
    }

    var filteredData = [...gameData];

    // 1. 如果有搜索词
    if (kw) {
      filteredData = filteredData.filter(g => matchGame(g, kw));
      latestTitle.innerHTML = `搜索结果（${filteredData.length}）`;
    } 
    // 2. 如果在看收藏
    else if (currentCategory === '我的收藏') {
      var favs = getFavs();
      filteredData = filteredData.filter(g => favs.includes(g.id));
      latestTitle.innerHTML = `我的收藏（${filteredData.length}）`;
    } 
    // 3. 如果在看特定分类
    else if (currentCategory !== '首页') {
      filteredData = filteredData.filter(g => g.category && g.category.includes(currentCategory));
      latestTitle.innerHTML = `${currentCategory}（${filteredData.length}）`;
    } 
    // 4. 默认首页
    else {
      latestTitle.innerHTML = '✨ 发现好游戏';
      filteredData.sort(() => 0.5 - Math.random()); // 随机打乱
    }

    // 5. 处理标签多选过滤 (只要包含选中的任意一个标签即可)
    if (selectedTags.length > 0) {
      filteredData = filteredData.filter(g => {
        if (!g.tags) return false;
        // 使用 some 判断，只要游戏包含 selectedTags 中的某一个标签就保留
        return selectedTags.some(t => g.tags.includes(t));
      });
      latestTitle.innerHTML = `标签筛选（${filteredData.length}）`;
    }

    if (filteredData.length === 0) {
      latestList.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><p>没有找到相关游戏。</p></div>';
    } else {
      // 首页限制显示 16 个
      if (currentCategory === '首页' && !kw && selectedTags.length === 0) {
        filteredData = filteredData.slice(0, 16);
      }
      latestList.innerHTML = filteredData.map(cardHTML).join('');
    }
    
    enhanceCards(latestList);
  }

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
    clearAllTags(); // 搜索时清空标签
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
        clearAllTags(); // 切换分类时清空标签
        switchCategory(cat);
        render('');
      });
    }
    
    if (pills) {
      pills.addEventListener('click', function (e) {
        var btn = e.target.closest('.pill');
        if (!btn) return;
        if(input) input.value = '';
        clearAllTags(); // 切换胶囊时清空标签
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
        var tagParam = urlParams.get('tag'); 
        
        if (kwParam) {
          if(input) input.value = kwParam;
          switchCategory('首页');
          render(kwParam);
        } else if (catParam) {
          switchCategory(catParam);
          render('');
        } else if (tagParam) {
          // 兼容从详情页点击标签跳转过来的逻辑
          switchCategory('首页');
          selectedTags = [tagParam];
          renderTags();
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

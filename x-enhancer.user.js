// ==UserScript==
// @name         X/Twitter 浏览增强器
// @namespace    https://github.com/872575323/X-Twitter-
// @homepageURL  https://github.com/872575323/X-Twitter-
// @supportURL   https://github.com/872575323/X-Twitter-/issues
// @downloadURL  https://raw.githubusercontent.com/872575323/X-Twitter-/main/x-enhancer.user.js
// @updateURL    https://raw.githubusercontent.com/872575323/X-Twitter-/main/x-enhancer.user.js
// @version      2.2.0
// @description  优化 X/Twitter 浏览体验：可折叠左侧菜单、隐藏右侧广告、双列布局、清爽阅读模式
// @author       Kiro
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ==================== 配置项 ====================
  const CONFIG = {
    // 左侧菜单是否默认折叠
    sidebarCollapsed: GM_getValue('sidebarCollapsed', false),
    // 右侧边栏是否隐藏
    rightSidebarHidden: GM_getValue('rightSidebarHidden', true),
    // 是否启用双列布局
    dualColumn: GM_getValue('dualColumn', true),
    // 是否隐藏推广推文
    hidePromotedTweets: GM_getValue('hidePromotedTweets', true),
    // 是否隐藏 Grok 相关元素
    hideGrok: GM_getValue('hideGrok', true),
    // 是否隐藏浮动的发帖按钮
    hideFloatingCompose: GM_getValue('hideFloatingCompose', false),
    // 是否启用紧凑模式（减少间距）
    compactMode: GM_getValue('compactMode', false),
  };

  // ==================== 样式注入 ====================

  // 基础样式 - 始终生效
  GM_addStyle(`
    /* ===== 控制面板样式 ===== */
    #x-enhancer-panel {
      position: fixed;
      top: 60px;
      right: 20px;
      z-index: 99999;
      background: var(--xe-bg, #15202b);
      border: 1px solid var(--xe-border, #38444d);
      border-radius: 16px;
      padding: 16px;
      min-width: 260px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: none;
      color: var(--xe-text, #e7e9ea);
    }
    #x-enhancer-panel.visible {
      display: block;
    }
    #x-enhancer-panel h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 700;
      color: var(--xe-text, #e7e9ea);
    }
    .xe-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: var(--xe-text, #e7e9ea);
    }
    .xe-option label {
      cursor: pointer;
      flex: 1;
    }
    /* 开关样式 */
    .xe-toggle {
      position: relative;
      width: 40px;
      height: 22px;
      flex-shrink: 0;
      margin-left: 10px;
      cursor: pointer;
    }
    .xe-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    }
    .xe-toggle .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #536471;
      border-radius: 22px;
      transition: 0.3s;
    }
    .xe-toggle .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: 0.3s;
    }
    .xe-toggle input:checked + .slider {
      background-color: #1d9bf0;
    }
    .xe-toggle input:checked + .slider:before {
      transform: translateX(18px);
    }

    /* ===== 折叠/展开按钮 ===== */
    #xe-sidebar-toggle {
      position: fixed;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      z-index: 99998;
      background: var(--xe-bg, #15202b);
      border: 1px solid var(--xe-border, #38444d);
      border-left: none;
      border-radius: 0 8px 8px 0;
      padding: 8px 4px;
      cursor: pointer;
      color: var(--xe-text, #e7e9ea);
      font-size: 14px;
      line-height: 1;
      transition: all 0.3s ease;
      opacity: 0.6;
    }
    #xe-sidebar-toggle:hover {
      opacity: 1;
      background: #1d9bf0;
    }

    /* ===== 设置按钮（齿轮图标） ===== */
    #xe-settings-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99998;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #1d9bf0;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(29,155,240,0.4);
      transition: transform 0.3s, box-shadow 0.3s;
      color: white;
      font-size: 20px;
    }
    #xe-settings-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 20px rgba(29,155,240,0.6);
    }

    /* ===== 分隔线 ===== */
    .xe-divider {
      height: 1px;
      background: var(--xe-border, #38444d);
      margin: 8px 0;
    }

    /* ===== 快捷键提示 ===== */
    .xe-shortcuts {
      font-size: 11px;
      color: #8899a6;
      margin-top: 8px;
      line-height: 1.6;
    }
    .xe-shortcuts kbd {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 4px;
      padding: 1px 5px;
      font-size: 11px;
      font-family: monospace;
    }
  `);

  // ==================== 动态样式管理 ====================

  // 创建动态样式元素
  function createStyleElement(id) {
    const style = document.createElement('style');
    style.id = id;
    document.head.appendChild(style);
    return style;
  }

  const dynamicStyles = {
    sidebar: createStyleElement('xe-sidebar-style'),
    rightSidebar: createStyleElement('xe-right-sidebar-style'),
    dualColumn: createStyleElement('xe-dual-column-style'),
    promoted: createStyleElement('xe-promoted-style'),
    grok: createStyleElement('xe-grok-style'),
    floatingCompose: createStyleElement('xe-floating-compose-style'),
    compact: createStyleElement('xe-compact-style'),
  };

  // ==================== 左侧菜单折叠样式 ====================
  function updateSidebarStyle() {
    if (CONFIG.sidebarCollapsed) {
      dynamicStyles.sidebar.textContent = `
        /* ===== 折叠左侧导航栏 ===== */

        /* 1. header 本身：取消 flex-grow，固定窄宽度 */
        header[role="banner"] {
          flex-grow: 0 !important;
          flex-shrink: 0 !important;
          width: 88px !important;
          min-width: 88px !important;
          max-width: 88px !important;
        }

        /* 2. header 内部所有层级容器宽度锁定 */
        header[role="banner"] > div,
        header[role="banner"] > div > div,
        header[role="banner"] > div > div > div {
          width: 88px !important;
          min-width: 88px !important;
        }

        /* 3. 隐藏导航菜单项中的文字标签（保留图标 SVG） */
        header[role="banner"] nav[role="navigation"] a > div > div[dir="ltr"],
        header[role="banner"] nav[role="navigation"] button > div > div[dir="ltr"] {
          display: none !important;
        }

        /* 4. 隐藏 Premium 优惠标签（"50% 优惠"徽章） */
        header[role="banner"] nav[role="navigation"] a > div > div:last-child:not(:first-child):not([dir]) {
          display: none !important;
        }

        /* 5. 导航菜单项居中对齐（只去左右内边距，保留上下间距） */
        header[role="banner"] nav[role="navigation"] {
          align-items: center !important;
        }
        header[role="banner"] nav[role="navigation"] a > div,
        header[role="banner"] nav[role="navigation"] button > div {
          justify-content: center !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
        }

        /* 6. "发帖"按钮：变成圆形图标按钮 */
        a[data-testid="SideNav_NewTweet_Button"] {
          width: 50px !important;
          height: 50px !important;
          padding: 0 !important;
          min-width: 50px !important;
          border-radius: 50% !important;
          justify-content: center !important;
          align-items: center !important;
        }
        a[data-testid="SideNav_NewTweet_Button"] > div {
          display: none !important;
        }
        /* 新版按钮折叠后没有自带图标，用伪元素补一个 + */
        a[data-testid="SideNav_NewTweet_Button"]::before {
          content: "+";
          color: #fff;
          font-size: 30px;
          line-height: 1;
          font-weight: 300;
        }

        /* 7. 底部用户信息面板：隐藏用户名和 @handle，只保留头像 */
        button[data-testid="SideNav_AccountSwitcher_Button"] {
          width: 50px !important;
          min-width: 50px !important;
          padding: 0 !important;
          justify-content: center !important;
        }
        /* 新版结构：button > [头像, 用户名, ...]，只保留第一个子元素（头像） */
        button[data-testid="SideNav_AccountSwitcher_Button"] > div:not(:first-child) {
          display: none !important;
        }

        /* 8. 过渡动画 */
        header[role="banner"],
        header[role="banner"] > div,
        header[role="banner"] > div > div,
        header[role="banner"] > div > div > div {
          transition: width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease !important;
        }
      `;
    } else {
      dynamicStyles.sidebar.textContent = `
        header[role="banner"],
        header[role="banner"] > div,
        header[role="banner"] > div > div,
        header[role="banner"] > div > div > div {
          transition: width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease !important;
        }
      `;
    }
  }

  // ==================== 右侧边栏隐藏样式 ====================
  function updateRightSidebarStyle() {
    if (CONFIG.rightSidebarHidden) {
      dynamicStyles.rightSidebar.textContent = `
        /* 隐藏右侧边栏 */
        div[data-testid="sidebarColumn"] {
          display: none !important;
        }
        /* 解除主内容区域所有层级的宽度限制 */
        main[role="main"],
        main[role="main"] > div,
        main[role="main"] > div > div,
        main[role="main"] > div > div > div {
          max-width: 100% !important;
        }
        /* primaryColumn 宽度根据是否双列动态调整 */
        div[data-testid="primaryColumn"] {
          border-right: none !important;
        }
        /* 非双列模式下，单列保持合理阅读宽度 */
        div[data-testid="primaryColumn"]:not(.xe-dual-mode) {
          max-width: 900px !important;
        }
        /* 双列模式下，彻底解除所有宽度限制 */
        div[data-testid="primaryColumn"].xe-dual-mode {
          flex-grow: 1 !important;
          flex-shrink: 1 !important;
          max-width: 100% !important;
          width: 100% !important;
        }
        /* 解除 primaryColumn 内部所有层级的 max-width 限制 */
        div[data-testid="primaryColumn"].xe-dual-mode > *,
        div[data-testid="primaryColumn"].xe-dual-mode > * > *,
        div[data-testid="primaryColumn"].xe-dual-mode > * > * > *,
        div[data-testid="primaryColumn"].xe-dual-mode section,
        div[data-testid="primaryColumn"].xe-dual-mode section > div,
        div[data-testid="primaryColumn"].xe-dual-mode section > div > div {
          max-width: 100% !important;
        }
      `;
    } else {
      dynamicStyles.rightSidebar.textContent = '';
    }
    // 同步双列模式的 class
    syncDualModeClass();
  }

  // ==================== 双列布局（JS 方案） ====================
  // X 使用虚拟滚动（position: absolute + translateY），纯 CSS flex/grid 无法生效
  // 方案：用 JS 实时修改每个推文的 position/width/left/translateY 实现双列


  // 给 primaryColumn 添加/移除双列模式标记 class
  function syncDualModeClass() {
    const col = document.querySelector('div[data-testid="primaryColumn"]');
    if (!col) return;
    if (CONFIG.dualColumn) {
      col.classList.add('xe-dual-mode');
    } else {
      col.classList.remove('xe-dual-mode');
    }
  }

  function updateDualColumnStyle() {
    syncDualModeClass();

    if (CONFIG.dualColumn) {
      // 用 CSS 变量 + calc() 实现响应式双列，不依赖 JS 计算宽度
      // --xe-header-w 由 JS 设置，表示左侧菜单宽度
      dynamicStyles.dualColumn.textContent = `
        /* CSS 变量：左侧菜单宽度，由 JS 动态更新 */
        :root {
          --xe-header-w: 88px;
          --xe-col-gap: 16px;
        }

        /* 双列模式：彻底覆盖 X 原生的 max-width: 600px 限制 */
        div[data-testid="primaryColumn"].xe-dual-mode {
          max-width: 100% !important;
          width: 100% !important;
          flex-grow: 1 !important;
          flex-shrink: 1 !important;
        }

        /* 覆盖 X 原生 r-1ye8kvj (max-width:600px) 和其他宽度限制 */
        div[data-testid="primaryColumn"].xe-dual-mode .r-1ye8kvj,
        div[data-testid="primaryColumn"].xe-dual-mode .r-f8sm7e,
        div[data-testid="primaryColumn"].xe-dual-mode [class*="r-1ye8kvj"],
        div[data-testid="primaryColumn"].xe-dual-mode [style*="max-width: 600px"] {
          max-width: 100% !important;
        }

        /* 解除上层容器的 max-width 限制 */
        main[role="main"] > div,
        main[role="main"] > div > div,
        main[role="main"] > div > div > div {
          max-width: 100% !important;
        }

        /* 双列推文宽度：每列占父容器的一半减去间距 */
        div[data-testid="cellInnerDiv"].xe-dual-col {
          width: calc(50% - 8px) !important;
          box-sizing: border-box !important;
        }
        /* 非推文内容（如"推荐关注"）通栏显示 */
        div[data-testid="cellInnerDiv"].xe-dual-full {
          width: 100% !important;
        }

        /* 推文内图片自适应 */
        div[data-testid="cellInnerDiv"].xe-dual-col img {
          max-width: 100% !important;
          height: auto !important;
        }
        div[data-testid="cellInnerDiv"].xe-dual-col article {
          max-width: 100% !important;
        }
      `;
      // 更新 CSS 变量中的 header 宽度
      updateHeaderWidthVar();
      scheduleLayout();
    } else {
      dynamicStyles.dualColumn.textContent = '';
      resetCells();
    }
  }

  // 更新 CSS 变量中的左侧菜单宽度
  function updateHeaderWidthVar() {
    const header = document.querySelector('header[role="banner"]');
    const headerWidth = header ? header.offsetWidth : 88;
    document.documentElement.style.setProperty('--xe-header-w', headerWidth + 'px');
  }

  // ==================== 统一 DOM 监听（双列布局 + 推广检测） ====================
  // 思路：X 的虚拟列表会测量每个 cell 的高度来计算 translateY。
  // 把推文 cell 的高度压成 (真实高度 + 间距) / 2，X 自己算出的坐标就和双列瀑布流的平均高度一致，
  // X 渲染的范围始终覆盖视口：滚动不会空白，X 的无限加载也照常触发。
  const ROW_GAP = 8;
  const AD_LABEL = /^(Ad|Promoted|推广|广告|廣告|プロモーション)$/;
  const cellPos = new WeakMap();       // cell -> { col: 0 左 / 1 右 / -1 通栏, y }
  const observedContent = new WeakSet();
  const contentRO = new ResizeObserver(() => scheduleLayout());
  let layoutRAF = 0;

  function scheduleLayout() {
    if (!layoutRAF) layoutRAF = requestAnimationFrame(() => { layoutRAF = 0; runLayout(); });
  }

  // 读取 X 写入的原始 translateY（脚本自己写的值记在 dataset.xeTf，不算）
  function getOrigY(cell) {
    const tf = cell.style.transform;
    if (tf !== cell.dataset.xeTf) {
      const m = tf.match(/translateY\(([-\d.]+)px\)/);
      cell.dataset.xeY = m ? m[1] : '0';
    }
    return parseFloat(cell.dataset.xeY) || 0;
  }

  // 推广推文：有 article、没有时间戳、带 Ad/推广 标签
  // 注意：新版 X 的视频推文也带 placementTracking，不能再用它判断广告
  function markPromoted(cell) {
    const article = cell.querySelector('article');
    const isAd = !!article && !article.querySelector('time') &&
      [...article.querySelectorAll('span')].some(s => AD_LABEL.test(s.textContent.trim()));
    cell.classList.toggle('xe-promoted', isAd);
  }

  function setStyle(el, prop, value) {
    if (el.style[prop] !== value) el.style[prop] = value;
  }

  // 恢复单个 cell 的原始样式，X 会重新测量高度并修正位置
  function restoreCell(cell) {
    if (!cell.classList.contains('xe-dual-col') && !cell.classList.contains('xe-dual-full')) return;
    cell.classList.remove('xe-dual-col', 'xe-dual-full');
    cell.style.height = '';
    cell.style.left = '';
    if (cell.style.transform === cell.dataset.xeTf) cell.style.transform = `translateY(${cell.dataset.xeY || 0}px)`;
    delete cell.dataset.xeTf;
    cellPos.delete(cell);
  }

  function resetCells() {
    document.querySelectorAll('div[data-testid="cellInnerDiv"]').forEach(restoreCell);
  }

  function place(it, col, y) {
    const { cell, h, half } = it;
    cellPos.set(cell, { col, y });
    setStyle(cell, 'height', (half ? (h + ROW_GAP) / 2 : h + ROW_GAP) + 'px');
    setStyle(cell, 'left', col === 1 ? 'calc(50% + 8px)' : '0px');
    const tf = `translateY(${Math.round(y)}px)`;
    if (cell.style.transform !== tf) {
      cell.dataset.xeTf = tf;
      cell.style.transform = tf;
    }
  }

  function runLayout() {
    const cells = [...document.querySelectorAll('div[data-testid="cellInnerDiv"]')];
    cells.forEach(markPromoted);
    if (!CONFIG.dualColumn || cells.length === 0) return;
    syncDualModeClass();

    const header = document.querySelector('header[role="banner"]');
    const available = document.documentElement.clientWidth - (header ? header.offsetWidth : 88) - 32;
    if (available < 700) { resetCells(); return; } // 窗口太窄，回退单列

    // 收集参与布局的 cell：推文占半列，其他可见内容（如"推荐关注"标题）通栏，过矮的哨兵保持 X 原位
    const items = [];
    cells.forEach(cell => {
      const content = cell.firstElementChild;
      const half = !!cell.querySelector('article');
      if (content) {
        // 先套上宽度 class 再测高度，避免按全宽测量
        cell.classList.toggle('xe-dual-col', half);
        cell.classList.toggle('xe-dual-full', !half);
      }
      const h = content ? content.offsetHeight : 0;
      if (h < 20) { restoreCell(cell); return; }
      if (!observedContent.has(content)) { observedContent.add(content); contentRO.observe(content); }
      items.push({ cell, h, half, origY: getOrigY(cell) });
    });
    if (items.length === 0) return;
    items.sort((a, b) => a.origY - b.origY);

    // 以第一个已排过的 cell 为锚点，已排过的 cell 保持原列，避免滚动时内容跳动
    let anchor = items.findIndex(it => cellPos.has(it.cell));
    let fresh = anchor < 0 ||
      Math.abs(cellPos.get(items[anchor].cell).y - items[anchor].origY) > window.innerHeight * 1.5;
    const base = [null, null];
    if (fresh) {
      anchor = 0;
      base[0] = base[1] = items[0].origY;
    } else {
      for (let i = anchor; i < items.length && (base[0] === null || base[1] === null); i++) {
        const p = cellPos.get(items[i].cell);
        if (!p) continue;
        if (p.col === -1) { base[0] ??= p.y; base[1] ??= p.y; } else base[p.col] ??= p.y;
      }
      base[0] ??= base[1];
      base[1] ??= base[0];
    }

    // 锚点及以下：向下排
    const bottom = [...base];
    for (let i = anchor; i < items.length; i++) {
      const it = items[i];
      const p = fresh ? null : cellPos.get(it.cell);
      if (!it.half) {
        const y = Math.max(bottom[0], bottom[1]);
        bottom[0] = bottom[1] = y + it.h + ROW_GAP;
        place(it, -1, y);
      } else {
        const col = p && p.col !== -1 ? p.col : (bottom[0] <= bottom[1] ? 0 : 1);
        place(it, col, bottom[col]);
        bottom[col] += it.h + ROW_GAP;
      }
    }
    // 锚点以上（往回滚时 X 新渲染的 cell）：向上排
    const top = [...base];
    for (let i = anchor - 1; i >= 0; i--) {
      const it = items[i];
      if (!it.half) {
        const y = Math.min(top[0], top[1]) - it.h - ROW_GAP;
        top[0] = top[1] = y;
        place(it, -1, y);
      } else {
        const col = top[0] >= top[1] ? 0 : 1;
        top[col] -= it.h + ROW_GAP;
        place(it, col, top[col]);
      }
    }
  }

  // 全局只用一个 MutationObserver：时间线有增删，或 X 改写了 cell 的 transform 时重排
  function setupDomObserver() {
    new MutationObserver(muts => {
      for (const m of muts) {
        const t = m.target;
        if (m.type === 'attributes') {
          if (t.dataset && t.dataset.testid === 'cellInnerDiv' && t.style.transform !== t.dataset.xeTf) return scheduleLayout();
        } else if (t.closest && t.closest('div[data-testid="primaryColumn"]')) {
          return scheduleLayout();
        }
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  }

  // ==================== 隐藏推广推文 ====================
  function updatePromotedStyle() {
    if (CONFIG.hidePromotedTweets) {
      dynamicStyles.promoted.textContent = `
        /* 隐藏推广/广告推文 */
        /* xe-promoted 由 markPromoted() 标记 */
        div[data-testid="cellInnerDiv"].xe-promoted {
          display: none !important;
        }
      `;
    } else {
      dynamicStyles.promoted.textContent = '';
    }
  }

  // ==================== 隐藏 Grok 相关元素 ====================
  function updateGrokStyle() {
    if (CONFIG.hideGrok) {
      dynamicStyles.grok.textContent = `
        /* 隐藏 Grok 按钮和入口 */
        a[href="/i/grok"],
        a[href*="grok.com"],
        div[data-testid="GrokDrawer"],
        button[aria-label*="Grok"],
        a[aria-label*="Grok"] {
          display: none !important;
        }
      `;
    } else {
      dynamicStyles.grok.textContent = '';
    }
  }

  // ==================== 隐藏浮动发帖按钮 ====================
  function updateFloatingComposeStyle() {
    if (CONFIG.hideFloatingCompose) {
      dynamicStyles.floatingCompose.textContent = `
        a[data-testid="SideNav_NewTweet_Button"],
        a[href="/compose/post"] {
          display: none !important;
        }
      `;
    } else {
      dynamicStyles.floatingCompose.textContent = '';
    }
  }

  // ==================== 紧凑模式 ====================
  function updateCompactStyle() {
    if (CONFIG.compactMode) {
      dynamicStyles.compact.textContent = `
        div[data-testid="cellInnerDiv"] {
          padding-top: 4px !important;
          padding-bottom: 4px !important;
        }
        article[data-testid="tweet"] {
          padding: 8px 12px !important;
        }
        div[data-testid="Tweet-User-Avatar"] {
          width: 36px !important;
          height: 36px !important;
        }
        div[data-testid="Tweet-User-Avatar"] img {
          width: 36px !important;
          height: 36px !important;
        }
        div[role="group"] {
          margin-top: 4px !important;
        }
      `;
    } else {
      dynamicStyles.compact.textContent = '';
    }
  }

  // 应用所有样式
  function applyAllStyles() {
    updateSidebarStyle();
    updateRightSidebarStyle();
    updateDualColumnStyle();
    updatePromotedStyle();
    updateGrokStyle();
    updateFloatingComposeStyle();
    updateCompactStyle();
  }

  // ==================== UI 组件 ====================

  // 创建开关组件（修复点击问题：点击 slider 也能触发）
  function createToggle(label, key, onChange) {
    const wrapper = document.createElement('div');
    wrapper.className = 'xe-option';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;

    const toggle = document.createElement('div');
    toggle.className = 'xe-toggle';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = CONFIG[key];
    input.dataset.key = key;

    const slider = document.createElement('span');
    slider.className = 'slider';

    // 点击 slider 时手动切换 input 状态
    slider.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      input.checked = !input.checked;
      input.dispatchEvent(new Event('change'));
    });

    input.addEventListener('change', () => {
      CONFIG[key] = input.checked;
      GM_setValue(key, input.checked);
      if (onChange) onChange(input.checked);
    });

    toggle.appendChild(input);
    toggle.appendChild(slider);
    wrapper.appendChild(labelEl);
    wrapper.appendChild(toggle);

    return wrapper;
  }

  // 创建分隔线
  function createDivider() {
    const div = document.createElement('div');
    div.className = 'xe-divider';
    return div;
  }

  // 创建设置面板
  function createSettingsPanel() {
    const panel = document.createElement('div');
    panel.id = 'x-enhancer-panel';

    const title = document.createElement('h3');
    title.textContent = '⚡ X 浏览增强器';
    panel.appendChild(title);

    // 布局类设置
    const layoutLabel = document.createElement('div');
    layoutLabel.style.cssText = 'font-size:12px;color:#8899a6;margin-bottom:4px;font-weight:600;';
    layoutLabel.textContent = '📐 布局';
    panel.appendChild(layoutLabel);

    panel.appendChild(createToggle('折叠左侧菜单', 'sidebarCollapsed', () => {
      updateSidebarStyle();
      updateToggleButton();
    }));
    panel.appendChild(createToggle('隐藏右侧边栏', 'rightSidebarHidden', updateRightSidebarStyle));
    panel.appendChild(createToggle('双列布局', 'dualColumn', updateDualColumnStyle));
    panel.appendChild(createToggle('紧凑模式', 'compactMode', updateCompactStyle));

    panel.appendChild(createDivider());

    // 清理类设置
    const cleanLabel = document.createElement('div');
    cleanLabel.style.cssText = 'font-size:12px;color:#8899a6;margin-bottom:4px;font-weight:600;';
    cleanLabel.textContent = '🧹 清理';
    panel.appendChild(cleanLabel);

    panel.appendChild(createToggle('隐藏推广推文', 'hidePromotedTweets', updatePromotedStyle));
    panel.appendChild(createToggle('隐藏 Grok', 'hideGrok', updateGrokStyle));
    panel.appendChild(createToggle('隐藏浮动发帖按钮', 'hideFloatingCompose', updateFloatingComposeStyle));

    panel.appendChild(createDivider());

    // 快捷键提示
    const shortcuts = document.createElement('div');
    shortcuts.className = 'xe-shortcuts';
    shortcuts.innerHTML = `
      <kbd>Alt</kbd>+<kbd>S</kbd> 折叠/展开菜单<br>
      <kbd>Alt</kbd>+<kbd>R</kbd> 切换右侧栏<br>
      <kbd>Alt</kbd>+<kbd>D</kbd> 切换双列布局<br>
      <kbd>Alt</kbd>+<kbd>X</kbd> 打开/关闭设置
    `;
    panel.appendChild(shortcuts);

    document.body.appendChild(panel);
    return panel;
  }

  // 创建设置按钮
  function createSettingsButton() {
    const btn = document.createElement('button');
    btn.id = 'xe-settings-btn';
    btn.innerHTML = '⚙';
    btn.title = 'X 浏览增强器设置 (Alt+X)';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel = document.getElementById('x-enhancer-panel');
      panel.classList.toggle('visible');
    });
    document.body.appendChild(btn);
  }

  // 创建左侧菜单折叠/展开按钮
  function createSidebarToggle() {
    const btn = document.createElement('button');
    btn.id = 'xe-sidebar-toggle';
    btn.addEventListener('click', () => {
      CONFIG.sidebarCollapsed = !CONFIG.sidebarCollapsed;
      GM_setValue('sidebarCollapsed', CONFIG.sidebarCollapsed);
      updateSidebarStyle();
      updateToggleButton();
      syncPanelToggle('sidebarCollapsed');
    });
    document.body.appendChild(btn);
    updateToggleButton();
  }

  function updateToggleButton() {
    const btn = document.getElementById('xe-sidebar-toggle');
    if (btn) {
      btn.textContent = CONFIG.sidebarCollapsed ? '▶' : '◀';
      btn.title = CONFIG.sidebarCollapsed ? '展开菜单 (Alt+S)' : '折叠菜单 (Alt+S)';
    }
  }

  // ==================== 点击外部关闭面板 ====================
  function setupClickOutside() {
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('x-enhancer-panel');
      const btn = document.getElementById('xe-settings-btn');
      if (panel && panel.classList.contains('visible') &&
          !panel.contains(e.target) && !btn.contains(e.target)) {
        panel.classList.remove('visible');
      }
    });
  }

  // ==================== 键盘快捷键 ====================
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' ||
          e.target.getAttribute('contenteditable') === 'true' ||
          e.target.getAttribute('role') === 'textbox') {
        return;
      }

      if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        CONFIG.sidebarCollapsed = !CONFIG.sidebarCollapsed;
        GM_setValue('sidebarCollapsed', CONFIG.sidebarCollapsed);
        updateSidebarStyle();
        updateToggleButton();
        syncPanelToggle('sidebarCollapsed');
      }

      if (e.altKey && e.code === 'KeyR') {
        e.preventDefault();
        CONFIG.rightSidebarHidden = !CONFIG.rightSidebarHidden;
        GM_setValue('rightSidebarHidden', CONFIG.rightSidebarHidden);
        updateRightSidebarStyle();
        syncPanelToggle('rightSidebarHidden');
      }

      if (e.altKey && e.code === 'KeyD') {
        e.preventDefault();
        CONFIG.dualColumn = !CONFIG.dualColumn;
        GM_setValue('dualColumn', CONFIG.dualColumn);
        updateDualColumnStyle();
        syncPanelToggle('dualColumn');
      }

      if (e.altKey && e.code === 'KeyX') {
        e.preventDefault();
        const panel = document.getElementById('x-enhancer-panel');
        panel.classList.toggle('visible');
      }
    });
  }

  // 同步面板中的开关状态
  function syncPanelToggle(key) {
    const panel = document.getElementById('x-enhancer-panel');
    if (panel) {
      const input = panel.querySelector(`input[data-key="${key}"]`);
      if (input) input.checked = CONFIG[key];
    }
  }

  // ==================== 自适应主题色 ====================
  function detectAndApplyTheme() {
    function applyTheme() {
      const bg = getComputedStyle(document.body).backgroundColor;
      const root = document.documentElement;

      if (bg === 'rgb(0, 0, 0)') {
        root.style.setProperty('--xe-bg', '#000000');
        root.style.setProperty('--xe-border', '#2f3336');
        root.style.setProperty('--xe-text', '#e7e9ea');
      } else if (bg === 'rgb(21, 32, 43)') {
        root.style.setProperty('--xe-bg', '#15202b');
        root.style.setProperty('--xe-border', '#38444d');
        root.style.setProperty('--xe-text', '#e7e9ea');
      } else {
        root.style.setProperty('--xe-bg', '#ffffff');
        root.style.setProperty('--xe-border', '#eff3f4');
        root.style.setProperty('--xe-text', '#0f1419');
      }
    }

    applyTheme();
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
  }

  // ==================== 初始化 ====================
  function init() {
    const waitForBody = setInterval(() => {
      if (document.body) {
        clearInterval(waitForBody);

        detectAndApplyTheme();
        applyAllStyles();

        createSettingsPanel();
        createSettingsButton();
        createSidebarToggle();

        setupClickOutside();
        setupKeyboardShortcuts();
        setupDomObserver();

        // 窗口大小变化：更新菜单宽度变量并重排
        window.addEventListener('resize', () => {
          updateHeaderWidthVar();
          scheduleLayout();
        });
        scheduleLayout();

        console.log('[X 浏览增强器] v2.2.0 已加载 ✓');
      }
    }, 100);
  }

  init();
})();

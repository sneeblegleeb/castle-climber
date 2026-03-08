(function(){
  'use strict';
  const imageCache = {};

  function loadIconSprite(name){
    if(!name) return null;
    if(imageCache[name]) return imageCache[name];
    const meta = (window.ICON_SPRITES || {})[name];
    if(!meta) return null;
    const img = new Image();
    img.src = meta.src;
    img.dataset.ready = '0';
    img.onload = ()=>{ img.dataset.ready = '1'; };
    img.onerror = ()=>{ img.dataset.ready = '-1'; };
    imageCache[name] = img;
    return img;
  }

  function makeIconElement({ sprite, fallback='?', className='asset-icon-inline' } = {}){
    const span = document.createElement('span');
    span.className = className;
    span.setAttribute('aria-hidden','true');
    const fallbackEl = document.createElement('span');
    fallbackEl.className = 'asset-icon-fallback';
    fallbackEl.textContent = fallback;
    span.appendChild(fallbackEl);
    const meta = sprite && (window.ICON_SPRITES || {})[sprite];
    if(!meta) return span;
    const img = loadIconSprite(sprite);
    if(!img) return span;
    const domImg = document.createElement('img');
    domImg.className = 'asset-icon-img';
    domImg.width = meta.w;
    domImg.height = meta.h;
    domImg.alt = '';
    domImg.style.display = 'none';
    domImg.src = img.src;
    domImg.onload = ()=>{ fallbackEl.style.display = 'none'; domImg.style.display = 'block'; };
    domImg.onerror = ()=>{ fallbackEl.style.display = 'inline-flex'; domImg.style.display = 'none'; };
    span.appendChild(domImg);
    return span;
  }

  function applyButtonIcon(id, sprite, fallback){
    const el = document.getElementById(id);
    if(!el) return;
    const preserved = Array.from(el.children).filter(ch => ch.classList && ch.classList.contains('cd-fill'));
    while(el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(makeIconElement({ sprite, fallback }));
    preserved.forEach(ch => el.appendChild(ch));
  }

  function setLabeledIconText(el, sprite, fallback, text){
    if(!el) return;
    el.textContent = '';
    el.appendChild(makeIconElement({ sprite, fallback }));
    const node = document.createTextNode(' ' + text);
    el.appendChild(node);
  }

  window.CastleIcons = { loadIconSprite, makeIconElement, applyButtonIcon, setLabeledIconText };
})();

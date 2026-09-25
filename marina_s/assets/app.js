(function(){
  const root = document.documentElement;
  const card = root.dataset.card || '';
  const cardDigits = card.replace(/\D/g,'');
  const recipient = root.dataset.recipient || '';
  const wrap = document.querySelector('.wrap');
  const toast = document.getElementById('toast');
  const modal = document.getElementById('modal');

  function showToast(msg){
    if(!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(()=>toast.classList.remove('show'),1650);
  }

  async function copyCard(){
    let ok = false;
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(cardDigits);
        ok = true;
      }
    }catch(e){}
    if(!ok){
      const ta = document.createElement('textarea');
      ta.value = cardDigits;
      ta.setAttribute('readonly','');
      ta.style.position='fixed'; ta.style.left='-9999px'; ta.style.opacity='0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      try{ ok = document.execCommand('copy'); }catch(e){}
      ta.remove();
    }
    showToast(ok ? 'Номер карты скопирован' : 'Скопируйте номер карты вручную');
    return ok;
  }

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function openOzonBank(){
    const bankWeb = 'https://finance.ozon.ru/';
    if(isAndroid){
      // Explicit Android intent to the official Ozon Bank package.
      const fallback = encodeURIComponent(bankWeb);
      window.location.href = 'intent://finance.ozon.ru/#Intent;scheme=https;package=ru.ozon.fintech.finance;S.browser_fallback_url=' + fallback + ';end';
      return;
    }
    if(isIOS){
      // Ozon Bank does not publish a stable card-transfer deep-link scheme for iOS.
      // Opening its official HTTPS domain is the safest Universal-Link-compatible route;
      // if the app does not claim the link, Safari opens the same official site.
      window.location.href = bankWeb;
      return;
    }
    window.open(bankWeb,'_blank','noopener');
  }

  async function copyAndOpen(){
    await copyCard();
    if(modal) modal.classList.add('show');
  }

  function fitToViewport(){
    if(!wrap) return;
    root.style.setProperty('--fit-scale','1');
    // Wait until scale reset has taken effect before measuring.
    requestAnimationFrame(()=>{
      const vv = window.visualViewport;
      const vw = vv ? vv.width : window.innerWidth;
      const vh = vv ? vv.height : window.innerHeight;
      const rect = wrap.getBoundingClientRect();
      const usableW = Math.max(280, vw - 12);
      const usableH = Math.max(420, vh - 12);
      const sx = usableW / rect.width;
      const sy = usableH / rect.height;
      const scale = Math.min(1, sx, sy);
      // Only scale when necessary. Preserve legibility; on extremely small screens
      // scrolling is preferable to shrinking below 78%.
      const finalScale = Math.max(0.78, scale);
      root.style.setProperty('--fit-scale', finalScale.toFixed(4));
      document.body.style.overflowY = scale >= 0.78 ? 'hidden' : 'auto';
    });
  }

  document.querySelectorAll('[data-copy]').forEach(el=>el.addEventListener('click',copyCard));
  document.querySelectorAll('[data-copy-open]').forEach(el=>el.addEventListener('click',copyAndOpen));
  document.querySelectorAll('[data-open-bank]').forEach(el=>el.addEventListener('click',openOzonBank));
  document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>modal && modal.classList.remove('show')));
  if(modal) modal.addEventListener('click',e=>{ if(e.target===modal) modal.classList.remove('show'); });

  document.querySelectorAll('[data-card-text]').forEach(el=>el.setAttribute('aria-label','Номер карты '+cardDigits));
  document.querySelectorAll('[data-recipient-text]').forEach(el=>el.setAttribute('aria-label','Получатель '+recipient));

  window.addEventListener('load',fitToViewport,{once:true});
  window.addEventListener('resize',fitToViewport);
  window.addEventListener('orientationchange',()=>setTimeout(fitToViewport,120));
  if(window.visualViewport) window.visualViewport.addEventListener('resize',fitToViewport);
})();

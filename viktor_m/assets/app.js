(function(){
  const root = document.documentElement;
  const card = root.dataset.card || '';
  const cardDigits = card.replace(/\D/g,'');
  const recipient = root.dataset.recipient || '';
  const wrap = document.querySelector('.wrap');
  const toast = document.getElementById('toast');
  const modal = document.getElementById('modal');

  // Official destinations / fallbacks.
  // Android package confirmed for the Ozon Bank app.
  const ANDROID_PACKAGE = 'ru.ozon.fintech.finance';
  const BANK_WEB = 'https://finance.ozon.ru/';
  const OZON_OFFICIAL_APP_LINK = 'https://s.ozon.ru/4KjFvD6';
  const OZON_IOS_APP_LINK = 'https://s.ozon.ru/Uy5zkHT';
  const IOS_SCHEME = 'ozonbank://'; // best-effort; fallback below is always available

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
      ta.style.position='fixed';
      ta.style.left='-9999px';
      ta.style.opacity='0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try{ ok = document.execCommand('copy'); }catch(e){}
      ta.remove();
    }
    showToast(ok ? 'Номер карты скопирован' : 'Скопируйте номер карты вручную');
    return ok;
  }

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = isAndroid || isIOS || /Mobile/i.test(ua);

  function openAndroidApp(){
    // Chrome/Android: force the official Ozon Bank package when installed.
    // If the app is absent or the browser blocks the intent, Ozon's official
    // app link is used as a safe platform-aware fallback.
    const fallback = encodeURIComponent(OZON_OFFICIAL_APP_LINK);
    const intent = 'intent://finance.ozon.ru/#Intent;' +
      'scheme=https;' +
      'package=' + ANDROID_PACKAGE + ';' +
      'S.browser_fallback_url=' + fallback + ';' +
      'end';
    window.location.href = intent;
  }

  function openIOSApp(){
    // Ozon Bank does not publish a stable public iOS transfer deep-link.
    // We first make a best-effort attempt to open the installed app via its
    // app scheme. If the page remains visible, fall back to Ozon's own iOS link.
    let leftPage = false;
    let timer = null;

    const cleanup = ()=>{
      if(timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
    };
    const onVisibility = ()=>{
      if(document.visibilityState === 'hidden'){
        leftPage = true;
        cleanup();
      }
    };
    const onPageHide = ()=>{
      leftPage = true;
      cleanup();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide, {once:true});

    // Hidden iframe avoids replacing the current page if the scheme is unsupported.
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden','true');
    document.body.appendChild(iframe);
    try{ iframe.src = IOS_SCHEME; }catch(e){}

    timer = setTimeout(()=>{
      iframe.remove();
      cleanup();
      if(!leftPage && document.visibilityState === 'visible'){
        window.location.href = OZON_IOS_APP_LINK;
      }
    }, 1250);
  }

  function openOzonBank(){
    if(isAndroid){
      openAndroidApp();
      return;
    }
    if(isIOS){
      openIOSApp();
      return;
    }
    // Desktop / laptop: open the official web version in a new tab.
    window.open(BANK_WEB,'_blank','noopener,noreferrer');
  }

  async function copyAndOpen(){
    await copyCard();
    if(modal) modal.classList.add('show');
  }

  function fitToViewport(){
    if(!wrap) return;
    root.style.setProperty('--fit-scale','1');
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
      const finalScale = Math.max(0.78, scale);
      root.style.setProperty('--fit-scale', finalScale.toFixed(4));
      document.body.style.overflowY = scale >= 0.78 ? 'hidden' : 'auto';
    });
  }

  // Make the modal button text device-aware without changing the page layout.
  document.querySelectorAll('[data-open-bank]').forEach(el=>{
    if(isAndroid) el.textContent = 'Открыть Ozon Bank на Android';
    else if(isIOS) el.textContent = 'Открыть Ozon Bank на iPhone';
    else el.textContent = 'Открыть сайт Ozon Bank';
    el.addEventListener('click', openOzonBank);
  });

  document.querySelectorAll('[data-copy]').forEach(el=>el.addEventListener('click',copyCard));
  document.querySelectorAll('[data-copy-open]').forEach(el=>el.addEventListener('click',copyAndOpen));
  document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>modal && modal.classList.remove('show')));
  if(modal) modal.addEventListener('click',e=>{ if(e.target===modal) modal.classList.remove('show'); });

  document.querySelectorAll('[data-card-text]').forEach(el=>el.setAttribute('aria-label','Номер карты '+cardDigits));
  document.querySelectorAll('[data-recipient-text]').forEach(el=>el.setAttribute('aria-label','Получатель '+recipient));

  window.addEventListener('load',fitToViewport,{once:true});
  window.addEventListener('resize',fitToViewport);
  window.addEventListener('orientationchange',()=>setTimeout(fitToViewport,120));
  if(window.visualViewport) window.visualViewport.addEventListener('resize',fitToViewport);
})();

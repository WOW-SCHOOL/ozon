(function(){
  const root = document.documentElement;
  const card = root.dataset.card || '';
  const cardDigits = card.replace(/\D/g,'');
  const recipient = root.dataset.recipient || '';
  const wrap = document.querySelector('.wrap');
  const toast = document.getElementById('toast');
  const modal = document.getElementById('modal');

  const BANK_WEB = 'https://finance.ozon.ru/';
  const OZON_WEB = 'https://www.ozon.ru/';
  const BANK_ANDROID_PACKAGE = 'ru.ozon.fintech.finance';
  const OZON_ANDROID_PACKAGE = 'ru.ozon.app.android';
  // Ozon Bank does not publish a documented public browser deeplink. This custom scheme
  // is best-effort only; if the installed app does not expose it, the official bank site opens.
  const BANK_CUSTOM_SCHEME = 'ozonbank';

  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function showToast(msg){
    if(!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(()=>toast.classList.remove('show'),1450);
  }

  async function copyCard(showOwnToast=true){
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
      ta.focus(); ta.select();
      try{ ok = document.execCommand('copy'); }catch(e){}
      ta.remove();
    }
    if(showOwnToast) showToast(ok ? 'Номер карты скопирован' : 'Скопируйте номер карты вручную');
    return ok;
  }

  function bankHref(){
    if(isAndroid){
      // User gesture -> try Ozon Bank's package + custom scheme. If the app does not expose
      // a BROWSABLE handler, Chrome immediately falls back to the official bank website.
      const fallback = encodeURIComponent(BANK_WEB);
      return 'intent://open/#Intent;scheme=' + BANK_CUSTOM_SCHEME + ';package=' + BANK_ANDROID_PACKAGE + ';S.browser_fallback_url=' + fallback + ';end';
    }
    if(isIOS){
      return BANK_CUSTOM_SCHEME + '://';
    }
    return BANK_WEB;
  }

  function ozonHref(){
    if(isAndroid){
      // Ozon marketplace owns ozon.ru links, so this has a much better chance of opening
      // the installed Ozon app. If it cannot, the browser opens ozon.ru.
      const fallback = encodeURIComponent(OZON_WEB);
      return 'intent://www.ozon.ru/#Intent;scheme=https;package=' + OZON_ANDROID_PACKAGE + ';S.browser_fallback_url=' + fallback + ';end';
    }
    // iOS Universal Link / desktop website.
    return OZON_WEB;
  }

  function refreshOpenLinks(){
    const bank = document.querySelector('[data-open-bank]');
    const ozon = document.querySelector('[data-open-ozon]');
    if(bank){
      bank.setAttribute('href', bankHref());
      if(isAndroid) bank.querySelector('[data-device-note]').textContent = 'приложение Ozon Bank';
      else if(isIOS) bank.querySelector('[data-device-note]').textContent = 'приложение Ozon Bank';
      else bank.querySelector('[data-device-note]').textContent = 'сайт Ozon Bank';
    }
    if(ozon){
      ozon.setAttribute('href', ozonHref());
      if(isAndroid || isIOS) ozon.querySelector('[data-device-note]').textContent = 'приложение Ozon';
      else ozon.querySelector('[data-device-note]').textContent = 'сайт Ozon';
    }
  }

  async function copyAndOpenChooser(){
    // Do not show our own bottom toast here. Android itself may show its clipboard overlay.
    // The chooser is intentionally raised toward the middle of the screen so they don't overlap.
    await copyCard(false);
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

  refreshOpenLinks();

  document.querySelectorAll('[data-copy]').forEach(el=>el.addEventListener('click',()=>copyCard(true)));
  document.querySelectorAll('[data-copy-open]').forEach(el=>el.addEventListener('click',copyAndOpenChooser));
  document.querySelectorAll('[data-close]').forEach(el=>el.addEventListener('click',()=>modal && modal.classList.remove('show')));
  if(modal) modal.addEventListener('click',e=>{ if(e.target===modal) modal.classList.remove('show'); });

  document.querySelectorAll('[data-card-text]').forEach(el=>el.setAttribute('aria-label','Номер карты '+cardDigits));
  document.querySelectorAll('[data-recipient-text]').forEach(el=>el.setAttribute('aria-label','Получатель '+recipient));

  // iOS: if the bank's private custom scheme is not registered, Safari/WebView can remain on the page.
  // A small helper turns the Bank button into a normal official web fallback on the next tap.
  const bankLink = document.querySelector('[data-open-bank]');
  if(bankLink && isIOS){
    bankLink.addEventListener('click',()=>{
      let hidden = false;
      const onVis = ()=>{ if(document.visibilityState==='hidden') hidden=true; };
      document.addEventListener('visibilitychange',onVis,{once:true});
      setTimeout(()=>{
        if(!hidden && document.visibilityState==='visible') bankLink.setAttribute('href',BANK_WEB);
      },1200);
    });
  }

  window.addEventListener('load',fitToViewport,{once:true});
  window.addEventListener('resize',fitToViewport);
  window.addEventListener('orientationchange',()=>setTimeout(fitToViewport,120));
  if(window.visualViewport) window.visualViewport.addEventListener('resize',fitToViewport);
})();

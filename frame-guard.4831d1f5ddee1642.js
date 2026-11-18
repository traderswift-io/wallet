(function frameGuard() {
  const bootstrap = document.currentScript;
  const childPage = bootstrap.dataset.child === 'true';
  let allowed = false;
  let content;
  let started = false;
  function activate() {
    if (!allowed || !content || started) return;
    started = true;
    document.body.replaceChildren(content.content.cloneNode(true));
    const application = document.createElement('script');
    if (!childPage) application.type = 'module';
    application.src = bootstrap.dataset.appSrc;
    application.integrity = bootstrap.dataset.appIntegrity;
    application.crossOrigin = 'anonymous';
    document.head.append(application);
  }
  function receive(event) {
    try {
      if (window.parent === window.self || window.parent !== window.top
          || event.source !== window.parent || event.origin !== new URL(window.location.href).origin) return;
      const data = event.data;
      if (!data || data.channel !== 'traderswift:1' || data.type !== 'handshake'
          || typeof data.nonce !== 'string'
          || !/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i.test(data.nonce)) return;
      allowed = true;
      window.removeEventListener('message', receive);
      activate();
    } catch {}
  }
  try {
    const topWindow = window.top;
    if (childPage) {
      if (window.parent !== window.self && window.parent === topWindow) window.addEventListener('message', receive);
    } else allowed = topWindow === window.self;
  } catch {}
  document.addEventListener('DOMContentLoaded', () => {
    content = document.querySelector('template[data-wallet-content]');
    if (!allowed) {
      document.body.replaceChildren(document.querySelector('[data-wallet-direct]'));
      return;
    }
    activate();
  }, { once: true });
})();

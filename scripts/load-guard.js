// Runs inline before CSS and modules, so failed bundles cannot hide the recovery action.
(() => {
  let shown = false;
  function show() {
    if (shown) return;
    shown = true;
    const render = () => {
      const panel = document.createElement('aside');
      panel.id = 'load-error';
      panel.setAttribute('role', 'alert');
      panel.style.cssText = 'position:fixed;z-index:10000;inset:16px 16px auto;max-width:520px;margin:auto;padding:20px;border:2px solid #293e28;background:#aabd83;color:#293e28;font:16px/1.5 Arial,sans-serif;box-shadow:0 4px 30px #0008';
      const message = document.createElement('p');
      message.textContent = 'Spieldateien konnten nicht geladen werden. Lade die App erneut. Gespeicherte Partien und Rekorde bleiben erhalten.';
      const button = document.createElement('button');
      button.textContent = 'App neu laden';
      button.style.cssText = 'min-height:44px;padding:10px 18px;background:#293e28;color:#edf5cb;border:0;font:inherit;cursor:pointer';
      button.onclick = async () => {
        button.disabled = true;
        const scope = new URL('./', location.href).href;
        try {
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.filter(r => r.scope === scope).map(r => r.unregister()));
          }
        } catch { /* A direct reload is still useful when service workers are unavailable. */ }
        // localStorage and caches are never deleted by this repair.
        location.reload();
      };
      panel.append(message, button);
      document.body.append(panel);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, { once: true });
    else render();
  }
  window.addEventListener('error', event => {
    const target = event.target;
    if (target instanceof HTMLScriptElement || (target instanceof HTMLLinkElement && target.rel === 'stylesheet')) show();
  }, true);
  window.addEventListener('vite:preloadError', show);
})();

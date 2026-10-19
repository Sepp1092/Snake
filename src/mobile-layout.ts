/** Fit presentation to the current viewport without touching the canvas bitmap or game. */
export function installMobileLayout() {
  const body = document.body;
  const query = matchMedia('(max-width:600px), (max-width:960px) and (max-height:500px)');
  const phone = document.querySelector<HTMLElement>('.phone')!;
  const toolbar = document.querySelector<HTMLElement>('.toolbar')!;
  const controls = document.querySelector<HTMLElement>('.full-controls')!;
  const lcd = document.querySelector<HTMLElement>('.lcd')!;
  let pending = false;
  const fit = () => {
    pending = false;
    if (!query.matches) {
      phone.style.removeProperty('--mobile-phone-width');
      phone.style.removeProperty('--mobile-lcd-width');
      return;
    }
    const css = getComputedStyle(body);
    const height = body.getBoundingClientRect().height;
    const available = height - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
    const gap = parseFloat(css.rowGap) || 0;
    const full = body.classList.contains('full');
    const landscape = innerWidth > innerHeight;
    const controlHeight = full && !landscape && getComputedStyle(controls).display !== 'none' ? controls.getBoundingClientRect().height : 0;
    const insetToolbar = !full && landscape && innerWidth > 500 && innerHeight <= 380;
    const budget = insetToolbar ? available : available - toolbar.getBoundingClientRect().height - controlHeight - gap * (controlHeight ? 2 : 1);
    const wrap = document.querySelector<HTMLElement>('.wrap')!;
    const width = wrap.getBoundingClientRect().width;
    const lcdBox = lcd.getBoundingClientRect();
    const lcdHeight = lcdBox.height - 6; // The existing three-pixel LCD border.
    const phoneBox = phone.getBoundingClientRect();
    if (!full && landscape) {
      // The real 15-key handset keyboard is beside the LCD on short landscape screens.
      const face = document.querySelector<HTMLElement>('.face')!;
      const top = document.querySelector<HTMLElement>('.brand')!;
      const status = document.querySelector<HTMLElement>('.status')!;
      const trim = parseFloat(getComputedStyle(phone).paddingTop) + parseFloat(getComputedStyle(phone).paddingBottom) + 4;
      const room = Math.max(0, budget - trim - top.getBoundingClientRect().height - status.getBoundingClientRect().height);
      const faceTrim = face.getBoundingClientRect().height - lcdHeight;
      const faceWidth = phone.clientWidth - parseFloat(getComputedStyle(phone).paddingLeft) - parseFloat(getComputedStyle(phone).paddingRight) - document.querySelector('.keys')!.getBoundingClientRect().width - 10;
      if (insetToolbar) {
        if (body.style.getPropertyValue('--handset-toolbar-width') !== `${faceWidth}px`) body.style.setProperty('--handset-toolbar-width', `${faceWidth}px`);
        const left = `${phoneBox.x + 2 + parseFloat(getComputedStyle(phone).paddingLeft)}px`; if (body.style.getPropertyValue('--handset-toolbar-left') !== left) body.style.setProperty('--handset-toolbar-left', left);
        const top = `${phoneBox.y + 2 + parseFloat(getComputedStyle(phone).paddingTop)}px`; if (body.style.getPropertyValue('--handset-toolbar-top') !== top) body.style.setProperty('--handset-toolbar-top', top);
      }
      phone.style.setProperty('--mobile-lcd-width', `${Math.max(1, Math.min(faceWidth, (room - faceTrim) * 320 / 244 + face.getBoundingClientRect().width - lcdBox.width + 6))}px`);
      phone.style.setProperty('--mobile-phone-width', `${width}px`);
    } else {
      const verticalTrim = phoneBox.height - lcdHeight;
      const horizontalTrim = phoneBox.width - (lcdBox.width - 6);
      // Measure actual chrome/key heights, including chosen key size, fonts and wrapped toolbar.
      const fitted = Math.min(width, Math.max(1, budget - verticalTrim) * 320 / 244 + horizontalTrim);
      const value = `${Math.floor(fitted * 64) / 64}px`;
      if (phone.style.getPropertyValue('--mobile-phone-width') !== value) phone.style.setProperty('--mobile-phone-width', value);
      phone.style.removeProperty('--mobile-lcd-width');
    }
  };
  const schedule = () => { if (!pending) { pending = true; requestAnimationFrame(fit); } };
  const observer = new ResizeObserver(schedule);
  for (const element of [body, toolbar, controls, phone]) observer.observe(element);
  new MutationObserver(fit).observe(body, { attributes:true, attributeFilter:['class','data-scene','data-key-size','data-touch-layout','data-show-controls','style'] });
  query.addEventListener('change', fit);
  window.addEventListener('resize', fit);
  visualViewport?.addEventListener('resize', fit);
  document.fonts.ready.then(schedule);
  fit();
}

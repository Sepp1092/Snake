/** Activate the public toolbar action, following the mobile More route when hidden. */
export async function toolbarAction(page, id, touch=false) {
  const activate=locator=>locator[touch?'tap':'click']();
  const direct=page.locator('#'+(id==='restart'?'start':id==='resume'?'pause':id));
  if(await direct.isVisible())return activate(direct);
  if(id==='resume')return activate(page.locator('#pause'));
  const mapped={start:'more-restart',restart:'more-restart',sound:'more-sound',settings:'more-settings'}[id];
  if(!mapped)throw Error('Unknown mobile toolbar action: '+id);
  if(!await page.locator('#more-panel').isVisible())await activate(page.locator('#more'));
  await activate(page.locator('#'+mapped));
  if((id==='sound')&&await page.locator('#more-panel').isVisible())await activate(page.locator('#more-close'));
}

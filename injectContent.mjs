/*
 * This is a workaround to get modules to work in extension content scripts
 * https://medium.com/@otiai10/how-to-use-es6-import-with-chrome-extension-bd5217b9c978
 */
;(async () => {
  const src = chrome.extension.getURL('content.mjs')
  await import(src)
})()

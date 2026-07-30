let _prompt: Event | null = null

export function getInstallPrompt() {
  return _prompt
}

export function clearInstallPrompt() {
  _prompt = null
}

export function isIOS(): boolean {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  const ua = nav.userAgent
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
}

export function isIOSSafari(): boolean {
  if (!isIOS()) return false
  const ua = window.navigator.userAgent
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
}

const IOS_DISMISS_KEY = 'ios-install-dismissed'

export function hasIOSInstallBeenDismissed(): boolean {
  return localStorage.getItem(IOS_DISMISS_KEY) === '1'
}

export function dismissIOSInstall(): void {
  localStorage.setItem(IOS_DISMISS_KEY, '1')
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  _prompt = e
  window.dispatchEvent(new CustomEvent('installpromptready'))
})

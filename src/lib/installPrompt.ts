let _prompt: Event | null = null

export function getInstallPrompt() {
  return _prompt
}

export function clearInstallPrompt() {
  _prompt = null
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  _prompt = e
  window.dispatchEvent(new CustomEvent('installpromptready'))
})

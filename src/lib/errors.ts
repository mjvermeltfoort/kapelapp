const KNOWN_MESSAGES: Record<string, string> = {
  'Active membership not found': 'Actief lidmaatschap niet gevonden.',
  'Admins cannot assign owner role': 'Beheerders kunnen geen eigenaarsrol toekennen.',
  'Admins cannot change owner memberships': 'Beheerders kunnen eigenaren niet wijzigen.',
  'Admins cannot deactivate owners': 'Beheerders kunnen eigenaren niet deactiveren.',
  'Admins cannot delete owner memberships': 'Beheerders kunnen eigenaren niet verwijderen.',
  'Admins cannot reactivate owners': 'Beheerders kunnen eigenaren niet heractiveren.',
  'Authentication required': 'Je sessie is verlopen. Log opnieuw in.',
  'Author not found': 'Afzender niet gevonden.',
  'Band name is required': 'Kapelnaam is verplicht.',
  'Instrument name is required': 'Instrumentnaam is verplicht.',
  'Insufficient permissions': 'Je hebt geen rechten voor deze actie.',
  'Invalid invite token': 'Deze uitnodiging is ongeldig.',
  'Invalid role': 'Ongeldige rol.',
  'Invite has expired': 'Deze uitnodiging is verlopen.',
  'Invite is no longer active': 'Deze uitnodiging is niet meer actief.',
  'Invite not found': 'Uitnodiging niet gevonden.',
  'Invite usage limit reached': 'Deze uitnodiging is al te vaak gebruikt.',
  'Last owner cannot be deactivated': 'De laatste eigenaar kan niet gedeactiveerd worden.',
  'Last owner cannot be deleted': 'De laatste eigenaar kan niet verwijderd worden.',
  'Last owner cannot leave band': 'De laatste eigenaar kan de kapel niet verlaten.',
  'Last owner cannot lose owner role': 'De laatste eigenaar moet eigenaar blijven.',
  'Membership not found': 'Lidmaatschap niet gevonden.',
  'Only member invites are supported': 'Alleen uitnodigingen voor leden worden ondersteund.',
  'Performance not found': 'Optreden niet gevonden.',
  'Use leave_band for your own membership': 'Gebruik "Kapel verlaten" op je profiel voor je eigen lidmaatschap.',
}

const CODE_MESSAGES: Record<string, string> = {
  '42501': 'Je hebt geen rechten voor deze actie.',
  '23505': 'Dit bestaat al.',
  '23503': 'Dit item is gekoppeld aan andere gegevens.',
  '23514': 'Een of meer velden zijn ongeldig.',
  '23502': 'Een verplicht veld ontbreekt.',
  PGRST116: 'Niet gevonden of geen toegang.',
  PGRST301: 'Je sessie is verlopen. Log opnieuw in.',
  otp_expired: 'De code is verlopen of ongeldig. Vraag een nieuwe code aan.',
  over_email_send_rate_limit: 'Te veel e-mails verstuurd. Wacht even en probeer opnieuw.',
  over_request_rate_limit: 'Te veel pogingen. Wacht even en probeer opnieuw.',
  email_address_invalid: 'Dit e-mailadres is ongeldig.',
  validation_failed: 'Controleer de ingevulde gegevens.',
}

const NETWORK_MESSAGE = 'Geen verbinding. Controleer je internet en probeer opnieuw.'

function isDutchAppMessage(message: string) {
  return /^(Geen|Ingelogde|Kies|Vul|Voer)\b/.test(message)
}

export function getErrorMessage(error: unknown, fallback = 'Er ging iets mis. Probeer het opnieuw.'): string {
  if (!error || typeof error !== 'object') {
    return fallback
  }

  const { code, message } = error as { code?: unknown; message?: unknown }
  const text = typeof message === 'string' ? message.trim() : ''

  if (text && KNOWN_MESSAGES[text]) {
    return KNOWN_MESSAGES[text]
  }

  if (typeof code === 'string' && CODE_MESSAGES[code]) {
    return CODE_MESSAGES[code]
  }

  if (/failed to fetch|networkerror|load failed|network request failed/i.test(text)) {
    return NETWORK_MESSAGE
  }

  if (text && isDutchAppMessage(text)) {
    return text
  }

  console.error(error)
  return fallback
}

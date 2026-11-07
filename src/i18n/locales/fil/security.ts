import type { security as en } from '../en/security'

export const security: Record<keyof typeof en, string> = {
  currentPassword: 'Kasalukuyang password',
  newPassword: 'Bagong password',
  confirmNewPassword: 'Ulitin ang bagong password',
  passwordHint: 'Hindi bababa sa {min} na character, at iba sa kasalukuyang password mo.',
  passwordTooShort: 'Gumamit ng hindi bababa sa {min} na character.',
  passwordMismatch: 'Hindi magkapareho ang mga bagong password.',
  passwordSame: 'Pumili ng password na iba sa kasalukuyan mo.',
  changePassword: 'Palitan ang password',
  changingPassword: 'Pinapalitan ang password…',
  passwordChanged: 'Napalitan na ang password mo. Na-sign out ang ibang mga device.',
  passwordError: 'Hindi mapalitan ang password mo. Subukan ulit.',
}

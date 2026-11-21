/**
 * Et kort ryk i telefonen. Virker på Android; iPhone og computere har ikke
 * navigator.vibrate, og så sker der ingenting.
 */
export function vibrate(milliseconds = 30): void {
  if (typeof navigator.vibrate === 'function') navigator.vibrate(milliseconds)
}

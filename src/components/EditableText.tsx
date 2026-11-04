import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

type EditableTextProps = {
  label: string
  value: string
  /** Kaldes med den nye tekst, når feltet forlades, og teksten er ændret. */
  onCommit: (value: string) => void
  /** Flere linjer (textarea). Her laver Enter et linjeskift i stedet for at gemme. */
  multiline?: boolean
  /** Feltet må ikke være tomt; en tom tekst sættes tilbage til den gamle. */
  required?: boolean
  /** Sæt fokus og markér teksten, når feltet vises (kun ét linje-felter). */
  autoFocus?: boolean
}

/**
 * Tekstfelt med sin egen kladde. Mens man skriver, ændres kun kladden; først
 * ved blur (eller Enter) sendes teksten videre. Så kører reduceren ikke ved
 * hvert tastetryk, og et navn, der midlertidigt er tomt, afvises ikke.
 * Escape fortryder ændringerne i feltet.
 */
export function EditableText({
  label,
  value,
  onCommit,
  multiline = false,
  required = false,
  autoFocus = false,
}: EditableTextProps) {
  const [draft, setDraft] = useState(value)
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!autoFocus) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [autoFocus])

  function commit() {
    const text = draft.trim()
    if (required && !text) {
      setDraft(value)
      return
    }
    setDraft(text)
    if (text !== value) onCommit(text)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape' && draft !== value) {
      // Stop Escape her, så den ikke også lukker panelet.
      event.stopPropagation()
      setDraft(value)
    } else if (event.key === 'Enter' && !multiline) {
      // blur udløser onBlur og dermed commit, så der kun gemmes ét sted.
      event.currentTarget.blur()
    }
  }

  const shared = {
    id,
    value: draft,
    onBlur: commit,
    onKeyDown: handleKeyDown,
    className: 'field-input',
  }

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {multiline ? (
        <textarea
          {...shared}
          rows={3}
          onChange={(event) => setDraft(event.target.value)}
        />
      ) : (
        <input
          {...shared}
          ref={inputRef}
          type="text"
          onChange={(event) => setDraft(event.target.value)}
        />
      )}
    </div>
  )
}

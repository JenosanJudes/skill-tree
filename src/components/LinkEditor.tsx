import { useState } from 'react'
import type { FormEvent } from 'react'
import { isSafeUrl } from '../store/treeUtils'
import type { SkillLink } from '../types/skillTree'

type LinkEditorProps = {
  links: SkillLink[]
  onAdd: (title: string, url: string) => void
  onRemove: (index: number) => void
}

/** Liste af links med "Slet" ved hvert, og en formular til nye links. */
export function LinkEditor({ links, onAdd, onRemove }: LinkEditorProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Uden preventDefault ville browseren genindlæse siden.
    event.preventDefault()
    if (!isSafeUrl(url.trim())) {
      setError('Adressen skal starte med http:// eller https://')
      return
    }
    onAdd(title, url)
    setTitle('')
    setUrl('')
    setError('')
  }

  return (
    <section className="field">
      <h3 className="field-label">Links</h3>
      {links.length > 0 && (
        <ul className="link-list">
          {links.map((link, index) => (
            // Links har intet id, så placeringen bruges som nøgle.
            <li key={index}>
              {/* Data kan komme fra en importeret fil, så adressen tjekkes
                  også her, før den bliver til et klikbart link. */}
              {isSafeUrl(link.url) ? (
                // noopener: den nye fane får ingen adgang til vores side.
                // noreferrer: siden får ikke at vide, hvor man kom fra.
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.title}
                </a>
              ) : (
                <span>{link.title}</span>
              )}
              <button
                type="button"
                className="small-button"
                aria-label={`Slet link ${link.title}`}
                onClick={() => onRemove(index)}
              >
                Slet
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* noValidate: vi viser vores egen fejlbesked i stedet for browserens. */}
      <form className="link-form" onSubmit={handleSubmit} noValidate>
        <input
          className="field-input"
          aria-label="Linkets titel"
          placeholder="Titel (valgfri)"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <input
          className="field-input"
          type="url"
          aria-label="Linkets adresse"
          placeholder="https://"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value)
            setError('')
          }}
        />
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="small-button">
          Tilføj link
        </button>
      </form>
    </section>
  )
}

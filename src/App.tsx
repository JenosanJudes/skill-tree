import { useMemo, useState } from 'react'
import { PowerMeter } from './components/PowerMeter'
import { SidePanel } from './components/SidePanel'
import { SkillTreeView } from './components/SkillTreeView'
import { Toolbar } from './components/Toolbar'
import { MOBILE_QUERY, useMediaQuery } from './components/useMediaQuery'
import { TreeProvider } from './store/TreeContext'
import { useBackground } from './store/useBackground'

/** Sidepanelets bredde i pixels. Skal passe med .side-panel i index.css. */
const SIDE_PANEL_WIDTH = 340
/**
 * Hvor stor en del af skærmens højde bundarket højst fylder i den korte
 * visning. Skal passe med .side-panel.sheet.peek i index.css.
 */
const SHEET_PEEK_FRACTION = 0.4

function App() {
  // Den valgte node er UI-tilstand og ikke en del af træets data,
  // så den ligger her og ikke i Tree store (og bliver ikke gemt).
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Tælles op ved hver import. Bruges som key på træ-visningen: en ny key
  // får React til at lave visningen forfra, så zoom starter helt forfra.
  const [importCount, setImportCount] = useState(0)
  // Baggrundsbilledet er ikke en del af træet og ligger i IndexedDB.
  const background = useBackground()

  // På en telefon ligger panelet i bunden, ellers i højre side. useMemo
  // giver samme objekt hver gang, så træet ikke tegnes om uden grund.
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const covered = useMemo(
    () =>
      isMobile
        ? { right: 0, bottom: window.innerHeight * SHEET_PEEK_FRACTION }
        : { right: SIDE_PANEL_WIDTH, bottom: 0 },
    [isMobile],
  )

  function handleImported() {
    setSelectedId(null)
    setImportCount((count) => count + 1)
  }

  return (
    <TreeProvider>
      <div className="app">
        <SkillTreeView
          key={importCount}
          selectedId={selectedId}
          onSelect={setSelectedId}
          backgroundUrl={background.url}
          covered={covered}
          controls={
            <>
              <Toolbar
                onImported={handleImported}
                hasBackground={background.url !== null}
                onBackgroundChosen={background.setBackground}
                onBackgroundRemoved={background.removeBackground}
              />
              <PowerMeter />
            </>
          }
        />
        <SidePanel selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    </TreeProvider>
  )
}

export default App

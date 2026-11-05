import { useState } from 'react'
import { SidePanel } from './components/SidePanel'
import { SkillTreeView } from './components/SkillTreeView'
import { Toolbar } from './components/Toolbar'
import { TreeProvider } from './store/TreeContext'

function App() {
  // Den valgte node er UI-tilstand og ikke en del af træets data,
  // så den ligger her og ikke i Tree store (og bliver ikke gemt).
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Tælles op ved hver import. Bruges som key på træ-visningen: en ny key
  // får React til at lave visningen forfra, så zoom starter helt forfra.
  const [importCount, setImportCount] = useState(0)

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
          controls={<Toolbar onImported={handleImported} />}
        />
        <SidePanel selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    </TreeProvider>
  )
}

export default App

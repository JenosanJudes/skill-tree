import { useState } from 'react'
import { SidePanel } from './components/SidePanel'
import { SkillTreeView } from './components/SkillTreeView'
import { TreeProvider } from './store/TreeContext'

function App() {
  // Den valgte node er UI-tilstand og ikke en del af træets data,
  // så den ligger her og ikke i Tree store (og bliver ikke gemt).
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <TreeProvider>
      <div className="app">
        <SkillTreeView selectedId={selectedId} onSelect={setSelectedId} />
        <SidePanel selectedId={selectedId} onSelect={setSelectedId} />
      </div>
    </TreeProvider>
  )
}

export default App

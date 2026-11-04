import { SkillTreeView } from './components/SkillTreeView'
import { TreeProvider } from './store/TreeContext'

function App() {
  return (
    <TreeProvider>
      <SkillTreeView />
    </TreeProvider>
  )
}

export default App

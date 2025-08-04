import React from 'react'
import ReactDOM from 'react-dom/client'
import ShortcutsModal from '../components/Shortcuts/ShortcutsModal'

// Standalone shortcuts entry point for code splitting
function ShortcutsApp() {
  return (
    <ShortcutsModal
      isOpen={true}
      onClose={() => {
        // Close by posting message back to main app
        window.parent?.postMessage({ type: 'CLOSE_SHORTCUTS' }, '*')
      }}
    />
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ShortcutsApp />
  </React.StrictMode>,
)
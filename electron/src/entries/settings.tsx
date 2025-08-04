import React from 'react'
import ReactDOM from 'react-dom/client'
import SettingsModal from '../components/Settings/SettingsModal'
import SettingsErrorModal from '../components/Settings/SettingsErrorModal'
import { useSettingsStore } from '../stores/settingsStore'

// Standalone settings entry point for code splitting
function SettingsApp() {
  const { 
    corruptionStatus, 
    loadSettings, 
    resetSettings, 
    openSettingsInEditor,
    reloadSettings
  } = useSettingsStore()

  React.useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return (
    <>
      <SettingsModal
        isOpen={true}
        onClose={() => {
          // Close by posting message back to main app
          window.parent?.postMessage({ type: 'CLOSE_SETTINGS' }, '*')
        }}
      />

      <SettingsErrorModal
        isOpen={corruptionStatus?.corrupted || false}
        onClose={() => {}} // Don't allow closing this modal - they must fix the issue
        corruptionStatus={corruptionStatus || { corrupted: false, error: null, settingsPath: '' }}
        onReset={resetSettings}
        onOpenInEditor={openSettingsInEditor}
        onRefresh={reloadSettings}
      />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsApp />
  </React.StrictMode>,
)
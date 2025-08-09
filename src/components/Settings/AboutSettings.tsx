import { useState } from 'react'
import { ExternalLink, Download, CheckCircle2 } from 'lucide-react'
import PrivacyPolicyModal from './PrivacyPolicyModal'
import { checkForUpdates, promptAndInstallUpdate } from '../../utils/updater'

export default function AboutSettings() {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'none' | 'error'>('idle')

  const handleOpenWebsite = () => {
    console.log('Opening website: https://weisssolutions.org')
    // In real app: window.electronAPI?.shell?.openExternal('https://weisssolutions.org')
  }

  const handleCheckForUpdates = async () => {
    // Only check for updates in built app (not dev mode)
    if (typeof window === 'undefined' || !('__TAURI__' in window)) {
      ;(window as any).showToast?.({
        type: 'info',
        title: 'Updates not available',
        message: 'Auto-updates are disabled in development mode'
      })
      return
    }

    setIsCheckingUpdates(true)
    setUpdateStatus('checking')

    try {
      const updateInfo = await checkForUpdates()
      
      if (updateInfo) {
        setUpdateStatus('available')
        ;(window as any).showToast?.({
          type: 'info',
          title: 'Update available!',
          message: `Version ${updateInfo.version} is ready to install`
        })
      } else {
        setUpdateStatus('none')
        ;(window as any).showToast?.({
          type: 'success',
          title: 'You\'re up to date!',
          message: 'You\'re running the latest version of Open Chat'
        })
      }
    } catch (error) {
      console.error('Error checking for updates:', error)
      setUpdateStatus('error')
      ;(window as any).showToast?.({
        type: 'error',
        title: 'Failed to check for updates',
        message: 'Please check your internet connection and try again'
      })
    } finally {
      setIsCheckingUpdates(false)
      
      // Reset status after a few seconds if no update available
      setTimeout(() => {
        if (updateStatus !== 'available') {
          setUpdateStatus('idle')
        }
      }, 3000)
    }
  }

  const handleInstallUpdate = async () => {
    if (typeof window === 'undefined' || !('__TAURI__' in window)) {
      return
    }

    try {
      ;(window as any).showToast?.({
        type: 'info',
        title: 'Starting update...',
        message: 'The app will restart after the update is installed'
      })
      
      await promptAndInstallUpdate()
    } catch (error) {
      console.error('Error installing update:', error)
      ;(window as any).showToast?.({
        type: 'error',
        title: 'Update failed',
        message: 'Please try again or download the update manually'
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">About Open Chat</h3>
        <div className="space-y-4 text-sm">
          <p>
            Open Chat is a modern, privacy-focused chat application that allows you to interact with multiple language model providers while keeping your data secure and on-device.
          </p>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h4 className="text-md font-semibold mb-4">About Weiss Solutions</h4>
        <div className="space-y-4 text-sm">
          <p>
            Weiss Solutions specializes in transforming ideas into polished digital solutions. We focus on custom software development for businesses and individuals, emphasizing innovation, user-focused design, and high-quality implementations.
          </p>
          
          <div className="space-y-2">
            <p><strong>Our Services:</strong></p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Mobile Development: Native iOS and Android applications</li>
              <li>Web Development: Responsive, modern web applications</li>
              <li>Software Consulting: Expert guidance and development services</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p><strong>Our Values:</strong></p>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong>Innovation:</strong> Embracing cutting-edge technologies and creative solutions</li>
              <li><strong>User-Focused:</strong> Creating intuitive experiences that prioritize user needs</li>
              <li><strong>Quality:</strong> Delivering robust, maintainable solutions that exceed expectations</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleOpenWebsite}
              className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
            >
              Visit weisssolutions.org
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h4 className="text-md font-semibold mb-4">Privacy & Data</h4>
        <div className="space-y-3 text-sm">
          <p>
            We built Open Chat with privacy as a core principle. All your conversations and data stay on your device, and we only collect minimal, anonymized analytics to improve the app.
          </p>
          
          <button
            onClick={() => setShowPrivacyPolicy(true)}
            className="text-blue-500 hover:text-blue-600 underline transition-colors"
          >
            View Privacy Policy
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h4 className="text-md font-semibold mb-4">Updates</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm">Keep your app up to date with the latest features and security fixes.</p>
              {updateStatus === 'none' && (
                <p className="text-xs text-green-600">You're running the latest version</p>
              )}
              {updateStatus === 'available' && (
                <p className="text-xs text-blue-600">New update available!</p>
              )}
              {updateStatus === 'error' && (
                <p className="text-xs text-red-600">Failed to check for updates</p>
              )}
            </div>
            
            <div className="flex gap-2">
              {updateStatus === 'available' && (
                <button
                  onClick={handleInstallUpdate}
                  className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Download className="h-3 w-3" />
                  Install Update
                </button>
              )}
              
              <button
                onClick={handleCheckForUpdates}
                disabled={isCheckingUpdates}
                className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {updateStatus === 'checking' ? (
                  <div className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : updateStatus === 'none' ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                {updateStatus === 'checking' ? 'Checking...' : 'Check for Updates'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Open Chat v0.1.0</p>
          <p>Contact: contact@weisssolutions.org</p>
        </div>
      </div>

      <PrivacyPolicyModal 
        isOpen={showPrivacyPolicy} 
        onClose={() => setShowPrivacyPolicy(false)} 
      />
    </div>
  )
}
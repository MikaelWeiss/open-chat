import { X } from 'lucide-react'

interface PrivacyPolicyModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null

  const handleOpenTelemetryDeckPrivacy = () => {
    console.log('Opening TelemetryDeck privacy policy')
    // In real app: window.electronAPI?.shell?.openExternal('https://telemetrydeck.com/privacy')
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-background border border-border rounded-xl w-[700px] max-h-[600px] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-muted-foreground scrollbar-track-transparent">
          <div className="space-y-4 text-sm leading-relaxed">
            <h3 className="text-lg font-semibold mb-4">Open Chat Privacy Policy</h3>
            
            <div className="space-y-4">
              <p>
                We made this app because we wanted a more private solution and wanted to be able to use providers that are US based and don't train on your data.
              </p>
              
              <p>
                That said, we made it so you can use any provider you like, and not every provider has the same privacy policy, so you should always refer back to the provider's privacy policy for how they handle your data.
              </p>
              
              <p>
                <strong>Data Storage:</strong> All your messages and outputs are stored on device. We do not have access to your conversations or any personal data you input into the application.
              </p>
              
              <div>
                <p className="font-semibold mb-2">Analytics:</p>
                <p>
                  TelemetryDeck is used to understand basic analytics like the number of people using the app and what features people use most. TelemetryDeck is anonymized and private by default. If you'd like to learn more about how TelemetryDeck handles data, please refer to{' '}
                  <button
                    onClick={handleOpenTelemetryDeckPrivacy}
                    className="text-blue-500 hover:text-blue-600 underline"
                  >
                    TelemetryDeck's privacy policy
                  </button>
                  .
                </p>
              </div>
              
              <div>
                <p className="font-semibold mb-2">Third-Party Services:</p>
                <p>
                  When you choose to use third-party language model providers (such as OpenAI, Anthropic, etc.), your data will be subject to their respective privacy policies and terms of service. We recommend reviewing the privacy policies of any providers you choose to use.
                </p>
              </div>
              
              <p className="pt-4 border-t border-border text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
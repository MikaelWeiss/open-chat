import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import PrivacyPolicyModal from './PrivacyPolicyModal'

export default function AboutSettings() {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)

  const handleOpenWebsite = () => {
    window.electronAPI?.shell?.openExternal('https://weisssolutions.org')
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
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Open Chat v1.0.0</p>
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
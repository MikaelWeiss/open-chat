import React, { useState } from 'react'
import { ChevronRight, MessageSquare, Shield, Sparkles, Settings } from 'lucide-react'
import { NavigationStack } from '../NavigationStack'
import { mobileFeatures } from '../../../utils/featureFlags'

interface MobileOnboardingFlowProps {
  onComplete: () => void
}

type OnboardingStep = 'welcome' | 'features' | 'setup' | 'privacy'

export const MobileOnboardingFlow: React.FC<MobileOnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')

  if (!mobileFeatures.iosNavigation) {
    return null
  }

  const renderWelcomeScreen = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="w-24 h-24 bg-blue-500 rounded-3xl mb-8 flex items-center justify-center shadow-lg">
        <MessageSquare className="h-12 w-12 text-white" />
      </div>
      
      <h1 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">
        Welcome to Open Chat
      </h1>
      
      <p className="text-lg text-center text-gray-600 dark:text-gray-400 mb-12 leading-relaxed max-w-sm">
        Your intelligent AI chat companion for iOS. Connect with multiple AI providers and have meaningful conversations.
      </p>
      
      <button
        onClick={() => setCurrentStep('features')}
        className="ios-button-primary bg-blue-500 text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center space-x-3 ios-button-touch ios-spring-animation shadow-lg"
      >
        <span>Get Started</span>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )

  const renderFeaturesScreen = () => (
    <div className="flex-1 p-8 bg-white dark:bg-gray-800">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Powerful Features
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Everything you need for intelligent conversations
        </p>
      </div>

      <div className="space-y-8 mb-12">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Multiple AI Providers
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect to OpenAI, Anthropic Claude, and other leading AI services
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Smart Conversations
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Context-aware chats that remember your conversation history
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Privacy First
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your API keys are stored securely in iOS Keychain
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => setCurrentStep('welcome')}
          className="flex-1 ios-button-secondary bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-4 rounded-2xl font-semibold ios-button-touch"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep('setup')}
          className="flex-1 ios-button-primary bg-blue-500 text-white py-4 rounded-2xl font-semibold ios-button-touch ios-spring-animation"
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderSetupScreen = () => (
    <div className="flex-1 p-8 bg-white dark:bg-gray-800">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-3xl mx-auto mb-6 flex items-center justify-center">
          <Settings className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Quick Setup
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Let's get you connected to your AI providers
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-8">
        <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
          Ready to chat!
        </h3>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          You can set up AI providers now or skip and add them later from Settings.
        </p>
        <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
          <li>• Add your OpenAI or Claude API keys</li>
          <li>• Choose your preferred models</li>
          <li>• Start chatting immediately</li>
        </ul>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={() => setCurrentStep('privacy')}
          className="flex-1 ios-button-secondary bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 py-4 rounded-2xl font-semibold ios-button-touch"
        >
          Skip Setup
        </button>
        <button
          onClick={() => {
            // TODO: Navigate to provider setup
            setCurrentStep('privacy')
          }}
          className="flex-1 ios-button-primary bg-blue-500 text-white py-4 rounded-2xl font-semibold ios-button-touch ios-spring-animation"
        >
          Add Provider
        </button>
      </div>
    </div>
  )

  const renderPrivacyScreen = () => (
    <div className="flex-1 p-8 bg-white dark:bg-gray-800">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-3xl mx-auto mb-6 flex items-center justify-center">
          <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Your Privacy Matters
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We're committed to keeping your data secure
        </p>
      </div>

      <div className="space-y-6 mb-12">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-100">
            🔐 Secure Storage
          </h3>
          <p className="text-green-700 dark:text-green-300 text-sm">
            API keys are encrypted and stored in iOS Keychain, the most secure storage available on iOS.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
            🏠 Local Processing
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Your conversations are stored locally on your device. No data is sent to our servers.
          </p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-900 dark:text-purple-100">
            ⚡ Direct Connection
          </h3>
          <p className="text-purple-700 dark:text-purple-300 text-sm">
            Your messages go directly to your chosen AI provider. We never see your conversations.
          </p>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="w-full ios-button-primary bg-blue-500 text-white py-4 rounded-2xl font-semibold text-lg ios-button-touch ios-spring-animation shadow-lg"
      >
        Start Chatting
      </button>
    </div>
  )

  const getTitle = () => {
    switch (currentStep) {
      case 'features': return 'Features'
      case 'setup': return 'Setup'
      case 'privacy': return 'Privacy'
      default: return ''
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome': return renderWelcomeScreen()
      case 'features': return renderFeaturesScreen()
      case 'setup': return renderSetupScreen()
      case 'privacy': return renderPrivacyScreen()
    }
  }

  if (currentStep === 'welcome') {
    return renderWelcomeScreen()
  }

  return (
    <NavigationStack
      title={getTitle()}
      onBack={() => {
        switch (currentStep) {
          case 'features': setCurrentStep('welcome'); break
          case 'setup': setCurrentStep('features'); break
          case 'privacy': setCurrentStep('setup'); break
        }
      }}
      showBackButton
    >
      {renderCurrentStep()}
    </NavigationStack>
  )
}
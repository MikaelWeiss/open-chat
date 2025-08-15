import React, { useState } from 'react'
import { ChevronRight, User, Palette, Shield, Info, Plus, Check } from 'lucide-react'
import { useAppStore } from '../../../stores/appStore'
import { useSettings } from '../../../hooks/useSettings'
import { NavigationStack } from '../NavigationStack'
import { SettingsListGroup } from './SettingsListGroup'
import { ProviderConfigView } from './ProviderConfigView'
import { mobileFeatures } from '../../../utils/featureFlags'

interface MobileSettingsViewProps {
  onClose: () => void
}

type SettingsScreen = 'main' | 'theme' | 'providers' | 'provider-config' | 'about'

export const MobileSettingsView: React.FC<MobileSettingsViewProps> = ({ onClose }) => {
  const [currentScreen, setCurrentScreen] = useState<SettingsScreen>('main')
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const { theme, handleThemeChange } = useSettings()
  const providersRecord = useAppStore(state => state.providers)
  const providers = Object.values(providersRecord)
  const name = 'User' // TODO: Get from settings
  
  if (!mobileFeatures.iosNavigation) {
    return <div>Mobile settings not available</div>
  }

  const renderMainSettings = () => (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900">
      <SettingsListGroup title="General">
        <SettingsListItem
          icon={<User className="h-6 w-6 text-blue-500" />}
          title="Name"
          subtitle={name || 'Not set'}
          onPress={() => {
            // Handle name input - could show a modal or inline edit
          }}
        />
        <SettingsListItem
          icon={<Palette className="h-6 w-6 text-purple-500" />}
          title="Theme"
          subtitle={theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}
          onPress={() => setCurrentScreen('theme')}
          showChevron
        />
      </SettingsListGroup>

      <SettingsListGroup title="AI Providers">
        {providers.map((provider: any) => (
          <SettingsListItem
            key={provider.id}
            icon={
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            }
            title={provider.name}
            subtitle={`${provider.enabledModels?.[0] || 'No model'} • ${provider.connected ? 'Active' : 'Inactive'}`}
            onPress={() => {
              setSelectedProvider(provider.name)
              setCurrentScreen('provider-config')
            }}
            showChevron
          />
        ))}
        <SettingsListItem
          icon={<Plus className="h-6 w-6 text-gray-400" />}
          title="Add Provider"
          subtitle="Configure a new AI provider"
          onPress={() => {
            setSelectedProvider(null)
            setCurrentScreen('provider-config')
          }}
          showChevron
        />
      </SettingsListGroup>

      <SettingsListGroup title="About">
        <SettingsListItem
          icon={<Shield className="h-6 w-6 text-gray-500" />}
          title="Privacy Policy"
          onPress={() => {
            // Handle privacy policy
          }}
          showChevron
        />
        <SettingsListItem
          icon={<Info className="h-6 w-6 text-blue-500" />}
          title="About"
          subtitle="Version 1.0.0"
          onPress={() => setCurrentScreen('about')}
          showChevron
        />
      </SettingsListGroup>
    </div>
  )

  const renderThemeSettings = () => (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900">
      <SettingsListGroup>
        <SettingsListItem
          title="Light"
          onPress={() => handleThemeChange('light')}
          accessory={theme === 'light' ? <Check className="h-5 w-5 text-blue-500" /> : null}
        />
        <SettingsListItem
          title="Dark"
          onPress={() => handleThemeChange('dark')}
          accessory={theme === 'dark' ? <Check className="h-5 w-5 text-blue-500" /> : null}
        />
        <SettingsListItem
          title="System"
          subtitle="Use system theme"
          onPress={() => handleThemeChange('system')}
          accessory={theme === 'system' ? <Check className="h-5 w-5 text-blue-500" /> : null}
        />
      </SettingsListGroup>
    </div>
  )

  const renderProviderConfig = () => (
    <ProviderConfigView
      providerName={selectedProvider}
      onSave={() => setCurrentScreen('main')}
      onCancel={() => setCurrentScreen('main')}
    />
  )

  const renderAboutScreen = () => (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">OC</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Open Chat
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Version 1.0.0
        </p>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          A modern desktop AI chat application built with Tauri v2, React, and TypeScript.
          Designed for seamless communication with various AI providers.
        </p>
      </div>
    </div>
  )

  const getTitle = () => {
    switch (currentScreen) {
      case 'theme': return 'Theme'
      case 'providers': return 'AI Providers'
      case 'provider-config': return selectedProvider ? `Edit ${selectedProvider}` : 'Add Provider'
      case 'about': return 'About'
      default: return 'Settings'
    }
  }

  const getBackHandler = () => {
    if (currentScreen === 'main') return onClose
    return () => setCurrentScreen('main')
  }

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'theme': return renderThemeSettings()
      case 'provider-config': return renderProviderConfig()
      case 'about': return renderAboutScreen()
      default: return renderMainSettings()
    }
  }

  return (
    <NavigationStack
      title={getTitle()}
      onBack={getBackHandler()}
      showBackButton={currentScreen !== 'main'}
      rightButton={
        currentScreen === 'main' ? (
          <button
            onClick={onClose}
            className="text-base text-blue-500 font-normal"
          >
            Done
          </button>
        ) : null
      }
    >
      {renderCurrentScreen()}
    </NavigationStack>
  )
}

interface SettingsListItemProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  onPress: () => void
  showChevron?: boolean
  accessory?: React.ReactNode
}

const SettingsListItem: React.FC<SettingsListItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = false,
  accessory
}) => (
  <button
    onClick={onPress}
    className="w-full flex items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 last:border-b-0 active:bg-gray-50 dark:active:bg-gray-700"
  >
    {icon && (
      <div className="mr-3 flex-shrink-0">
        {icon}
      </div>
    )}
    <div className="flex-1 text-left">
      <p className="text-base text-gray-900 dark:text-gray-100 font-normal">
        {title}
      </p>
      {subtitle && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
    {accessory && (
      <div className="ml-3 flex-shrink-0">
        {accessory}
      </div>
    )}
    {showChevron && (
      <ChevronRight className="h-5 w-5 text-gray-400 ml-3 flex-shrink-0" />
    )}
  </button>
)
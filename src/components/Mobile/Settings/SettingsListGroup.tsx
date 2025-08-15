import React, { ReactNode } from 'react'

interface SettingsListGroupProps {
  title?: string
  footer?: string
  children: ReactNode
}

export const SettingsListGroup: React.FC<SettingsListGroupProps> = ({
  title,
  footer,
  children
}) => (
  <div className="mb-8">
    {title && (
      <div className="px-4 py-2">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </h2>
      </div>
    )}
    <div className="bg-white dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
      {children}
    </div>
    {footer && (
      <div className="px-4 py-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {footer}
        </p>
      </div>
    )}
  </div>
)
import TelemetryDeck from '@telemetrydeck/sdk';
import { settings } from '../shared/settingsStore';

interface TelemetryConfig {
  appID: string;
  testMode?: boolean;
}

class TelemetryService {
  private td: TelemetryDeck | null = null;
  private initialized = false;

  private async getOrCreatePersistentUserId(): Promise<string> {
    try {
      // Try to get existing user ID from settings
      let userId = await settings.get('telemetryUserId') as string;
      
      if (!userId) {
        // Generate a new persistent user ID
        userId = 'user-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
        
        // Save it to settings for future sessions
        await settings.set('telemetryUserId', userId);
      }
      
      return userId;
    } catch (error) {
      console.warn('Failed to get/create persistent user ID, using session-based ID:', error);
      return 'session-' + Math.random().toString(36).substring(2, 15);
    }
  }

  public async initialize(config: TelemetryConfig): Promise<void> {
    try {
      // Initialize TelemetryDeck with temporary user ID - TelemetryDeck requires clientUser
      this.td = new TelemetryDeck({
        appID: config.appID,
        clientUser: 'initializing', // Temporary - will be updated immediately
        testMode: config.testMode || false,
      });
      
      this.initialized = true;
      console.log('TelemetryDeck initialized successfully');
      
      // Set persistent user ID asynchronously after initialization 
      this.setUserIdAsync();
    } catch (error) {
      console.warn('Failed to initialize TelemetryDeck:', error);
      this.initialized = false;
    }
  }

  private async setUserIdAsync(): Promise<void> {
    try {
      const persistentUserId = await this.getOrCreatePersistentUserId();
      if (this.td) {
        this.td.clientUser = persistentUserId;
        console.log('TelemetryDeck user ID set successfully');
      }
    } catch (error) {
      console.warn('Failed to set TelemetryDeck user ID:', error);
    }
  }

  private isReady(): boolean {
    return this.initialized && this.td !== null;
  }

  public async trackAppLaunched(): Promise<void> {
    if (!this.isReady()) return;
    
    try {
      await this.td!.signal('App.launched');
    } catch (error) {
      console.warn('Failed to track app launched:', error);
    }
  }

  public async trackNewConversation(provider: string, model: string): Promise<void> {
    if (!this.isReady()) return;
    
    try {
      await this.td!.signal('Conversation.created', {
        provider,
        model,
      });
    } catch (error) {
      console.warn('Failed to track new conversation:', error);
    }
  }

  public async trackMessageSent(provider: string, model: string, messageLength: number): Promise<void> {
    if (!this.isReady()) return;
    
    try {
      await this.td!.signal('Message.sent', {
        provider,
        model,
        floatValue: messageLength,
      });
    } catch (error) {
      console.warn('Failed to track message sent:', error);
    }
  }

  public async trackMessageReceived(provider: string, model: string, responseLength: number): Promise<void> {
    if (!this.isReady()) return;
    
    try {
      await this.td!.signal('Message.received', {
        provider,
        model,
        floatValue: responseLength,
      });
    } catch (error) {
      console.warn('Failed to track message received:', error);
    }
  }

  public async trackSettingsOpened(section: string): Promise<void> {
    if (!this.isReady()) return;
    
    try {
      await this.td!.signal('Settings.opened', {
        section,
      });
    } catch (error) {
      console.warn('Failed to track settings opened:', error);
    }
  }

  public async trackProviderConfigured(provider: string, model: string): Promise<void> {
    if (!this.isReady()) return;
    
    try {
      await this.td!.signal('Provider.configured', {
        provider,
        model,
      });
    } catch (error) {
      console.warn('Failed to track provider configured:', error);
    }
  }

  public async trackThemeChanged(theme: string): Promise<void> {
    if (!this.isReady()) return;
    
    try {
      await this.td!.signal('Theme.changed', {
        theme,
      });
    } catch (error) {
      console.warn('Failed to track theme changed:', error);
    }
  }

  public async trackOnboardingCompleted(): Promise<void> {
    if (!this.isReady()) return;
    
    try {
      await this.td!.signal('Onboarding.completed');
    } catch (error) {
      console.warn('Failed to track onboarding completed:', error);
    }
  }

  public async trackFeatureUsed(feature: string, details?: Record<string, string>): Promise<void> {
    if (!this.isReady()) return;
    
    try {
      await this.td!.signal('Feature.used', {
        feature,
        ...details,
      });
    } catch (error) {
      console.warn('Failed to track feature used:', error);
    }
  }

  public async trackError(error: string, context?: string): Promise<void> {
    if (!this.isReady()) return;
    
    try {
      await this.td!.signal('Error.occurred', {
        error,
        context: context || 'unknown',
      });
    } catch (error) {
      console.warn('Failed to track error:', error);
    }
  }

  public updateUser(userId: string): void {
    if (!this.isReady()) return;
    
    try {
      this.td!.clientUser = userId;
    } catch (error) {
      console.warn('Failed to update user:', error);
    }
  }
}

export const telemetryService = new TelemetryService();
export default telemetryService;
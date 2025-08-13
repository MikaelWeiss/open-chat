import { useState, useEffect } from 'react';
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  HardDrive,
  Cpu,
  MemoryStick,
  Clock,
  Eye,
  Brain,
  Code,
  Zap
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { ollamaService, OllamaModel, OllamaLibraryModel } from '../../services/ollamaService';
import { modelCapabilitiesService } from '../../services/modelCapabilitiesService';

interface LocalProviderSettingsProps {
  providerId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface OllamaStatus {
  status: 'not_installed' | 'installed_not_running' | 'running';
  binary_path?: string;
  api_accessible: boolean;
  version?: string;
}

interface LocalModel {
  name: string;
  path: string;
  size_bytes: number;
  source: 'ollama' | 'lm_studio' | 'other';
  format?: string;
}

interface ModelDiscoveryResult {
  models: LocalModel[];
  total_count: number;
  total_size_bytes: number;
  errors: string[];
}

interface SystemResources {
  total_memory_gb: number;
  available_memory_gb: number;
  available_storage_gb: number;
  cpu_cores: number;
}


interface DownloadProgress {
  modelName: string;
  progress: number;
  status: 'downloading' | 'completed' | 'error';
  error?: string;
}

export default function LocalProviderSettings({ isOpen, onClose }: LocalProviderSettingsProps) {
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([]);
  const [discoveredModels, setDiscoveredModels] = useState<LocalModel[]>([]);
  const [libraryModels, setLibraryModels] = useState<OllamaLibraryModel[]>([]);
  const [systemResources, setSystemResources] = useState<SystemResources | null>(null);
  const [systemInfoError, setSystemInfoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'installed' | 'available' | 'system'>('installed');
  const [isLoading, setIsLoading] = useState(false);
  const [downloads, setDownloads] = useState<Record<string, DownloadProgress>>(() => {
    try {
      const stored = localStorage.getItem('ollama-downloads');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [error, setError] = useState<string | null>(null);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);

  // Persist downloads to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('ollama-downloads', JSON.stringify(downloads));
    } catch {
      // Ignore localStorage errors
    }
  }, [downloads]);

  useEffect(() => {
    if (isOpen) {
      checkOllamaStatus();
      getSystemInfo();
      loadData();
      // Clean up completed/errored downloads from previous sessions
      setDownloads(prev => {
        const ongoingOnly = Object.fromEntries(
          Object.entries(prev).filter(([, download]) => download.status === 'downloading')
        );
        return ongoingOnly;
      });
    }
  }, [isOpen]);

  const checkOllamaStatus = async () => {
    try {
      const status = await invoke<OllamaStatus>('detect_ollama');
      setOllamaStatus(status);
      
      if (status.status === 'running') {
        await loadInstalledModels();
      }
    } catch (err) {
      console.error('Failed to check Ollama status:', err);
      setError('Failed to check Ollama status');
    }
  };

  const getSystemInfo = async () => {
    try {
      setSystemInfoError(null);
      const resources = await invoke<SystemResources>('get_system_info');
      setSystemResources(resources);
    } catch (err) {
      console.error('Failed to get system info:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setSystemInfoError(errorMessage);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadDiscoveredModels(),
        loadLibraryModels(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInstalledModels = async () => {
    try {
      const models = await ollamaService.getInstalledModels();
      setInstalledModels(models);
    } catch (err) {
      console.error('Failed to load installed models:', err);
    }
  };

  const loadDiscoveredModels = async () => {
    try {
      const result = await invoke<ModelDiscoveryResult>('discover_models');
      setDiscoveredModels(result.models);
    } catch (err) {
      console.error('Failed to discover models:', err);
    }
  };

  const loadLibraryModels = async () => {
    try {
      const models = await ollamaService.searchLibraryModels();
      setLibraryModels(models);
    } catch (err) {
      console.error('Failed to load library models:', err);
    }
  };

  const downloadModel = async (modelName: string, sizeTag?: string) => {
    const fullModelName = sizeTag ? `${modelName}:${sizeTag}` : modelName;

    // Only set initial downloading state if not already downloading
    setDownloads(prev => {
      const existing = prev[fullModelName];
      if (existing?.status === 'downloading') {
        return prev; // Don't reset progress if already downloading
      }
      return {
        ...prev,
        [fullModelName]: { modelName: fullModelName, progress: 0, status: 'downloading' }
      };
    });

    try {
      await ollamaService.downloadModel(fullModelName, (progress) => {
        const progressPercent = progress.total && progress.completed 
          ? (progress.completed / progress.total) * 100 
          : 0;

        setDownloads(prev => ({
          ...prev,
          [fullModelName]: {
            modelName: fullModelName,
            progress: progressPercent,
            status: progress.status === 'success' ? 'completed' : 'downloading'
          }
        }));
      });

      setDownloads(prev => ({
        ...prev,
        [fullModelName]: { modelName: fullModelName, progress: 100, status: 'completed' }
      }));

      // Refresh installed models
      await loadInstalledModels();
    } catch (err) {
      setDownloads(prev => ({
        ...prev,
        [fullModelName]: {
          modelName: fullModelName,
          progress: 0,
          status: 'error',
          error: err instanceof Error ? err.message : 'Download failed'
        }
      }));
    }
  };

  const confirmDeleteModel = (modelName: string) => {
    setModelToDelete(modelName);
  };

  const deleteModel = async () => {
    if (!modelToDelete) return;
    
    try {
      await ollamaService.deleteModel(modelToDelete);
      await loadInstalledModels();
      setModelToDelete(null);
    } catch (err) {
      console.error('Failed to delete model:', err);
      setError(`Failed to delete model: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setModelToDelete(null);
    }
  };

  const cancelDelete = () => {
    setModelToDelete(null);
  };


  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const ModelCapabilityBadges = ({ modelName }: { modelName: string }) => {
    const capabilities = modelCapabilitiesService.detectCapabilities(modelName);
    const badges = [];

    if (capabilities.vision) badges.push({ icon: Eye, label: 'Vision', color: 'bg-blue-100 text-blue-800' });
    if (capabilities.functionCalling) badges.push({ icon: Brain, label: 'Functions', color: 'bg-purple-100 text-purple-800' });
    if (capabilities.codeGeneration) badges.push({ icon: Code, label: 'Code', color: 'bg-green-100 text-green-800' });
    if (capabilities.reasoning) badges.push({ icon: Zap, label: 'Reasoning', color: 'bg-yellow-100 text-yellow-800' });

    return (
      <div className="flex flex-wrap gap-1">
        {badges.map(({ icon: Icon, label, color }) => (
          <span key={label} className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${color}`}>
            <Icon className="w-3 h-3 mr-1" />
            {label}
          </span>
        ))}
      </div>
    );
  };

  const ModelCard = ({ 
    model, 
    installedModels, 
    downloads, 
    onDownload, 
    ollamaStatus 
  }: {
    model: OllamaLibraryModel;
    installedModels: OllamaModel[];
    downloads: Record<string, DownloadProgress>;
    onDownload: (modelName: string, sizeTag?: string) => void;
    ollamaStatus: OllamaStatus | null;
  }) => {
    const hasMultipleSizes = model.availableSizes && model.availableSizes.length > 0;
    
    if (!hasMultipleSizes) {
      // Single variant model - show original UI
      const download = downloads[model.name];
      const isInstalled = installedModels.some(installed => installed.name.startsWith(model.name));
      
      return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-lg">{model.name}</h4>
              {model.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{model.description}</p>
              )}
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span>Tags: {model.tags.join(', ')}</span>
                  {model.pulls && <span>Downloads: {model.pulls.toLocaleString()}</span>}
                </div>
              </div>
              <div className="mt-3">
                <ModelCapabilityBadges modelName={model.name} />
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {isInstalled ? (
                <span className="text-green-600 font-medium">Installed</span>
              ) : download ? (
                <div className="text-center">
                  {download.status === 'downloading' && (
                    <div className="w-32">
                      <div className="bg-gray-200 rounded-full h-2 mb-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${download.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600">{Math.round(download.progress)}%</div>
                    </div>
                  )}
                  {download.status === 'completed' && (
                    <span className="text-green-600 font-medium">Complete</span>
                  )}
                  {download.status === 'error' && (
                    <span className="text-red-600 font-medium">Error</span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => onDownload(model.name)}
                  disabled={ollamaStatus?.status !== 'running'}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Multi-size model - show expandable UI with size options
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="font-medium text-lg">{model.name}</h4>
            {model.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{model.description}</p>
            )}
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-4">
                {model.otherTags && model.otherTags.length > 0 && (
                  <span>Features: {model.otherTags.join(', ')}</span>
                )}
                {model.pulls && <span>Downloads: {model.pulls.toLocaleString()}</span>}
              </div>
            </div>
            <div className="mt-3">
              <ModelCapabilityBadges modelName={model.name} />
            </div>
          </div>
        </div>
        
        {/* Size Selection Grid */}
        <div className="space-y-3">
          <h5 className="font-medium text-sm text-gray-700 dark:text-gray-300">Available Sizes:</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {model.availableSizes!.map((size) => {
              const fullModelName = `${model.name}:${size.tag}`;
              const download = downloads[fullModelName];
              const isInstalled = installedModels.some(installed => 
                installed.name === fullModelName || 
                (installed.name.startsWith(model.name) && installed.name.includes(size.tag))
              );
              
              return (
                <div key={size.tag} className="border border-gray-100 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm">{size.displayName}</div>
                      {size.parameterCount && (
                        <div className="text-xs text-gray-500">{size.parameterCount}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isInstalled ? (
                        <span className="text-xs text-green-600 font-medium">✓ Installed</span>
                      ) : download ? (
                        <div className="text-center min-w-[60px]">
                          {download.status === 'downloading' && (
                            <div className="w-full">
                              <div className="bg-gray-200 rounded-full h-1 mb-1">
                                <div 
                                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                                  style={{ width: `${download.progress}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-600">{Math.round(download.progress)}%</div>
                            </div>
                          )}
                          {download.status === 'completed' && (
                            <span className="text-xs text-green-600 font-medium">Complete</span>
                          )}
                          {download.status === 'error' && (
                            <span className="text-xs text-red-600 font-medium">Error</span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => onDownload(model.name, size.tag)}
                          disabled={ollamaStatus?.status !== 'running'}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Local Provider Management</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          {ollamaStatus ? (
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              ollamaStatus.status === 'running' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : ollamaStatus.status === 'installed_not_running'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              {ollamaStatus.status === 'running' ? (
                <CheckCircle className="w-5 h-5" />
              ) : ollamaStatus.status === 'installed_not_running' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <div>
                <div className="font-medium">
                  {ollamaStatus.status === 'running' && 'Ollama is running'}
                  {ollamaStatus.status === 'installed_not_running' && 'Ollama is installed but not running'}
                  {ollamaStatus.status === 'not_installed' && 'Ollama is not installed'}
                </div>
                {ollamaStatus.version && (
                  <div className="text-sm opacity-75">Version: {ollamaStatus.version}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Checking Ollama status...</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {['installed', 'available', 'system'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`px-6 py-3 font-medium capitalize ${
                selectedTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedTab === 'installed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Installed Models</h3>
                <button
                  onClick={loadInstalledModels}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {installedModels.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No models installed. Switch to the "Available" tab to download models.
                </div>
              ) : (
                <div className="grid gap-4">
                  {installedModels.map((model) => (
                    <div key={model.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{model.name}</h4>
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <HardDrive className="w-4 h-4" />
                                {formatSize(model.size)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(model.modified_at)}
                              </span>
                            </div>
                            {model.details && (
                              <div className="text-xs">
                                Format: {model.details.format} | Family: {model.details.family} | 
                                Parameters: {model.details.parameter_size}
                              </div>
                            )}
                          </div>
                          <div className="mt-3">
                            <ModelCapabilityBadges modelName={model.name} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => confirmDeleteModel(model.name)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Delete model"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'available' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Available Models</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    />
                  </div>
                  <button
                    onClick={loadLibraryModels}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <div>Loading available models...</div>
                </div>
              ) : (
                <div className="space-y-6">
                  {libraryModels
                    .filter(model => !searchQuery || model.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((model) => {
                      return (
                        <ModelCard 
                          key={model.name} 
                          model={model} 
                          installedModels={installedModels}
                          downloads={downloads}
                          onDownload={downloadModel}
                          ollamaStatus={ollamaStatus}
                        />
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'system' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">System Information</h3>
                <button
                  onClick={getSystemInfo}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
              
              {systemInfoError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h4 className="font-medium text-red-800 dark:text-red-200">Failed to Load System Information</h4>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300">{systemInfoError}</p>
                  <button
                    onClick={getSystemInfo}
                    className="mt-3 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              ) : systemResources ? (
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MemoryStick className="w-5 h-5 text-blue-500" />
                        <h4 className="font-medium">Memory</h4>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Total: {systemResources.total_memory_gb.toFixed(1)} GB</div>
                        <div>Available: {systemResources.available_memory_gb.toFixed(1)} GB</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="w-5 h-5 text-green-500" />
                        <h4 className="font-medium">Storage</h4>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Available: {systemResources.available_storage_gb.toFixed(1)} GB</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-5 h-5 text-purple-500" />
                        <h4 className="font-medium">CPU</h4>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>Cores: {systemResources.cpu_cores}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Discovered Local Models</h4>
                    {discoveredModels.length === 0 ? (
                      <div className="text-gray-500">No local models found in standard directories.</div>
                    ) : (
                      <div className="grid gap-3">
                        {discoveredModels.map((model, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{model.name}</h5>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatSize(model.size_bytes)} • {model.source} • {model.format || 'Unknown format'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">{model.path}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <div>Loading system information...</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {modelToDelete && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-semibold">Delete Model</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete <span className="font-medium">{modelToDelete}</span>? 
                This action cannot be undone and will free up disk space.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteModel}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="absolute bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
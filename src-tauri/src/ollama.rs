use serde::{Deserialize, Serialize};
use std::process::Command;
use std::time::Duration;
use std::path::Path;
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OllamaStatus {
    NotInstalled,
    InstalledNotRunning,
    Running,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaDetectionResult {
    pub status: OllamaStatus,
    pub binary_path: Option<String>,
    pub api_accessible: bool,
    pub version: Option<String>,
}

pub async fn detect_ollama_installation() -> Result<OllamaDetectionResult, String> {
    // Check if Ollama binary exists
    let binary_path = find_ollama_binary();
    let binary_exists = binary_path.is_some();
    
    if !binary_exists {
        return Ok(OllamaDetectionResult {
            status: OllamaStatus::NotInstalled,
            binary_path: None,
            api_accessible: false,
            version: None,
        });
    }

    // Test if Ollama API is accessible
    let api_accessible = test_ollama_api().await;
    
    // Get version if binary exists
    let version = if let Some(ref path) = binary_path {
        get_ollama_version(path)
    } else {
        None
    };

    let status = if api_accessible {
        OllamaStatus::Running
    } else {
        OllamaStatus::InstalledNotRunning
    };

    Ok(OllamaDetectionResult {
        status,
        binary_path,
        api_accessible,
        version,
    })
}

fn find_ollama_binary() -> Option<String> {
    // Try using the 'which' command first for cross-platform compatibility
    if let Ok(path) = which::which("ollama") {
        return Some(path.to_string_lossy().to_string());
    }

    // Platform-specific fallback paths
    let potential_paths = if cfg!(target_os = "windows") {
        vec![
            "C:\\Program Files\\Ollama\\ollama.exe",
            "C:\\Program Files (x86)\\Ollama\\ollama.exe",
        ]
    } else if cfg!(target_os = "macos") {
        vec![
            "/usr/local/bin/ollama",
            "/opt/homebrew/bin/ollama",
            "/Applications/Ollama.app/Contents/Resources/ollama",
        ]
    } else {
        // Linux and other Unix-like systems
        vec![
            "/usr/local/bin/ollama",
            "/usr/bin/ollama",
            "/opt/ollama/bin/ollama",
        ]
    };

    for path in potential_paths {
        if std::path::Path::new(path).exists() {
            return Some(path.to_string());
        }
    }

    None
}

async fn test_ollama_api() -> bool {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .unwrap_or_default();

    // Test the Ollama API endpoint
    match client.get("http://localhost:11434/api/tags").send().await {
        Ok(response) => response.status().is_success(),
        Err(_) => false,
    }
}

fn get_ollama_version(binary_path: &str) -> Option<String> {
    match Command::new(binary_path)
        .arg("--version")
        .output()
    {
        Ok(output) => {
            if output.status.success() {
                let version_output = String::from_utf8_lossy(&output.stdout);
                // Parse version from output like "ollama version is 0.1.32"
                version_output
                    .split_whitespace()
                    .last()
                    .map(|s| s.trim().to_string())
            } else {
                None
            }
        }
        Err(_) => None,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalModel {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub source: ModelSource,
    pub format: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ModelSource {
    Ollama,
    LmStudio,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelDiscoveryResult {
    pub models: Vec<LocalModel>,
    pub total_count: usize,
    pub total_size_bytes: u64,
    pub errors: Vec<String>,
}

pub async fn discover_local_models() -> Result<ModelDiscoveryResult, String> {
    let mut models = Vec::new();
    let mut errors = Vec::new();
    let mut total_size_bytes = 0u64;

    // Discover Ollama models
    match discover_ollama_models().await {
        Ok(mut ollama_models) => {
            for model in &ollama_models {
                total_size_bytes += model.size_bytes;
            }
            models.append(&mut ollama_models);
        }
        Err(e) => errors.push(format!("Ollama model discovery error: {}", e)),
    }

    // Discover LMStudio models
    match discover_lmstudio_models().await {
        Ok(mut lmstudio_models) => {
            for model in &lmstudio_models {
                total_size_bytes += model.size_bytes;
            }
            models.append(&mut lmstudio_models);
        }
        Err(e) => errors.push(format!("LMStudio model discovery error: {}", e)),
    }

    Ok(ModelDiscoveryResult {
        total_count: models.len(),
        models,
        total_size_bytes,
        errors,
    })
}

async fn discover_ollama_models() -> Result<Vec<LocalModel>, String> {
    let mut models = Vec::new();

    // Get Ollama models directory
    let ollama_dir = get_ollama_models_directory()?;
    
    if !Path::new(&ollama_dir).exists() {
        return Ok(models); // Return empty vec if directory doesn't exist
    }

    // Scan the models directory
    match scan_directory_for_models(&ollama_dir, ModelSource::Ollama) {
        Ok(mut discovered) => models.append(&mut discovered),
        Err(e) => return Err(format!("Failed to scan Ollama directory: {}", e)),
    }

    Ok(models)
}

async fn discover_lmstudio_models() -> Result<Vec<LocalModel>, String> {
    let mut models = Vec::new();

    // Get potential LMStudio directories
    let lmstudio_dirs = get_lmstudio_directories();
    
    for dir in lmstudio_dirs {
        if Path::new(&dir).exists() {
            match scan_directory_for_models(&dir, ModelSource::LmStudio) {
                Ok(mut discovered) => models.append(&mut discovered),
                Err(e) => eprintln!("Warning: Failed to scan LMStudio directory {}: {}", dir, e),
            }
        }
    }

    Ok(models)
}

fn get_ollama_models_directory() -> Result<String, String> {
    // Ollama models are typically stored in ~/.ollama/models
    let home_dir = if cfg!(target_os = "windows") {
        std::env::var("USERPROFILE").or_else(|_| std::env::var("HOMEPATH"))
    } else {
        std::env::var("HOME")
    }.map_err(|_| "Could not determine home directory")?;

    let models_dir = if cfg!(target_os = "windows") {
        format!("{}\\AppData\\Local\\ollama\\models", home_dir)
    } else {
        format!("{}/.ollama/models", home_dir)
    };

    Ok(models_dir)
}

fn get_lmstudio_directories() -> Vec<String> {
    let mut dirs = Vec::new();
    
    if let Ok(home_dir) = if cfg!(target_os = "windows") {
        std::env::var("USERPROFILE").or_else(|_| std::env::var("HOMEPATH"))
    } else {
        std::env::var("HOME")
    } {
        if cfg!(target_os = "windows") {
            dirs.push(format!("{}\\AppData\\Roaming\\LM Studio\\models", home_dir));
            dirs.push(format!("{}\\Documents\\LM Studio\\models", home_dir));
        } else if cfg!(target_os = "macos") {
            dirs.push(format!("{}/Library/Application Support/LM Studio/models", home_dir));
            dirs.push(format!("{}/.lmstudio/models", home_dir));
        } else {
            // Linux
            dirs.push(format!("{}/.config/lmstudio/models", home_dir));
            dirs.push(format!("{}/.lmstudio/models", home_dir));
        }
    }

    dirs
}

fn scan_directory_for_models(dir_path: &str, source: ModelSource) -> Result<Vec<LocalModel>, String> {
    let mut models = Vec::new();
    
    let entries = fs::read_dir(dir_path)
        .map_err(|e| format!("Failed to read directory {}: {}", dir_path, e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();
        
        if path.is_file() {
            if let Some(model) = try_parse_model_file(&path, &source) {
                models.push(model);
            }
        } else if path.is_dir() {
            // Recursively scan subdirectories (common in Ollama structure)
            if let Ok(mut subdir_models) = scan_directory_for_models(
                &path.to_string_lossy(),
                source.clone()
            ) {
                models.append(&mut subdir_models);
            }
        }
    }

    Ok(models)
}

fn try_parse_model_file(path: &Path, source: &ModelSource) -> Option<LocalModel> {
    let path_str = path.to_string_lossy().to_string();
    let file_name = path.file_name()?.to_string_lossy().to_string();
    
    // Check if this looks like a model file
    let is_model_file = file_name.ends_with(".gguf") 
        || file_name.ends_with(".bin")
        || file_name.ends_with(".safetensors")
        || (source == &ModelSource::Ollama && file_name == "model");

    if !is_model_file {
        return None;
    }

    // Get file size
    let size_bytes = match fs::metadata(path) {
        Ok(metadata) => metadata.len(),
        Err(_) => 0,
    };

    // Extract model name (try to clean up the path/filename)
    let model_name = extract_model_name(&path_str, source);
    
    // Determine format
    let format = determine_model_format(&file_name);

    Some(LocalModel {
        name: model_name,
        path: path_str,
        size_bytes,
        source: source.clone(),
        format,
    })
}

fn extract_model_name(path: &str, source: &ModelSource) -> String {
    match source {
        ModelSource::Ollama => {
            // For Ollama, try to extract from the directory structure
            // Typical path: ~/.ollama/models/blobs/sha256-[hash] or ~/.ollama/models/manifests/[model]/[tag]
            if path.contains("/manifests/") || path.contains("\\manifests\\") {
                let parts: Vec<&str> = if path.contains("/manifests/") {
                    path.split("/manifests/").collect()
                } else {
                    path.split("\\manifests\\").collect()
                };
                if parts.len() > 1 {
                    let model_path = parts[1];
                    let model_parts: Vec<&str> = if model_path.contains('/') {
                        model_path.split('/').collect()
                    } else {
                        model_path.split('\\').collect()
                    };
                    if model_parts.len() >= 2 {
                        return format!("{}:{}", model_parts[0], model_parts[1]);
                    } else if !model_parts.is_empty() {
                        return model_parts[0].to_string();
                    }
                }
            }
            // Fallback to filename
            Path::new(path)
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string()
        }
        _ => {
            // For LMStudio and others, use the filename
            Path::new(path)
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string()
        }
    }
}

fn determine_model_format(filename: &str) -> Option<String> {
    if filename.ends_with(".gguf") {
        Some("GGUF".to_string())
    } else if filename.ends_with(".bin") {
        Some("BIN".to_string())
    } else if filename.ends_with(".safetensors") {
        Some("SafeTensors".to_string())
    } else {
        None
    }
}

#[tauri::command]
pub async fn detect_ollama() -> Result<OllamaDetectionResult, String> {
    detect_ollama_installation().await
}

#[tauri::command]
pub async fn discover_models() -> Result<ModelDiscoveryResult, String> {
    discover_local_models().await
}
mod ollama;
mod system_info;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

use tauri::{Manager, WebviewUrl, WebviewWindowBuilder, Position, LogicalPosition, AppHandle};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
use std::str::FromStr;
use std::sync::Mutex;

// Track registered shortcuts for proper cleanup
static REGISTERED_SHORTCUTS: Mutex<Vec<String>> = Mutex::new(Vec::new());

#[tauri::command]
async fn toggle_mini_window(app: tauri::AppHandle) -> Result<bool, String> {
    if let Some(window) = app.get_webview_window("mini-chat") {
        let is_visible = window.is_visible()
            .map_err(|e| format!("Failed to check window visibility: {}", e))?;
        let is_focused = window.is_focused()
            .map_err(|e| format!("Failed to check window focus: {}", e))?;
        
        if is_visible && is_focused {
            // Window is visible and focused, hide it
            window.hide()
                .map_err(|e| format!("Failed to hide mini window: {}", e))?;
            Ok(false)
        } else {
            // Window is either hidden or not focused, show and focus it
            window.show()
                .map_err(|e| format!("Failed to show mini window: {}", e))?;
            window.set_focus()
                .map_err(|e| format!("Failed to focus mini window: {}", e))?;
            Ok(true)
        }
    } else {
        // Create new mini window with query parameter
        let mini_window = WebviewWindowBuilder::new(
            &app,
            "mini-chat",
            WebviewUrl::App("index.html?window=mini".into())
        )
        .title("Mini Chat")
        .hidden_title(true)
        .inner_size(400.0, 600.0)
        .min_inner_size(400.0, 400.0)
        .max_inner_size(600.0, 1200.0)
        .resizable(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .decorations(true)
        .build()
        .map_err(|e| format!("Failed to create mini window: {}", e))?;

        // Set window to appear on all workspaces (macOS)
        if let Err(e) = mini_window.set_visible_on_all_workspaces(true) {
            eprintln!("Warning: Failed to set mini window on all workspaces: {}", e);
        }

        // Position window in bottom right corner with error handling
        if let Ok(monitor) = mini_window.primary_monitor() {
            if let Some(monitor) = monitor {
                let screen_size = monitor.size();
                let window_size = mini_window.inner_size().unwrap_or(tauri::PhysicalSize { width: 400, height: 600 });
                
                // Position with some padding from the edges (80px)
                let x = screen_size.width as f64 - window_size.width as f64 - 80.0;
                let y = screen_size.height as f64 - window_size.height as f64 - 80.0; // Extra padding for taskbar/dock
                
                if let Err(e) = mini_window.set_position(Position::Physical(tauri::PhysicalPosition { x: x as i32, y: y as i32 })) {
                    eprintln!("Warning: Failed to set mini window position: {}", e);
                }
            } else {
                // Fallback position if monitor detection fails
                if let Err(e) = mini_window.set_position(Position::Logical(LogicalPosition { x: 100.0, y: 100.0 })) {
                    eprintln!("Warning: Failed to set fallback mini window position: {}", e);
                }
            }
        } else {
            // Fallback position if monitor access fails
            if let Err(e) = mini_window.set_position(Position::Logical(LogicalPosition { x: 100.0, y: 100.0 })) {
                eprintln!("Warning: Failed to set fallback mini window position: {}", e);
            }
        }
        
        Ok(true)
    }
}

#[tauri::command]
async fn close_mini_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("mini-chat") {
        window.close()
            .map_err(|e| format!("Failed to close mini window: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
async fn register_global_shortcut(app: AppHandle, shortcut: String) -> Result<(), String> {
    // Handle empty shortcuts gracefully
    if shortcut.trim().is_empty() {
        // Unregister all shortcuts if empty string provided
        unregister_all_shortcuts(&app)?;
        return Ok(());
    }

    // Validate shortcut format before attempting registration
    let parsed_shortcut = Shortcut::from_str(&shortcut)
        .map_err(|e| format!("Invalid shortcut format '{}': {}", shortcut, e))?;

    // Unregister existing shortcuts first with proper error handling
    unregister_all_shortcuts(&app)?;

    // Register the new shortcut
    app.global_shortcut()
        .register(parsed_shortcut.clone())
        .map_err(|e| {
            // Provide helpful error messages for common issues
            if e.to_string().contains("already registered") {
                format!("Shortcut '{}' is already in use by another application", shortcut)
            } else if e.to_string().contains("permission") {
                format!("Permission denied to register global shortcut '{}'. Please check system accessibility settings.", shortcut)
            } else {
                format!("Failed to register global shortcut '{}': {}", shortcut, e)
            }
        })?;
    
    // Track the registered shortcut for cleanup
    if let Ok(mut shortcuts) = REGISTERED_SHORTCUTS.lock() {
        shortcuts.clear();
        shortcuts.push(shortcut);
    }
    
    Ok(())
}

#[tauri::command]
async fn unregister_global_shortcut(app: AppHandle, shortcut: String) -> Result<(), String> {
    if shortcut.trim().is_empty() {
        return Ok(());
    }

    // Parse the shortcut
    let parsed_shortcut = Shortcut::from_str(&shortcut)
        .map_err(|e| format!("Invalid shortcut format '{}': {}", shortcut, e))?;

    // Unregister the specific shortcut
    app.global_shortcut()
        .unregister(parsed_shortcut)
        .map_err(|e| format!("Failed to unregister shortcut '{}': {}", shortcut, e))?;

    // Remove from tracked shortcuts
    if let Ok(mut shortcuts) = REGISTERED_SHORTCUTS.lock() {
        shortcuts.retain(|s| s != &shortcut);
    }

    Ok(())
}

// Helper function to unregister all shortcuts with proper error handling
fn unregister_all_shortcuts(app: &AppHandle) -> Result<(), String> {
    if let Err(e) = app.global_shortcut().unregister_all() {
        eprintln!("Warning: Failed to unregister all shortcuts: {}", e);
        // Don't fail the operation, just log the warning
    }
    
    // Clear tracked shortcuts
    if let Ok(mut shortcuts) = REGISTERED_SHORTCUTS.lock() {
        shortcuts.clear();
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_keyring::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    // Only handle key press events, ignore key release
                    use tauri_plugin_global_shortcut::ShortcutState;
                    if event.state == ShortcutState::Pressed {
                        // Handle global shortcut events by triggering the mini window toggle
                        let app_handle = app.clone();
                        tauri::async_runtime::spawn(async move {
                            if let Err(e) = toggle_mini_window(app_handle).await {
                                eprintln!("Failed to toggle mini window from global shortcut: {}", e);
                            }
                        });
                    }
                })
                .build()
        )
        .invoke_handler(tauri::generate_handler![
            greet,
            toggle_mini_window,
            close_mini_window,
            register_global_shortcut,
            unregister_global_shortcut,
            ollama::detect_ollama,
            ollama::start_ollama,
            ollama::discover_models,
            system_info::get_system_info,
            system_info::validate_model_system_compatibility
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

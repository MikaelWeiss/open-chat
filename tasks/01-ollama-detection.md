# Task 01: Ollama Installation Detection

## Title
Detect if Ollama is installed and running on the user's system

## What needs to be done
Create a Rust service that can detect whether Ollama is installed and running on the user's system. This should check for the Ollama binary and test if the API is accessible on the default port (11434).

## Requirements
- Add Rust function to check if Ollama binary exists in standard locations
- Test if Ollama API is responsive on localhost:11434
- Return status indicating: not_installed, installed_not_running, or running
- Add Tauri command to expose this functionality to frontend
- Handle different operating systems (Windows, macOS, Linux)

## Acceptance Criteria
- Function correctly identifies when Ollama is not installed
- Function correctly identifies when Ollama is installed but not running
- Function correctly identifies when Ollama is running and accessible
- Frontend can call the detection function and receive status
- Works across all supported platforms

## Additional Details
- Standard Ollama binary locations vary by OS
- Default API endpoint is http://localhost:11434
- Use simple HTTP request to test API availability
- Don't make assumptions about Ollama version or configuration
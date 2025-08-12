# Task 02: Local Model Discovery

## Title
Discover existing models in Ollama and LMStudio directories

## What needs to be done
Create a service that scans standard model directories to find already downloaded local models. This should discover models from both Ollama and LMStudio installations.

## Requirements
- Scan standard Ollama model directory (~/.ollama/models)
- Scan standard LMStudio model directories
- Parse model information (name, size, format) from discovered files
- Return list of available local models with metadata
- Add Tauri command to expose discovery functionality
- Handle missing or inaccessible directories gracefully

## Acceptance Criteria
- Successfully finds models in Ollama directory when present
- Successfully finds models in LMStudio directories when present
- Returns empty list when no models are found
- Extracts model names and file sizes correctly
- Frontend can retrieve list of discovered models
- Handles permission errors and missing directories without crashing

## Additional Details
- Ollama models are typically stored in ~/.ollama/models
- LMStudio may use different directory structures
- Model files can be large (multi-GB)
- Some directories may not exist or be inaccessible
- Focus on common model formats (GGUF, etc.)
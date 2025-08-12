# Task 04: Ollama API Integration

## Title
Create service to interact with Ollama API for model management

## What needs to be done
Build a TypeScript service that can communicate with Ollama's REST API to list available models, download models, start/stop models, and get model status.

## Requirements
- Create TypeScript service class for Ollama API communication
- Implement function to list models available in Ollama library
- Add function to download models via Ollama API
- Add function to start/stop specific models
- Include function to check if a model is currently running
- Handle API errors gracefully with proper error messages
- Add progress tracking for model downloads

## Acceptance Criteria
- Can retrieve list of models from Ollama library API
- Can successfully trigger model downloads through Ollama
- Can start and stop individual models
- Can determine current running model status
- Handles network errors and API unavailability
- Provides download progress information when available
- Returns meaningful error messages for common failure cases

## Additional Details
- Use Ollama's REST API endpoints (/api/tags, /api/pull, etc.)
- Download progress may be available through streaming endpoints
- Only one model should run at a time
- API calls should have reasonable timeouts
- Consider rate limiting for API calls
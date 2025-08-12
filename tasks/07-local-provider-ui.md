# Task 07: Local Provider UI Implementation

## Title
Create specialized UI for Local provider configuration and management

## What needs to be done
Build the user interface components for the Local provider, including Ollama installation checking, model browsing, downloading, and management. This should integrate with the existing settings modal structure.

## Requirements
- Add Local provider configuration screen to settings
- Implement Ollama installation status checking and prompts
- Create model browser interface with search functionality
- Add model download interface with progress tracking
- Show model size, system requirements, and download estimates
- Include storage space validation before downloads
- Add retry mechanisms for failed operations
- Display currently installed models with management options

## Acceptance Criteria
- Settings modal shows Local provider section when Local provider is added
- Displays clear status when Ollama is not installed with installation prompts
- Shows available models from Ollama library with search
- Displays model metadata (size, requirements, compatibility)
- Provides download progress feedback during model installation
- Shows installed models with ability to manage them
- Handles errors gracefully with retry options

## Additional Details
- Integrate with existing SettingsModal structure
- Use consistent styling with current provider management UI
- Show estimated download times based on model size
- Include warnings for large models on limited systems
- Provide links or instructions for manual Ollama installation
- Consider using existing UI components where possible
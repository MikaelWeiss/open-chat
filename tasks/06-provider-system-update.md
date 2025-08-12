# Task 06: Update Provider System

## Title
Remove Ollama/vLLM providers and add Local provider

## What needs to be done
Update the provider system to remove the separate Ollama and vLLM provider presets and replace them with a single "Local" provider option that uses the new local model services.

## Requirements
- Remove "Ollama" and "vLLM" entries from provider presets arrays
- Add new "Local" provider preset with appropriate configuration
- Update provider types to support local model management
- Modify provider creation flow to handle Local provider setup
- Update provider validation to work with local models
- Ensure Local provider integrates with existing provider infrastructure

## Acceptance Criteria
- Ollama and vLLM no longer appear in provider selection lists
- "Local" provider appears in provider options
- Local provider can be added and configured through existing UI
- Local provider shows appropriate status (connected/disconnected)
- Local provider integrates with model selection in chat interface
- Existing cloud providers continue to work unchanged

## Additional Details
- Local provider should be marked with isLocal: true
- No API key should be required for Local provider
- Provider endpoint should point to localhost:11434 (Ollama default)
- Local provider should show different UI hints (no API key needed)
- Consider adding special icon or badge for local provider
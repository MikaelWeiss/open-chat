# Task 05: Model Capabilities Detection

## Title
Create system to detect and categorize model capabilities

## What needs to be done
Build a service that can determine what capabilities each model has (vision, function calling, tools, etc.) based on model names and families. Use research findings about Ollama model capabilities.

## Requirements
- Create mapping of model families to their capabilities
- Detect vision capabilities (LLaVA, Llama 3.2 Vision, Qwen2-VL models)
- Detect function calling support (Llama 3.1+, Dolphin 3.0, Granite 3.2)
- Detect tool support based on model specifications
- Return structured capability data for each model
- Handle unknown models with reasonable defaults
- Allow manual capability overrides if needed

## Acceptance Criteria
- Correctly identifies vision models (LLaVA series, multimodal models)
- Correctly identifies function calling capable models
- Correctly identifies tool-supporting models
- Returns comprehensive capability object for each model
- Handles unknown or new models gracefully
- Capability detection works offline (no API calls required)

## Additional Details
- Use model name patterns to determine capabilities
- Base detection on research about Ollama model families
- Vision models: LLaVA, Llama 3.2 Vision, Qwen2-VL, multimodal models
- Function calling: Llama 3.1+, Dolphin 3.0, Granite 3.2, tool-specific models
- Keep capability database simple and maintainable
- Allow for future expansion of capability types
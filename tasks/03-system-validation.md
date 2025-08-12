# Task 03: Basic System Resource Validation

## Title
Add basic system resource checking to prevent obvious mismatches

## What needs to be done
Extend the existing system_info.rs to include basic validation functions that can determine if a model is likely to run on the current system. Focus on preventing obvious failures like running 20GB models on 8GB RAM systems.

## Requirements
- Extend existing system_info.rs with validation functions
- Add function to check if system has sufficient RAM for a given model size
- Add function to check available storage space
- Include basic model size estimation (rough multipliers for different parameter counts)
- Add Tauri commands for resource validation
- Return simple boolean or confidence level for model compatibility

## Acceptance Criteria
- Can determine if system has enough RAM for common model sizes (7B, 13B, 70B)
- Can check available disk space before model download
- Provides reasonable estimates for model RAM requirements
- Frontend can validate system compatibility before offering model downloads
- Gracefully handles systems where resource info is unavailable

## Additional Details
- Use conservative estimates (e.g., 7B model needs ~8GB RAM)
- Factor in OS and other applications using memory
- Storage check should include space for model + overhead
- Keep validation simple - just prevent obvious failures
- Don't over-engineer - basic heuristics are sufficient
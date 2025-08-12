# Task 08: Chat Interface Integration

## Title
Integrate local models with chat interface for seamless model switching

## What needs to be done
Update the chat interface to handle local models, including automatic model startup, model switching, and status indicators. Ensure only one local model runs at a time and provide appropriate feedback for model states.

## Requirements
- Update chat service to handle local model lifecycle
- Auto-start selected local models when used in chat
- Stop running local model when switching to different model
- Add model status indicators (loading, ready, error) in chat interface
- Include retry button for failed model starts
- Update model selection dropdown to show local models
- Handle model switching between local and cloud providers
- Show appropriate loading states during model operations

## Acceptance Criteria
- Local models appear in chat model selection dropdown
- Selecting a local model automatically starts it if not running
- Switching between models properly stops/starts as needed
- Model status is clearly indicated to user (loading/ready/error)
- Failed model starts show retry option in model selector
- Cloud providers continue to work normally alongside local models
- Only one local model runs at any given time

## Additional Details
- Model startup may take time - show appropriate loading indicators
- Consider memory implications of model switching
- Error states should be recoverable with clear user action
- Status indicators should be subtle but informative
- Model switching should feel seamless when possible
- Preserve existing chat service architecture where possible
# Local LLM Integration Project

## Overview
This project replaces the separate "Ollama" and "vLLM" providers with a unified "Local" provider that integrates with the user's existing Ollama installation. The goal is to create a seamless experience for running local models through Ollama.

## Claude's Role
You should work on ONE task file at a time, in the order they are numbered. Each task file contains:
- **Title**: What the task accomplishes
- **Requirements**: What needs to be implemented
- **Acceptance Criteria**: How to verify the task is complete
- **Additional Details**: Context and constraints

## Working Process
1. Read the next numbered task file (e.g., `01-ollama-detection.md`)
2. Implement the requirements exactly as specified
3. Verify against the acceptance criteria
4. Only move to the next task when the current one is fully complete
5. If you need clarification, ask before proceeding

## Key Principles
- Keep everything simple - use Ollama for all model management
- Only one model can run at a time
- Auto-start models when selected in chat
- Graceful error handling with retry options
- Basic system resource validation

## Task Files Location
All task files are in the `tasks/` directory, numbered sequentially for implementation order.
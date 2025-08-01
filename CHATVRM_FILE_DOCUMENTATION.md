# ChatVRM Project Documentation

This document provides a comprehensive overview of the ChatVRM project, explaining the functionality of each file to help you understand, modify, and extend the application.

## Project Overview

ChatVRM is a Next.js application that allows users to interact with 3D VRM characters through text or voice chat. The application integrates with OpenRouter for AI responses and ElevenLabs for text-to-speech functionality. It also supports livestream integration through Restream for reading chat messages and generating responses.

## Project Structure

```
src/
├── components/          # UI components
├── features/            # Core functionality modules
├── lib/                 # Library/utility code for VRM handling
├── pages/               # Next.js pages and API routes
├── services/            # Service layer for external integrations
├── styles/              # CSS styles
└── utils/               # Utility functions
```

## Core Components

### Main Application Entry Points

#### `src/pages/index.tsx`
This is the main application page that orchestrates all functionality:
- Manages application state (API keys, chat logs, system prompts)
- Handles chat message processing and streaming
- Integrates VRM viewer, message input, and menu components
- Implements WebSocket service for livestream integration
- Manages audio playback and character speaking functionality
- Handles background image customization

#### `src/pages/_app.tsx`
The Next.js application wrapper that initializes global styles.

### UI Components

#### `src/components/vrmViewer.tsx`
Renders the 3D VRM character viewer:
- Sets up the Three.js canvas for VRM rendering
- Handles VRM model loading (with drag-and-drop support)
- Initializes the VRM viewer context

#### `src/components/messageInputContainer.tsx`
Manages user input methods:
- Handles text input and submission
- Integrates speech recognition for voice input
- Manages microphone recording state

#### `src/components/messageInput.tsx`
The visual component for user message input:
- Renders text input field with send button
- Includes microphone button for voice input
- Displays processing state during AI response generation

#### `src/components/menu.tsx`
Main menu interface:
- Provides access to settings and chat logs
- Manages component visibility states
- Handles VRM file loading

#### `src/components/settings.tsx`
Settings panel for application configuration:
- API key management (OpenRouter, ElevenLabs)
- Voice selection for text-to-speech
- VRM model loading
- System prompt customization
- Background image settings
- Chat history management
- Restream integration configuration

#### `src/components/chatLog.tsx`
Displays conversation history:
- Shows messages from user and AI character
- Implements auto-scrolling to latest messages
- Formats messages with distinct styling for each role

#### `src/components/assistantText.tsx`
Displays the current AI response:
- Shows streaming text as it's received from the API
- Provides real-time feedback during response generation

#### `src/components/restreamTokens.tsx`
Handles Restream integration:
- Manages authentication tokens for livestream chat
- Implements WebSocket connection for real-time chat messages
- Provides token refresh functionality
- Displays connection status and chat messages

#### `src/components/githubLink.tsx`
Displays GitHub repository link in the UI.

#### `src/components/meta.tsx`
Manages page metadata and SEO tags.

#### `src/components/responseTimeIndicator.tsx`
Displays response time metrics for LLM and TTS processing.

#### `src/components/iconButton.tsx`
Reusable icon button component with processing state.

#### `src/components/textButton.tsx`
Reusable text button component.

#### `src/components/link.tsx`
Reusable link component.

#### `src/components/introduction.tsx`
Initial setup interface for API keys.

### Core Features

#### Chat Functionality

##### `src/features/chat/openAiChat.ts`
Handles communication with OpenRouter API:
- Implements streaming chat responses using OpenRouter
- Processes API responses and formats them for display
- Handles error cases and connection issues

##### `src/features/messages/messages.ts`
Manages chat message processing:
- Defines message types and structures
- Implements text parsing for emotional expressions
- Converts text to screenplay format for character animation

##### `src/features/messages/speakCharacter.ts`
Manages character speech synthesis:
- Coordinates text-to-speech with character animation
- Handles audio playback and synchronization
- Implements queuing system for sequential speech

##### `src/features/messages/messageMiddleOut.ts`
Implements message history management:
- Limits chat history size to prevent API overload
- Removes middle messages when limits are exceeded
- Maintains conversation context while controlling token usage

#### VRM Character Management

##### `src/features/vrmViewer/viewer.ts`
Manages the Three.js 3D viewer:
- Initializes rendering context and scene
- Handles VRM model loading and unloading
- Manages camera controls and positioning
- Implements animation loop for continuous rendering

##### `src/features/vrmViewer/model.ts`
Manages individual VRM models:
- Handles VRM loading and initialization
- Manages character animations
- Coordinates lip-sync with audio playback
- Integrates emotion expression controllers

##### `src/features/vrmViewer/viewerContext.ts`
Provides React context for the VRM viewer:
- Makes viewer instance available throughout the application
- Ensures single viewer instance across components

#### Character Animation and Expression

##### `src/features/emoteController/emoteController.ts`
Controls character emotions and expressions:
- Manages expression playback
- Coordinates lip-sync animations
- Integrates with VRM expression system

##### `src/features/emoteController/expressionController.ts`
Manages VRM facial expressions:
- Controls emotion transitions
- Handles lip-sync expression blending
- Manages automatic blinking and gaze behavior

##### `src/features/emoteController/autoBlink.ts`
Implements automatic blinking behavior:
- Controls blink timing and animation
- Manages blink state during emotional expressions

##### `src/features/emoteController/autoLookAt.ts`
Manages character gaze behavior:
- Controls where the character looks
- Integrates with VRM look-at system

##### `src/features/emoteController/emoteConstants.ts`
Defines constants for emotional expressions:
- Provides preset values for different emotions
- Defines blink timing parameters

#### Audio and Lip-Sync

##### `src/features/lipSync/lipSync.ts`
Implements audio analysis for lip-sync:
- Analyzes audio data for volume detection
- Provides real-time volume information
- Handles audio playback from various sources

##### `src/features/lipSync/lipSyncAnalyzeResult.ts`
Defines the structure for lip-sync analysis results.

#### Text-to-Speech

##### `src/features/elevenlabs/elevenlabs.ts`
Integrates with ElevenLabs API:
- Implements text-to-speech synthesis
- Manages voice selection and parameters
- Handles audio data retrieval

#### Configuration Constants

##### `src/features/constants/systemPromptConstants.ts`
Defines the default system prompt for character behavior:
- Establishes character personality and response format
- Defines emotional expression tags

##### `src/features/constants/koeiroParam.ts`
Defines voice parameters for speech synthesis:
- Provides preset configurations for different voice characteristics
- Manages speaker positioning parameters

##### `src/features/constants/elevenLabsParam.ts`
Defines ElevenLabs voice parameters:
- Manages default voice selection
- Handles voice ID configuration

### Services

#### `src/services/websocketService.ts`
Manages WebSocket connections for livestream integration:
- Handles real-time chat message reception
- Implements message batching for efficient processing
- Manages connection state and reconnection logic
- Coordinates with LLM processing callbacks

#### `src/services/tokenRefreshService.ts`
Handles authentication token management:
- Implements automatic token refreshing
- Manages token storage in cookies
- Coordinates WebSocket reconnection with new tokens

#### `src/services/sample_event_messages.txt`
Contains sample event messages for testing.

### API Routes

#### `src/pages/api/chat.ts`
(Not currently used) - Placeholder for server-side chat processing.

#### `src/pages/api/refresh-token.ts`
Handles Restream token refresh requests:
- Proxies token refresh requests to external service
- Manages authentication flow for livestream integration

### Utilities

#### `src/utils/auth.ts`
Handles authentication utilities:
- Implements token refresh functionality
- Manages authentication flows

#### `src/utils/buildUrl.ts`
Constructs URLs with proper base paths:
- Handles asset URLs for different deployment environments
- Manages repository path prefixes

#### `src/utils/wait.ts`
Provides utility for async waiting:
- Implements promise-based delays

#### `src/utils/responseTimeTracker.ts`
Tracks response time metrics:
- Measures LLM and TTS processing times
- Provides real-time performance feedback

### VRM Animation Library

#### `src/lib/VRMAnimation/VRMAnimation.ts`
Handles VRM animation data:
- Manages animation tracks for humanoid bones
- Controls expression animations
- Handles look-at animations

#### `src/lib/VRMAnimation/loadVRMAnimation.ts`
Implements VRM animation loading:
- Loads animation data from files
- Integrates with Three.js GLTF loader

#### `src/lib/VRMAnimation/VRMAnimationLoaderPlugin.ts`
Provides VRM animation loading plugin:
- Extends GLTF loader functionality
- Handles VRM-specific animation data

#### `src/lib/VRMAnimation/VRMAnimationLoaderPluginOptions.ts`
Defines options for VRM animation loader plugin.

#### `src/lib/VRMAnimation/VRMCVRMAnimation.ts`
Handles VRM animation specifications:
- Implements VRM animation metadata parsing
- Manages animation constraints

#### `src/lib/VRMAnimation/utils/arrayChunk.ts`
Provides array chunking utility for animation processing.

#### `src/lib/VRMAnimation/utils/linearstep.ts`
Implements linear interpolation utility.

#### `src/lib/VRMAnimation/utils/saturate.ts`
Provides saturation/clamping utility functions.

#### `src/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmootherLoaderPlugin.ts`
Implements smoothed look-at behavior for VRM characters:
- Enhances default look-at functionality
- Provides smoother gaze transitions

#### `src/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmoother.ts`
Implements look-at smoothing algorithms:
- Reduces gaze jittering
- Provides natural eye movement patterns

## Data Flow

1. **User Input**: User sends message via text or voice input
2. **Message Processing**: Message is processed and added to chat log
3. **API Request**: Message is sent to OpenRouter API via `openAiChat.ts`
4. **Response Streaming**: AI response is streamed back and displayed
5. **Text-to-Speech**: Response text is converted to speech via ElevenLabs
6. **Character Animation**: VRM character lip-syncs and expresses emotions
7. **Audio Playback**: Generated audio is played through browser

## Livestream Integration Flow

1. **Authentication**: User provides Restream tokens in settings
2. **WebSocket Connection**: `websocketService.ts` connects to Restream
3. **Message Reception**: Chat messages are received in real-time
4. **Message Batching**: Messages are batched for efficient processing
5. **LLM Processing**: Batches are sent to LLM for response generation
6. **Response Handling**: AI responses are converted to speech and animated

## Key Implementation Details

### Emotional Expression System
- Characters can express emotions using tags: [neutral|happy|angry|sad|relaxed]
- Expressions are parsed from AI responses and mapped to VRM facial expressions
- Automatic blinking is managed to prevent conflicts with emotional expressions

### Lip-Sync Implementation
- Audio volume is analyzed in real-time for mouth movement synchronization
- Multiple facial expressions are used for realistic lip-sync
- Expression blending ensures smooth transitions

### Performance Optimization
- Message history is limited to prevent API overload
- Audio playback is queued to prevent overlap
- VRM animations are optimized for smooth rendering

### State Management
- React context is used for VRM viewer state
- Local storage persists user settings and chat history
- Cookies store authentication tokens securely

## Adding/Removing Components

### To Add a New Feature:
1. Create a new component in `src/components/` or extend existing ones
2. Add feature-specific logic in `src/features/`
3. Update state management in `src/pages/index.tsx`
4. Add configuration options in `src/components/settings.tsx`

### To Remove a Feature:
1. Identify all components and features related to the functionality
2. Remove UI components from `src/components/`
3. Remove feature implementations from `src/features/`
4. Clean up state management in `src/pages/index.tsx`
5. Remove configuration options from settings
6. Update any dependencies or references

## Configuration Files

### `next.config.js`
Next.js configuration:
- Handles asset prefixes and base paths
- Configures runtime environment variables

### `tsconfig.json`
TypeScript configuration:
- Defines compilation options
- Sets up path aliases for imports

### `package.json`
Project dependencies and scripts:
- Lists all required packages
- Defines development and build scripts
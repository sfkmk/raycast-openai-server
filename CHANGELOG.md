# OpenAI Server Changelog

## [2.0.0] - 2024-01-XX

### Added
- **API Key Authentication**: Full OpenAI-compatible API key authentication required for all API endpoints
- **Health Endpoint**: New `/health` endpoint for robust server status monitoring (no authentication required)
- **Enhanced Error Handling**: Comprehensive error handling with user-friendly toast notifications
- **Server Status Validation**: Pre-flight checks to prevent duplicate server starts and invalid kill attempts
- **Improved Logging**: Better error messages and status reporting throughout the application

### Changed
- **Authentication Model**: All OpenAI API endpoints now require `Authorization: Bearer <API_KEY>` header
- **Extension Preferences**: API Key is now a required configuration field alongside Port
- **Server Lifecycle**: Robust start/stop validation with health checks before and after operations
- **Command Feedback**: Precise toast notifications showing actual server status instead of generic messages

### Enhanced
- **Kill Command**: Now validates server is running before attempting shutdown and confirms successful stop
- **Start Command**: Prevents starting multiple servers on same port with clear error messaging  
- **Status Monitoring**: Replaced simple ping with comprehensive health endpoint querying
- **TypeScript**: Improved type safety and eliminated all linting warnings

### Technical Improvements
- Modular `queryHealth` utility for consistent server status checking
- Proper async/await error handling with typed exceptions
- Keep-alive mechanism to prevent premature command termination
- Response-first kill logic to ensure client receives shutdown confirmation

### Breaking Changes
- API Key is now mandatory in extension preferences
- All API requests must include valid Authorization header
- Health endpoint replaces previous model-based server detection

## [Initial Version] - {PR_MERGE_DATE}
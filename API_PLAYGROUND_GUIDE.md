# API Playground & Documentation Generator

A comprehensive, production-ready API testing and documentation platform that rivals Postman and ReadMe.

## Features Overview

### 1. Request Builder
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **URL Builder**: Support for environment variables with `{{variable}}` syntax
- **Query Parameters**: Dynamic key-value editor with enable/disable toggles
- **Headers Management**: Custom headers with descriptions
- **Request Body**:
  - JSON with syntax highlighting
  - Raw text
  - Form data
  - URL-encoded
- **Authentication**:
  - Bearer Token
  - Basic Auth
  - API Key (header or query param)
  - OAuth 2.0
- **Pre-request Scripts**: JavaScript code execution before requests
- **Tests/Assertions**: Post-request validation scripts

### 2. Response Viewer
- **Status Display**: Visual status codes with color coding
  - 2xx: Green (Success)
  - 3xx: Blue (Redirect)
  - 4xx: Orange (Client Error)
  - 5xx: Red (Server Error)
- **Response Body**: Formatted JSON with syntax highlighting
- **Headers**: All response headers displayed
- **Performance Metrics**:
  - Response time (ms/s)
  - Response size (Bytes/KB/MB)
- **Cookies**: Display and parse response cookies
- **Raw View**: Unformatted response data
- **Actions**:
  - Copy to clipboard
  - Download as JSON file

### 3. Collections & Organization
- **Collections**: Group related API requests
- **Folders**: Nested folder structure (coming soon)
- **Search**: Full-text search across collections
- **Favorites**: Star important requests
- **History**: Automatic request history tracking (50 most recent)
- **Import/Export**:
  - Import Postman collections (JSON v2.1)
  - Export collections to JSON
  - Export all data (collections + environments)

### 4. Code Generation
Generate ready-to-use code snippets in multiple languages:
- **JavaScript**:
  - Fetch API
  - Axios
- **Python**: requests library
- **cURL**: Command-line ready
- **PHP**: cURL implementation
- **Ruby**: Net::HTTP
- **Go**: http package
- **Java**: HttpClient

All snippets include:
- Full URL with query parameters
- All headers
- Authentication
- Request body

### 5. Environment Variables
- **Multiple Environments**: Dev, Staging, Production, etc.
- **Variable Scoping**: Environment-specific variables
- **Secret Variables**: Masked values for sensitive data
- **Quick Switcher**: Change environments instantly
- **Syntax**: Use `{{variableName}}` anywhere in requests

### 6. Documentation Generator
- **Auto-generate API Docs**: From any collection
- **Markdown Export**: README.md files
- **HTML Export**: Static documentation sites
- **Configuration**:
  - Title and description
  - Version numbering
  - Base URL
  - Public/private settings
- **Documentation Includes**:
  - Endpoint listings
  - Request/response examples
  - Code snippets in multiple languages
  - Query parameters
  - Headers
  - Request bodies

## File Structure

```
/home/user/conductor/
├── app/
│   ├── api-playground/
│   │   └── page.tsx                    # Main playground page
│   └── api/
│       └── playground/
│           └── execute/
│               └── route.ts            # API proxy endpoint
├── components/
│   └── api-playground/
│       ├── request-builder.tsx         # Request configuration
│       ├── response-viewer.tsx         # Response display
│       ├── collections-sidebar.tsx     # Collections management
│       ├── code-generator.tsx          # Code snippets
│       ├── environments-manager.tsx    # Environment variables
│       └── docs-generator.tsx          # Documentation
├── lib/
│   └── api-playground/
│       ├── types.ts                    # TypeScript types
│       ├── utils.ts                    # Utility functions
│       ├── store.ts                    # Zustand state management
│       └── code-generator.ts           # Code generation logic
└── components/ui/                      # UI components
    ├── button.tsx
    ├── input.tsx
    ├── tabs.tsx
    ├── dialog.tsx
    ├── select.tsx
    ├── checkbox.tsx
    ├── card.tsx
    ├── badge.tsx
    ├── scroll-area.tsx
    └── dropdown-menu.tsx
```

## Usage Guide

### Getting Started

1. **Access the Playground**:
   ```
   http://localhost:3000/api-playground
   ```

2. **Create a Collection**:
   - Click "New Collection" in the sidebar
   - Give it a name and description
   - Start adding requests

3. **Build a Request**:
   - Select HTTP method (GET, POST, etc.)
   - Enter URL
   - Add query parameters, headers, body as needed
   - Configure authentication if required

4. **Send Request**:
   - Click "Send" button
   - View response in the Response tab
   - Check status, headers, timing

5. **Save Request**:
   - Click "Save" button
   - Enter request name
   - Request saved to active collection

### Environment Variables

1. **Create Environment**:
   - Go to "Environments" tab
   - Click "New Environment"
   - Add variables (key-value pairs)

2. **Use Variables**:
   ```
   URL: {{baseUrl}}/api/users
   Header: Authorization: Bearer {{token}}
   ```

3. **Switch Environments**:
   - Select environment from dropdown
   - All variables automatically applied

### Code Generation

1. **View Code**:
   - Configure your request
   - Go to "Code" tab
   - Select language from dropdown

2. **Copy Code**:
   - Click "Copy Code" button
   - Paste into your application
   - Code includes all configurations

### Documentation

1. **Generate Docs**:
   - Go to "Docs" tab
   - Select collection
   - Configure title, version, base URL

2. **Preview**:
   - View live preview of documentation
   - See all endpoints formatted

3. **Export**:
   - Export as Markdown (README.md)
   - Export as HTML (standalone site)

### Import/Export

#### Import Postman Collection:
1. Click "Import" button
2. Upload .json file or paste JSON
3. Collection automatically created

#### Export Collections:
1. Click "Export All" for everything
2. Or use collection dropdown menu for individual export
3. Download JSON file

## API Proxy Endpoint

The playground uses a proxy endpoint to avoid CORS issues:

**Endpoint**: `/api/playground/execute`

**Features**:
- Handles all HTTP methods
- Processes authentication
- Builds headers and body
- Returns formatted response
- Tracks timing and size

## State Management

Uses Zustand with persistence:

**Persisted Data**:
- Collections
- Environments
- Request history (last 50)
- Favorites
- Active environment

**Storage**: Browser localStorage

## Advanced Features

### Pre-request Scripts
Execute JavaScript before sending request:
```javascript
// Set dynamic timestamp
const timestamp = Date.now();
// Available in request as {{timestamp}}
```

### Response Tests
Validate responses automatically:
```javascript
// Check status code
if (response.status === 200) {
  console.log('Success!');
}

// Validate response data
if (response.data.users.length > 0) {
  console.log('Users found');
}
```

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Send request
- `Ctrl/Cmd + S`: Save request
- `Ctrl/Cmd + K`: Focus search
- `Ctrl/Cmd + E`: Switch environment

## Best Practices

### Organization
1. **Use Collections**: Group related endpoints
2. **Name Clearly**: Use descriptive request names
3. **Add Descriptions**: Document what each request does
4. **Use Folders**: Organize large collections (coming soon)

### Environment Variables
1. **Separate by Environment**: dev, staging, prod
2. **Use for URLs**: `{{baseUrl}}` instead of hardcoding
3. **Secure Secrets**: Mark sensitive values as secret
4. **Document Variables**: Add descriptions

### Documentation
1. **Keep Updated**: Regenerate after API changes
2. **Add Examples**: Include sample responses
3. **Version Control**: Track version numbers
4. **Share**: Export and share with team

## Comparison with Postman

| Feature | API Playground | Postman |
|---------|---------------|---------|
| Request Building | ✅ | ✅ |
| Collections | ✅ | ✅ |
| Environments | ✅ | ✅ |
| Code Generation | ✅ (8 languages) | ✅ (20+ languages) |
| Documentation | ✅ Auto-generate | ✅ Separate tool |
| History | ✅ 50 requests | ✅ Unlimited |
| Import Postman | ✅ | N/A |
| Team Collaboration | ❌ (Coming) | ✅ |
| Mock Servers | ❌ (Coming) | ✅ |
| API Monitoring | ❌ (Coming) | ✅ |
| GraphQL | ❌ (Coming) | ✅ |
| WebSocket | ❌ (Coming) | ✅ |
| Performance Testing | ❌ (Coming) | ✅ |
| Price | 🎉 Free | Free/Paid |

## Future Enhancements

### Planned Features
- [ ] Folder support in collections
- [ ] Mock server creation
- [ ] API monitoring and uptime tracking
- [ ] GraphQL support
- [ ] WebSocket testing
- [ ] Performance/load testing
- [ ] Team collaboration
- [ ] Request chaining
- [ ] Variable extraction from responses
- [ ] Request duplication
- [ ] Bulk operations
- [ ] API diff/comparison
- [ ] Request templates
- [ ] Custom themes
- [ ] Export to OpenAPI/Swagger

## Technical Details

### Technologies Used
- **Framework**: Next.js 14 with App Router
- **State Management**: Zustand with persistence
- **UI Components**: Custom + shadcn/ui patterns
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Fetch API
- **Type Safety**: TypeScript throughout

### Performance
- **Fast Rendering**: React 18 with Server Components
- **Optimized State**: Selective re-renders
- **Lazy Loading**: Code splitting for large collections
- **Local Storage**: Instant load times
- **Proxy Caching**: Smart request caching (coming)

## Troubleshooting

### Request Fails
1. Check URL is correct
2. Verify authentication is configured
3. Check CORS settings on API server
4. View console for detailed errors

### Variables Not Working
1. Ensure environment is selected
2. Check variable syntax: `{{name}}`
3. Verify variable is enabled
4. Check spelling matches exactly

### Import Fails
1. Verify JSON is valid
2. Check Postman collection version (v2.1 supported)
3. Look for error message in toast

### Response Not Displaying
1. Check network tab for actual response
2. Verify content-type header
3. Try raw view
4. Check browser console for errors

## Support

For issues or feature requests:
1. Check this guide first
2. Review console errors
3. Check browser compatibility
4. Verify Next.js version compatibility

## License

Built with Next.js, React, and TypeScript.
Open source components used where applicable.

---

Built with ⚡ by Claude Code

# API Playground - Examples & Tutorials

## Quick Start Tutorial

### Example 1: Testing a Public API (JSONPlaceholder)

#### Step 1: Create Your First Request
1. Navigate to `/api-playground`
2. Click "New Collection" in sidebar
3. Name it "JSONPlaceholder API"
4. Create collection

#### Step 2: GET Request - Fetch Users
```
Method: GET
URL: https://jsonplaceholder.typicode.com/users
```

Click "Send" to see the response!

**Expected Response**:
```json
[
  {
    "id": 1,
    "name": "Leanne Graham",
    "username": "Bret",
    "email": "Sincere@april.biz"
  },
  // ... more users
]
```

#### Step 3: Save the Request
1. Click "Save" button
2. Name it "Get All Users"
3. Request saved to collection

#### Step 4: POST Request - Create User
```
Method: POST
URL: https://jsonplaceholder.typicode.com/users
Headers:
  Content-Type: application/json
Body (JSON):
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe"
}
```

### Example 2: Using Environment Variables

#### Create Environment
1. Go to "Environments" tab
2. Click "New Environment"
3. Name it "Development"
4. Add variables:

```
baseUrl: https://api.example.com
apiKey: your-dev-api-key-here
version: v1
```

#### Use Variables in Request
```
Method: GET
URL: {{baseUrl}}/{{version}}/users

Headers:
  X-API-Key: {{apiKey}}
```

The playground will automatically replace:
- `{{baseUrl}}` → `https://api.example.com`
- `{{version}}` → `v1`
- `{{apiKey}}` → `your-dev-api-key-here`

### Example 3: Authentication Patterns

#### Bearer Token Authentication
```
Method: GET
URL: https://api.example.com/protected-endpoint

Auth:
  Type: Bearer Token
  Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Automatically adds header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Basic Authentication
```
Method: GET
URL: https://api.example.com/admin

Auth:
  Type: Basic Auth
  Username: admin
  Password: secret123
```

Automatically adds header:
```
Authorization: Basic YWRtaW46c2VjcmV0MTIz
```

#### API Key Authentication
```
Method: GET
URL: https://api.example.com/data

Auth:
  Type: API Key
  Key: X-API-Key
  Value: abc123xyz
  Add To: Header
```

### Example 4: Testing REST API CRUD Operations

#### Setup Collection: "User Management API"

**1. CREATE - Add New User**
```
Method: POST
URL: {{baseUrl}}/users
Headers:
  Content-Type: application/json
  Authorization: Bearer {{token}}
Body:
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "role": "developer"
}
```

**2. READ - Get User by ID**
```
Method: GET
URL: {{baseUrl}}/users/{{userId}}
Headers:
  Authorization: Bearer {{token}}
```

**3. UPDATE - Modify User**
```
Method: PUT
URL: {{baseUrl}}/users/{{userId}}
Headers:
  Content-Type: application/json
  Authorization: Bearer {{token}}
Body:
{
  "firstName": "Jane",
  "lastName": "Smith-Johnson",
  "email": "jane.johnson@example.com",
  "role": "senior-developer"
}
```

**4. DELETE - Remove User**
```
Method: DELETE
URL: {{baseUrl}}/users/{{userId}}
Headers:
  Authorization: Bearer {{token}}
```

### Example 5: Query Parameters

#### Simple Query Params
```
Method: GET
URL: https://api.example.com/products

Query Params:
  category: electronics
  price_max: 1000
  sort: price_asc
  limit: 20
```

Builds URL:
```
https://api.example.com/products?category=electronics&price_max=1000&sort=price_asc&limit=20
```

#### With Variables
```
Query Params:
  status: {{orderStatus}}
  from_date: {{startDate}}
  to_date: {{endDate}}
```

### Example 6: Pre-request Script

#### Generate Dynamic Timestamp
```javascript
// Pre-request Script
const now = new Date();
const timestamp = now.toISOString();
const unixTimestamp = Math.floor(now.getTime() / 1000);

console.log('Request timestamp:', timestamp);
console.log('Unix timestamp:', unixTimestamp);

// These can be used in request
```

Then in request:
```
Headers:
  X-Request-Time: {{timestamp}}
  X-Unix-Time: {{unixTimestamp}}
```

#### Generate Random Values
```javascript
// Pre-request Script
const randomId = Math.random().toString(36).substring(7);
const randomEmail = `user-${randomId}@test.com`;

console.log('Generated email:', randomEmail);
```

### Example 7: Response Tests

#### Basic Status Check
```javascript
// Tests
if (response.status === 200) {
  console.log('✓ Request successful');
} else {
  console.error('✗ Request failed with status:', response.status);
}
```

#### Validate Response Data
```javascript
// Tests
const data = response.data;

// Check if response has users array
if (Array.isArray(data.users)) {
  console.log('✓ Users array exists');
  console.log(`Found ${data.users.length} users`);
} else {
  console.error('✗ Missing users array');
}

// Validate user structure
if (data.users.length > 0) {
  const firstUser = data.users[0];
  if (firstUser.id && firstUser.email) {
    console.log('✓ User structure valid');
  } else {
    console.error('✗ Invalid user structure');
  }
}
```

### Example 8: Code Generation

#### Generate cURL Command
1. Configure your request completely
2. Go to "Code" tab
3. Select "cURL"
4. Copy the generated command:

```bash
curl -X POST 'https://api.example.com/users' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer your-token-here' \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

#### Generate JavaScript Fetch
Select "JavaScript (Fetch)":

```javascript
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-token-here"
  },
  body: JSON.stringify({"name":"John Doe","email":"john@example.com"})
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

#### Generate Python Requests
Select "Python":

```python
import requests

url = "https://api.example.com/users"
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token-here'
}
data = {'name': 'John Doe', 'email': 'john@example.com'}

response = requests.post(url, headers=headers, json=data)

print(response.json())
```

### Example 9: Import Postman Collection

#### Export from Postman
1. In Postman, click on your collection
2. Click "..." → Export
3. Choose "Collection v2.1"
4. Save JSON file

#### Import to API Playground
1. Click "Import" button
2. Either:
   - Upload the JSON file, or
   - Paste the JSON content
3. Click "Import Collection"
4. Collection appears in sidebar

### Example 10: Generate Documentation

#### Create API Documentation
1. Build your collection with multiple requests
2. Go to "Docs" tab
3. Select your collection
4. Configure:
   ```
   Title: User Management API
   Description: Complete API for user CRUD operations
   Version: 1.0.0
   Base URL: https://api.example.com
   ```

5. Preview the documentation
6. Export as:
   - **Markdown** for GitHub README
   - **HTML** for static hosting

#### Sample Generated Markdown
```markdown
# User Management API

Complete API for user CRUD operations

**Version:** 1.0.0
**Base URL:** `https://api.example.com`

## Endpoints

### Get All Users

`GET` `/users`

Returns a list of all users in the system.

#### Headers

| Name | Value |
|------|-------|
| `Authorization` | `Bearer {{token}}` |

#### Example (cURL)

```bash
curl -X GET 'https://api.example.com/users' \
  -H 'Authorization: Bearer your-token'
```
```

## Real-World Scenarios

### Scenario 1: Testing Payment Gateway

```
Collection: "Stripe API"

Environment Variables:
  baseUrl: https://api.stripe.com
  secretKey: sk_test_your_key_here
  version: v1

Requests:
1. Create Customer
   POST {{baseUrl}}/{{version}}/customers

2. Create Payment Intent
   POST {{baseUrl}}/{{version}}/payment_intents

3. Confirm Payment
   POST {{baseUrl}}/{{version}}/payment_intents/{{paymentId}}/confirm
```

### Scenario 2: Testing Social Media API

```
Collection: "Social Media API"

Requests:
1. Get Timeline
   GET /api/timeline?limit=20&offset=0

2. Create Post
   POST /api/posts
   Body: { "content": "Hello world!", "media": [] }

3. Like Post
   POST /api/posts/{{postId}}/like

4. Add Comment
   POST /api/posts/{{postId}}/comments
   Body: { "text": "Great post!" }

5. Get Notifications
   GET /api/notifications?unread=true
```

### Scenario 3: Testing E-commerce API

```
Collection: "E-commerce Store"

Flow:
1. Browse Products
   GET /api/products?category=electronics

2. Add to Cart
   POST /api/cart/items
   Body: { "productId": "123", "quantity": 2 }

3. Get Cart
   GET /api/cart

4. Apply Coupon
   POST /api/cart/coupon
   Body: { "code": "SAVE10" }

5. Checkout
   POST /api/checkout
   Body: { "paymentMethod": "card", "shippingAddress": {...} }
```

## Tips & Tricks

### Tip 1: Use History for Quick Retries
- Failed request? Check History tab
- Click to reload the exact request
- Modify and retry

### Tip 2: Organize with Naming Conventions
```
Naming Pattern:
[Module] Action - Details

Examples:
Users - Create New User
Users - Get By ID
Users - Update Profile
Users - Delete Account
Auth - Login
Auth - Refresh Token
```

### Tip 3: Environment per Stage
Create separate environments:
- **Local** (localhost:3000)
- **Development** (dev.example.com)
- **Staging** (staging.example.com)
- **Production** (api.example.com)

### Tip 4: Share Collections
1. Export collection as JSON
2. Commit to Git repository
3. Team members can import
4. Version control your API tests!

### Tip 5: Documentation as Code
1. Keep docs in sync with code
2. Export docs after each API change
3. Include in pull requests
4. Host static HTML on GitHub Pages

## Common Patterns

### Pattern 1: OAuth 2.0 Flow
```
1. Get Authorization Code
   GET /oauth/authorize?client_id={{clientId}}&response_type=code

2. Exchange Code for Token
   POST /oauth/token
   Body: {
     "code": "{{authCode}}",
     "client_id": "{{clientId}}",
     "client_secret": "{{clientSecret}}",
     "grant_type": "authorization_code"
   }

3. Use Access Token
   Headers: Authorization: Bearer {{accessToken}}
```

### Pattern 2: Pagination
```
Page 1:
GET /api/users?page=1&per_page=20

Page 2:
GET /api/users?page=2&per_page=20

Or cursor-based:
GET /api/users?cursor={{nextCursor}}&limit=20
```

### Pattern 3: File Upload
```
Method: POST
URL: /api/upload
Body Type: Form Data
Fields:
  file: [select file]
  description: "Profile picture"
  category: "avatar"
```

---

## Need Help?

Refer to [API_PLAYGROUND_GUIDE.md](./API_PLAYGROUND_GUIDE.md) for complete feature documentation.

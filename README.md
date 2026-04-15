# Mini DNS API - Speer Backend Assessment

A production-quality Node.js/Express API for managing and resolving DNS records (A and CNAME), featuring strict DNS constraint validation and asynchronous processing.

## 🚀 Features

- **DNS Record Management**: Supports A (IPv4) and CNAME (Alias) records.
- **RFC-Compliant Validation**: Strict hostname and IPv4 syntax checking.
- **Realistic DNS Logic**:
    - Multiple A records per hostname allowed.
    - CNAME records must be exclusive (only one per hostname, no coexistence with other types).
- **CNAME Chaining & Resolution**: Recursive resolution of CNAME chains with built-in circular reference detection.
- **Asynchronous Processing**: Background TTL cleanup and non-blocking request logging.
- **Developer Experience**: Global error handling and comprehensive unit testing.

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Testing**: Jest & Supertest
- **Environment**: Dotenv for configuration

## ⚙️ Setup & Installation

1. **Clone the project**:
   ```bash
   git clone <your-repo-url>
   cd Mini-DNS-API
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/mini-dns
   NODE_ENV=development
   ```

4. **Run the Application**:
   - Development mode: `npm run dev`
   - Production mode: `npm start`

5. **Run Tests**:
   ```bash
   npm test
   ```

## 📚 API Documentation

### 1. Add DNS Record
`POST /api/dns`
**Request Body**:
```json
{ "type": "A", "hostname": "example.com", "value": "192.168.1.1", "ttl": 3600 }
```
**Response (201 Created)**:
```json
{
  "hostname": "example.com",
  "type": "A",
  "value": "192.168.1.1",
  "createdAt": "2026-04-15T12:00:00.000Z"
}
```

### 2. Resolve Hostname
`GET /api/dns/:hostname`
**Response (200 OK)**:
```json
{
  "hostname": "alias.example.com",
  "resolvedIps": ["192.168.1.1"],
  "recordType": "CNAME",
  "pointsTo": "example.com"
}
```

### 3. List Records
`GET /api/dns/:hostname/records`
**Response (200 OK)**:
```json
{
  "hostname": "example.com",
  "records": [
    { "type": "A", "value": "192.168.1.1" }
  ]
}
```

### 4. Delete Record
`DELETE /api/dns/:hostname?type=A&value=1.2.3.4`
**Response (200 OK)**:
```json
{ "message": "DNS record deleted successfully." }
```

## 🧠 Reasoning Behind Implementation

### Architecture
I adopted a **Controller-Service-Model** pattern to ensure a clean separation of concerns. 
- **Models**: Handle data schemas and basic DB constraints.
- **Services**: Contain the "business logic" (recursive resolution, TTL cleanup).
- **Controllers**: Handle HTTP-specific logic, response formatting, and asynchronous logging.
- **Validation Layer**: A dedicated service ensures DNS constraints (like CNAME exclusivity) are met before any database operation.

### Asynchronous Processing (Senior Requirement)
1. **TTL Expiration Management**: A background job using `setInterval` runs every 30 seconds to prune expired records. This ensures high performance for read operations as expired records are removed out-of-band.
2. **DNS Query Logging**: Requests are logged using `setImmediate()`. This offloads the logging task to the next turn of the event loop, ensuring that the primary HTTP response is delivered to the user with minimal latency.

### Testing Strategy
The project employs a multi-layered testing approach:
1. **Automated Unit Tests**: Built with **Jest**, focusing on recursive resolution logic and record conflict constraints.
2. **Manual API Testing**: Verified extensively using **Postman** to ensure endpoint reliability, status codes, and JSON response integrity.
3. **Environment Compatibility**: Tests use mocked models to ensure reliability across different hosting environments.

## 🤖 AI Usage Disclosure

This project was developed with assistance from **Antigravity (Google DeepMind)**. 
- **Usage**: Used for initial boilerplate generation, debugging complex CNAME recursion patterns, and drafting testing frameworks.
- **Verification & Manual Effort**: 
    - All logic was manually reviewed and refined by the candidate.
    - **Postman** was used for live endpoint validation.
    - **Jest** tests were executed and verified manually to ensure all edge cases (circularity, conflicts) are handled.

## 📁 Project Structure

```text
├── src/
│   ├── config/      # DB Connection logic
│   ├── controllers/ # HTTP Request Handlers
│   ├── models/      # Mongoose Schemas
│   ├── routes/      # Express Route Definitions
│   ├── services/    # Business Logic & Validation
│   ├── app.js       # Express App Configuration
│   └── server.js    # Entry Point & Background Jobs
├── tests/           # Jest Integration Tests
└── README.md
```
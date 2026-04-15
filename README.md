# Mini DNS API - Speer Backend Assessment

A production-quality Node.js/Express API for managing and resolving DNS records (A and CNAME), featuring strict DNS constraint validation and asynchronous processing.

## 🚀 Features

- **DNS Record Management**: Supports A (IPv4) and CNAME (Alias) records.
- **RFC-Compliant Validation**: Strict hostname and IPv4 syntax checking.
- **Realistic DNS Logic**: CNAME exclusivity and recursive resolution logic.
- **Asynchronous Processing**: Background TTL cleanup and non-blocking query logging.
- **Developer Experience**: Global error handling and isolated unit testing.

---

## ⚙️ Getting Started

**Quick Start**:
```bash
npm install && npm run dev
```

### 1. Install dependencies

```bash
npm install
```

### 2. Run the server
```bash
npm run dev
```
**Server will run on**: [http://localhost:3000](http://localhost:3000)

---

## 🧪 Running Tests

Run the comprehensive test suite with:
```bash
npm test
```
**Test Coverage Includes**:
- A record creation
- CNAME creation and exclusivity validation
- Recursive resolution (CNAME chaining)
- Circular reference detection
- Error handling and RFC constraints

---

## 📡 API Endpoints

### ➤ Create DNS Record
`POST /api/dns`

**Request Body (A Record)**:
```json
{
  "hostname": "example.com",
  "type": "A",
  "value": "1.2.3.4"
}
```

**Request Body (CNAME Record)**:
```json
{
  "hostname": "www.example.com",
  "type": "CNAME",
  "value": "example.com"
}
```

### ➤ Resolve Hostname
`GET /api/dns/:hostname`

---

## 🛠 Manual Testing (cURL Examples)

### 1. Create an A Record
```bash
curl -X POST http://localhost:3000/api/dns \
-H "Content-Type: application/json" \
-d '{
  "hostname": "example.com",
  "type": "A",
  "value": "1.2.3.4"
}'
```

### 2. Create a CNAME Record
```bash
curl -X POST http://localhost:3000/api/dns \
-H "Content-Type: application/json" \
-d '{
  "hostname": "www.example.com",
  "type": "CNAME",
  "value": "example.com"
}'
```

### 3. Resolve a Hostname
```bash
curl http://localhost:3000/api/dns/www.example.com
```

---

## 🧠 Implementation Notes

### DNS Logic
- **Recursive Resolution**: CNAME records resolve recursively until reaching an A record.
- **Circular Detection**: Circular references (A -> B -> A) are detected and safely rejected.
- **Exclusivity**: A hostname with a CNAME cannot have other record types, ensuring realistic DNS behavior.

### Asynchronous Behavior (Senior Requirements)
- **Non-blocking Logging**: Request logging is handled asynchronously using `setImmediate` to ensure zero impact on response latency.
- **TTL Background Job**: A simulated background job periodically handles record lifecycle and expiration.

---

## 📁 Project Structure
```text
.
├── src/
│   ├── app.js       # Express config & middleware
│   ├── server.js    # Entry point & background jobs
│   ├── routes/      # Endpoint definitions
│   ├── controllers/ # Request handlers
│   ├── models/      # Mongoose schemas
│   └── services/    # Business logic & validation
├── tests/
│   └── dns.test.js  # Jest integration suite
├── package.json
└── README.md
```

---

## 🤖 AI Usage Disclosure

This project was developed with assistance from AI tools, including **Antigravity (Google DeepMind)**.

**AI was used for**:
- Structural boilerplate and pattern implementation.
- Debugging complex recursion edge cases.
- Refining documentation and test scenarios.

**Verification**:
- All code was manually reviewed, forstått, and validated using **Postman** and **Jest** before submission.

---

## ✅ Final Notes
This project reflects modern backend engineering discipline:
- **Clean Architecture**: Strong modular separation.
- **Robustness**: Comprehensive validation and error handling.
- **Reliability**: Deterministic and isolated testing.

**Submission ready.** ✉️
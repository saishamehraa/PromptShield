# 🛡️ PromptShield Lite

### AI Security Gateway for Safe & Trustworthy LLM Applications

---

## 🚨 The Problem

Modern AI applications are powerful—but dangerously vulnerable. A single malicious prompt can:

* Override system instructions (**prompt injection**)
* Expose hidden data or API keys
* Leak sensitive user information (**PII**)
* Manipulate AI behavior without detection

As AI adoption grows, **security is no longer optional—it’s critical**.

---

## 🛡️ The Solution

**PromptShield Lite** is a real-time AI security gateway that sits between users and LLMs, actively **detecting, sanitizing, and blocking threats** before they reach the model.

It transforms AI systems from:

> ❌ Reactive and vulnerable
> into
> ✅ Secure, controlled, and production-ready

---

## 🏗️ Core Architecture & Engines

PromptShield operates on a **Zero-Trust security pipeline** built into a Node.js backend:

```text
User Input 
   ↓
[Detection & Masking]
   ↓
[Risk Scoring]
   ↓
[Policy Engine]
   ↓
[LLM Router]
   ↓
[Output Guard]
   ↓
Safe Response
```

---

### 🔐 1. Security Pipeline (`backend/engines/security.js`)

This engine performs multi-layered threat analysis:

* **Detection Engine**
  Detects 20+ prompt injection patterns and 9+ sensitive data types
  (emails, API keys, JWTs, SSNs, etc.)

* **Masking Engine**
  Redacts sensitive data before model execution
  Example:
  `sk-12345 → [REDACTED_API_KEY]`

* **Risk Scoring Engine**
  Assigns a dynamic **0–100 threat score**

* **Policy Engine**

  * 🟢 ALLOW (< 40)
  * 🟡 SANITIZE (40–69)
  * 🔴 BLOCK (≥ 70)

* **Output Guard**
  Scans model responses to prevent data leaks or system prompt exposure

---

### 🤖 2. Intelligent Model Routing (`backend/engines/llm.js`)

PromptShield uses a **resilient multi-provider routing system**:

#### 🟣 Primary (Cloud)

* **Gemma 4 via OpenRouter**
* Stable, rate-limit-resistant inference
* Used for all standard requests

#### 🟡 Secondary (Optional / Demo)

* **Ollama (gemma4 / gemma:2b)**
* Enables offline / edge execution (shown in demo)

#### 🔴 Fallback (Guaranteed)

* Safe fallback response if all providers fail

---

### ⚡ Key Design Principle

> No single point of failure.
> The system **never crashes**, even under API failures or outages.

---

### 📊 3. Forensic Audit Logging (`backend/models/AuditLog.js`)

Every request is securely logged with:

* Original input
* Masked input
* Risk score
* Action taken
* Model used
* Processing latency

Stored in **MongoDB Atlas** for compliance and observability.

---

## 🧪 Example Scenarios

| Scenario     | Input                                                     | Action   | Result           |
| ------------ | --------------------------------------------------------- | -------- | ---------------- |
| 🟢 Safe      | “What is AI?”                                             | ALLOW    | Normal response  |
| 🟡 PII       | “My email is [test@company.com](mailto:test@company.com)” | SANITIZE | Email masked     |
| 🔴 API Key   | “sk-123456…”                                              | BLOCK    | Request denied   |
| 🔴 Injection | “Ignore instructions…”                                    | BLOCK    | Attack prevented |

---

## 🛠️ Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS
**Backend:** Node.js, Express.js
**Database:** MongoDB Atlas
**AI Models:**

* Gemma 4 (HuggingFace/OpenRouter)
* Gemma 4 & Gemma 2B (Ollama local edge – demo only)

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

---

### 2. Setup Environment Variables

Create a `.env` file:

```env
PORT=3001
MONGODB_URI=your_mongodb_uri
OPENROUTER_API_KEY=your_openrouter_api_key
OLLAMA_URL=optional_local_endpoint
HF_API_KEY=your_huggingface_api_key
```

---

### 3. Run the Application

**Start Backend:**

```bash
cd backend
npm run start
```

**Start Frontend:**

```bash
cd src
npm run dev
```

---

## 🌍 Impact

PromptShield enables safe AI deployment in:

* 🏥 **Healthcare** → Protect patient data
* 🎓 **Education** → Prevent misuse and jailbreaks
* 🏢 **Enterprise** → Secure internal AI systems
* 🌐 **Low-resource environments** → Offline-ready AI

It bridges the gap between:

> **AI capability ↔ AI trust**

---

## 📁 Project Structure

```
promptshield-lite/
│
├── src/                         # React + Vite UI
│   ├── app/
│   │   ├── components/
│   │   ├── engines/
│   │   ├── data/
│   │   └── App.tsx
│   └── styles/
│
└── backend/                     # Node.js + Express API
    ├── engines/
    │   ├── security.js
    │   └── llm.js
    ├── models/
    │   └── AuditLog.js
    ├── .env
    ├── package.json
    └── server.js
```

---

## 🧠 Final Note

PromptShield Lite is not just a security layer.

It is a **foundation for building trustworthy AI systems**—
ensuring that powerful models like Gemma 4 can be deployed safely, reliably, and at scale.

> Because the future of AI depends not just on capability—
> but on **trust**.

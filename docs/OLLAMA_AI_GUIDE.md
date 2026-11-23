# Local Ollama AI Assistant & Safety Architecture

## 1. Local AI Brain Overview

CyberSentinel AI integrates a Tier-3 AI Security Analyst assistant that runs **strictly offline on local hardware via Ollama**. It eliminates third-party data exfiltration risks and complies with zero-trust SOC compliance mandates.

### Default Recommended Models
- **Primary Reasoning Model:** `qwen3:8b` (or `llama3.1:8b`)
- **Embedding Model:** `nomic-embed-text`

---

## 2. Ollama Installation & Configuration

### Windows 11 / macOS / Linux Setup

1. **Install Ollama:**
   Download and install from [ollama.com](https://ollama.com).

2. **Pull Required Models:**
   ```powershell
   # Primary reasoning model
   ollama pull qwen3:8b

   # Alternative reasoning model
   ollama pull llama3.1:8b

   # Embeddings model
   ollama pull nomic-embed-text
   ```

3. **Start the Ollama Daemon:**
   ```powershell
   ollama serve
   ```
   *Verify availability by browsing to `http://localhost:11434` or running `curl http://localhost:11434/api/version`.*

---

## 3. AI Safety & Prompt Injection Guardrails

CyberSentinel AI treats all ingested log contents, payload strings, and analyst queries as **untrusted data**.

### Security Guardrail Enforcement (`SecurityGuard`):
1. **Delimited Grounding Context:** All raw telemetry is stripped of null/control characters and encapsulated in read-only code blocks (`### UNTRUSTED SECURITY TELEMETRY EVIDENCE`).
2. **Instruction Override Filtering:** Proactively scans and blocks common LLM jailbreak vectors:
   - `ignore previous instructions`
   - `you are now in developer mode`
   - `system override`
   - Dangerous shell execution patterns (`rm -rf`, `sudo`, `curl | sh`, `format c:`)
3. **Response Action Permission Gates:** Any automated containment action suggested by the AI (e.g., `block_ip`, `isolate_host`) cannot be auto-executed. It must enter the **Response & Automation Center** requiring explicit cryptographic analyst approval.
4. **Offline Graceful Fallback:** If Ollama is offline or inaccessible, the frontend displays an informational offline banner. Inference never falls back silently to any cloud API.

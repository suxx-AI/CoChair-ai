<div align="center">
  <img src="CoChair.ai%20Logo.jpeg" alt="CoChair.ai Logo" width="280" />
  <h1>CoChair.ai</h1>
  <p><i>Zero-wake-word ambient listener and inferential decision engine</i></p>
</div>

## CoChair.ai — Executive Intelligence HUD

> An autonomous, zero-wake-word meeting intelligence HUD that listens silently to executive conversations, filters banter, and executes live SQL charts, parametric hypothesis tests, and predictive feasibility audits directly against relational data.

---

## Overview

Traditional AI meeting tools either flood leadership with unfocused transcripts hours after a call ends or require artificial wake-words that disrupt natural conversation. 

**CoChair.ai** acts as an ambient analytical partner in executive discussions. It streams live meeting audio, separates casual chatter from analytical inquiries in under 180ms, and dispatches queries directly against your business database without manual intervention.

Beyond descriptive totals, CoChair features an inferential decision engine that calculates two-sample t-tests and variance models on the fly to confirm whether observed differences represent true operational variance or random noise.

---

## Key Features

### 1. Dual Operational Modes
* **Ambient Meeting Mode (Zero Wake-Word):** Runs passively in the background. Streams live room audio, identifies query intent, and renders charts without interrupting conversational flow.
* **Normal Mode (Interactive Executive Analyst):** Desk-based interactive workspace for targeted drill-downs, hypothesis validation, and strategic benchmarking.

### 2. Low-Latency Ambient Guardrails
* **Sub-180ms Gatekeeper Filter:** Evaluates incoming speech chunks to distinguish casual banter (e.g., waiting for teammates, small talk) from analytical business questions, keeping the HUD dormant during off-topic dialogue.
* **Intelligent Echo-Loop Guard:** Detects when a speaker is reading numbers already rendered on screen, suppressing secondary trigger cascades.
* **Live Telemetry Stream:** Transparent real-time logs displaying gatekeeper classification confidence, API latency, and tool dispatch status.

### 3. Inferential Decision Engine & Predictive Audits
* **Parametric Hypothesis Testing:** Translates spoken comparative inquiries into backend t-test or ANOVA pipelines using SciPy.
* **Automated Statistical Takeaways:** Computes means, degrees of freedom, and p-values (alpha = 0.05) to output plain-English executive verdicts.
* **Predictive Goal Feasibility:** Audits spoken enterprise targets (e.g., quarterly revenue targets) against ground-truth database trajectories to surface volume gaps.

---

## Architecture Pipeline

```text
[ Acoustic Audio Stream (16kHz PCM) ]
                 │
                 ▼
[ AssemblyAI Universal-3.5 (Real-Time WebSockets) ]
                 │
                 ▼
[ Fast Gatekeeper Classifier (<180ms Intent Filter) ]
        │                                 │
 [ Casual Banter ]                 [ Business Query ]
        │                                 │
        ▼                                 ▼
   (Suppressed)              [ DeepSeek Reasoning Engine ]
                               (Text-to-SQL & Tool Router)
                                          │
                                          ▼
                             [ SQLite Database Engine ]
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
             [ Descriptive Aggregation ]         [ SciPy Statistical Test ]
                        │                                   │
                        └─────────────────┬─────────────────┘
                                          │
                                          ▼
                           [ React Executive HUD (Plotly) ]
```

---

## Tech Stack

* **Speech Streaming:** AssemblyAI Universal-3.5 (Real-time WebSocket transcription)
* **Reasoning Backbone:** DeepSeek V4-Flash via Fireworks AI
* **Orchestration:** LangChain / Python agent tool dispatch
* **Statistical Computation:** SciPy (Two-sample t-tests, distribution analysis)
* **Data Layer:** SQLite (Relational schema)
* **Frontend HUD:** React, TypeScript, Vite, Tailwind CSS, Plotly.js

---

## Quickstart Guide

### Prerequisites
* Python 3.10+
* Node.js 18+
* AssemblyAI API Key
* Fireworks AI API Key (for DeepSeek endpoint)

### 1. Repository Setup

```bash
git clone [https://github.com/your-username/cochair-ai.git](https://github.com/your-username/cochair-ai.git)
cd cochair-ai
```

### 2. Backend Installation & Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
ASSEMBLYAI_API_KEY="your_assemblyai_key"
FIREWORKS_API_KEY="your_fireworks_api_key"
DATABASE_PATH="database.db"
PORT=8000
```

Start the backend service:

```bash
python main.py
```

### 3. Frontend Installation & Setup

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to open the executive dashboard.

---

## Verified Demonstration Queries

| Mode | Voice Query | Pipeline Action | Expected Output |
| :--- | :--- | :--- | :--- |
| **Meeting** | *"Let's wait a minute until Alex joins. Did anyone watch the game?"* | Gatekeeper evaluates banter context. | `Trigger: False` (<180ms latency); screen stays dormant. |
| **Meeting** | *"Let's see our total sales across all product categories."* | Text-to-SQL generation and category revenue join. | Interactive Plotly horizontal/vertical bar chart. |
| **Meeting** | *"As we can see, Beverages and Dairy make up most of the sales."* | Echo filter detects active screen context. | `Trigger: False`; suppresses feedback loop. |
| **Normal** | *"Compare product prices between Beverages and Dairy using a t-test."* | Queries unit prices; executes two-sample t-test via SciPy | Displays statistical distribution, t-stat, p-value, and significance takeaway. |

---

## License

This project was built for the AssemblyAI Voice Agent Hackathon. Distributed under the MIT License.

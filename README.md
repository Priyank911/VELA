<table width="100%" border="0" cellspacing="0" cellpadding="0">
  <tr>
    <td width="110" align="left" valign="middle">
      <img src="./frontend/public/logo.png" alt="Vela Logo" width="90" />
    </td>
    <td align="left" valign="middle">
      <h1>VELA // THE AI CAREER AGENT</h1>
      <p><i>The autonomous career agent living in your terminal.</i></p>
    </td>
  </tr>
</table>

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-Frontend-111111?labelColor=1c1c1c&style=flat-square" alt="Frontend" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-111111?labelColor=1c1c1c&style=flat-square" alt="Backend" />
  <img src="https://img.shields.io/badge/Coral%20SQL-Database-111111?labelColor=1c1c1c&style=flat-square" alt="Database" />
  <img src="https://img.shields.io/badge/Python%203.11-Powered-111111?labelColor=1c1c1c&style=flat-square" alt="Python" />
  <img src="https://img.shields.io/badge/Zustand-State-111111?labelColor=1c1c1c&style=flat-square" alt="State" />
  <img src="https://img.shields.io/badge/React%20Flow-Visualizer-111111?labelColor=1c1c1c&style=flat-square" alt="Graph" />
</p>

Vela is an intelligent, autonomous career agent built to streamline your job search and professional networking. Rather than managing spreadsheets and dozens of tabs, Vela connects directly to your data sources—like Gmail, Google Calendar, Notion, and Job boards—via **Coral SQL**. You simply tell Vela what you want to achieve, and it reasons through the necessary steps to fetch jobs, analyze your resume, and draft personalized outreach.

---

## System Architecture

Vela operates on a dynamic tool-calling loop. When a user provides a prompt, the intelligence engine determines the exact sequence of tools needed, generating SQL on-the-fly to extract data from disconnected sources using Coral SQL.

```mermaid
graph TD
    %% Styling
    classDef user fill:#0a0a0a,stroke:#ff8200,stroke-width:2px,color:#ff8200
    classDef agent fill:#1a1a1a,stroke:#00e5ff,stroke-width:2px,color:#00e5ff
    classDef coral fill:#111111,stroke:#22c55e,stroke-width:2px,color:#22c55e
    classDef data fill:#050505,stroke:#4a4a4a,stroke-width:1px,color:#a0a0a0
    classDef ui fill:#111111,stroke:#ff8200,stroke-width:1px,color:#ffa940,stroke-dasharray: 5 5

    %% Nodes
    A[User Prompt]:::user --> B(Vela Agent Engine):::agent
    B --> C{Tool Selector}:::agent
    
    C -->|Translates to SQL| D[Coral SQL Engine]:::coral
    C -->|CRUD Operations| E[(Persistent Memory DB)]:::data
    
    D --> F[(Jobs.Listings)]:::data
    D --> G[(Gmail.Inbox)]:::data
    D --> H[(Notion.Pages)]:::data
    D --> I[(Calendar.Events)]:::data

    B -.->|Server-Sent Events| J[React Flow Reasoning Graph]:::ui
    B -.->|Streaming Text| K[Terminal Chat UI]:::ui
```

---

## Technical Stack

Vela was designed from the ground up for high performance, real-time visualization, and seamless data integration.

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | `Next.js`, `React`, `TailwindCSS` | Delivers a high-performance, retro-terminal aesthetic interface. |
| **State & Graph** | `Zustand`, `React Flow`, `Dagre` | Manages global app state and auto-layouts the live reasoning graph. |
| **Backend API** | `FastAPI`, `Uvicorn`, `Python` | Powers the async tool loop and streams SSE data back to the client. |
| **Data Engine** | `Coral SQL` | Acts as the universal translation layer to query disconnected APIs via SQL. |
| **Persistence** | `SQLite` / `AioSQLite` | Stores user memories, preferences, and application tracking data locally. |
| **Intelligence** | `Gemini` / `Claude` | Powers the agentic reasoning, tool selection, and natural language synthesis. |

---

## Core Capabilities

- **Agentic Reasoning Engine**  
  Vela executes multiple tools in a single turn. For instance, asking to "draft an email for a backend role at Stripe" prompts the agent to search the job database, extract company details, and synthesize a personalized draft—all entirely autonomously.

- **Coral SQL Integration**  
  Data retrieval is exclusively powered by Coral SQL. Whether it's querying `jobs.listings` for new opportunities or `gmail.inbox` for recruiter responses, Vela leverages raw SQL to pull precise, high-performance insights across different APIs.

- **Live Reasoning Graph**  
  Built with `@xyflow/react`, the application provides full transparency. As the agent plans and executes, nodes populate dynamically. You literally watch the AI "think" and route data from Coral SQL directly to your screen in real time.

- **Resume Analysis & Optimization**  
  Upload your resume directly into the chat. Vela sanitizes the text, stores it securely, and cross-references it against live job descriptions to highlight keyword gaps and suggest targeted rewrites.

- **Persistent Memory & Tracking**  
  Vela remembers everything. Using the built-in `store_memory` and `track_application` tools, it logs your career goals, deadlines, and application statuses. This context is injected into every conversation, ensuring Vela acts as a true long-term companion.

---

## The Future of Vela

Vela was built to prove that job searching doesn't have to be a scattered, exhausting process. By combining autonomous agentic reasoning with the universal query power of Coral SQL, we've created a centralized command center for your career.

In future iterations, we plan to expand the connector ecosystem, allowing Vela to automate application submissions directly, auto-schedule interviews via direct calendar integration, and utilize voice-based interactions for hands-free interview preparation. 

*Stop managing spreadsheets. Start commanding your career.*

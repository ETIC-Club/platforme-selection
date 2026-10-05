"use client";

import React, { useState, useCallback } from "react";

// ────────────────────────────────────────────────────────────────
// /dev/api-tester — Isolated page to manually test every API
// endpoint. Plain styling, no shared components or layouts used.
// ────────────────────────────────────────────────────────────────

interface ApiResult {
  status: number;
  body: unknown;
  timestamp: string;
}

function useApi() {
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const call = useCallback(
    async (url: string, method: string, body?: unknown) => {
      setLoading(true);
      setResult(null);
      try {
        const opts: RequestInit = {
          method,
          headers: { "Content-Type": "application/json" },
        };
        if (body !== undefined) {
          opts.body = JSON.stringify(body);
        }
        const res = await fetch(url, opts);
        let json: unknown;
        try {
          json = await res.json();
        } catch {
          json = { _rawText: "Could not parse JSON response" };
        }
        setResult({
          status: res.status,
          body: json,
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (err: unknown) {
        setResult({
          status: 0,
          body: {
            _networkError:
              err instanceof Error ? err.message : "Unknown error",
          },
          timestamp: new Date().toLocaleTimeString(),
        });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { result, loading, call };
}

/* ================================================================
   Tiny form components — each one tests one endpoint
   ================================================================ */

function ListEvents() {
  const { result, loading, call } = useApi();
  return (
    <Section title="GET /api/events" subtitle="List events">
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          disabled={loading}
          onClick={() => call("/api/events?all=true", "GET")}
          style={btnStyle}
        >
          {loading ? "Loading…" : "Send GET (?all=true — Raw CRUD)"}
        </button>
        <button
          disabled={loading}
          onClick={() => call("/api/events", "GET")}
          style={{ ...btnStyle, backgroundColor: "#6c757d" }}
        >
          {loading ? "Loading…" : "Send GET (Default — Dashboard View)"}
        </button>
      </div>
      <ResultBox result={result} />
    </Section>
  );
}

function CreateEvent() {
  const { result, loading, call } = useApi();
  const [name, setName] = useState("Test Event");
  const [quota, setQuota] = useState("30");
  const [desc, setDesc] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [nbRh, setNbRh] = useState("0");
  const [nbTech, setNbTech] = useState("0");

  const submit = () => {
    const body: Record<string, unknown> = {
      name,
      quotaParticipants: Number(quota),
    };
    if (desc) body.description = desc;
    if (sheetUrl) body.googleSheetUrl = sheetUrl;
    if (nbRh !== "0") body.nbEvalRh = Number(nbRh);
    if (nbTech !== "0") body.nbEvalTechnique = Number(nbTech);
    call("/api/events", "POST", body);
  };

  return (
    <Section title="POST /api/events" subtitle="Create a new event">
      <label style={labelStyle}>
        Name*
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Quota*
        <input value={quota} onChange={(e) => setQuota(e.target.value)} type="number" style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Description
        <input value={desc} onChange={(e) => setDesc(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Google Sheet URL
        <input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        nbEvalRh
        <input value={nbRh} onChange={(e) => setNbRh(e.target.value)} type="number" style={inputStyle} />
      </label>
      <label style={labelStyle}>
        nbEvalTechnique
        <input value={nbTech} onChange={(e) => setNbTech(e.target.value)} type="number" style={inputStyle} />
      </label>
      <button disabled={loading} onClick={submit} style={btnStyle}>
        {loading ? "Sending…" : "Create Event"}
      </button>
      <ResultBox result={result} />
    </Section>
  );
}

function GetEvent() {
  const { result, loading, call } = useApi();
  const [id, setId] = useState("1");
  return (
    <Section title="GET /api/events/[id]" subtitle="Fetch a single event">
      <label style={labelStyle}>
        Event ID
        <input value={id} onChange={(e) => setId(e.target.value)} style={inputStyle} />
      </label>
      <button
        disabled={loading}
        onClick={() => call(`/api/events/${id}`, "GET")}
        style={btnStyle}
      >
        {loading ? "Loading…" : "Fetch Event"}
      </button>
      <ResultBox result={result} />
    </Section>
  );
}

function PatchEvent() {
  const { result, loading, call } = useApi();
  const [id, setId] = useState("1");
  const [rawBody, setRawBody] = useState('{ "name": "Updated Name" }');

  const submit = () => {
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      alert("Invalid JSON body");
      return;
    }
    call(`/api/events/${id}`, "PATCH", body);
  };

  return (
    <Section
      title="PATCH /api/events/[id]"
      subtitle='Update event. Send {"status":"termine"} to close.'
    >
      <label style={labelStyle}>
        Event ID
        <input value={id} onChange={(e) => setId(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        JSON Body
        <textarea
          value={rawBody}
          onChange={(e) => setRawBody(e.target.value)}
          rows={4}
          style={{ ...inputStyle, fontFamily: "monospace" }}
        />
      </label>
      <button disabled={loading} onClick={submit} style={btnStyle}>
        {loading ? "Sending…" : "Patch Event"}
      </button>
      <ResultBox result={result} />
    </Section>
  );
}

function DeleteEvent() {
  const { result, loading, call } = useApi();
  const [id, setId] = useState("1");
  return (
    <Section title="DELETE /api/events/[id]" subtitle="Delete an event">
      <label style={labelStyle}>
        Event ID
        <input value={id} onChange={(e) => setId(e.target.value)} style={inputStyle} />
      </label>
      <button
        disabled={loading}
        onClick={() => call(`/api/events/${id}`, "DELETE")}
        style={{ ...btnStyle, backgroundColor: "#c0392b" }}
      >
        {loading ? "Deleting…" : "Delete Event"}
      </button>
      <ResultBox result={result} />
    </Section>
  );
}

function ListSelectors() {
  const { result, loading, call } = useApi();
  const [eventId, setEventId] = useState("1");
  return (
    <Section
      title="GET /api/events/[id]/selectors"
      subtitle="List selectors for an event"
    >
      <label style={labelStyle}>
        Event ID
        <input value={eventId} onChange={(e) => setEventId(e.target.value)} style={inputStyle} />
      </label>
      <button
        disabled={loading}
        onClick={() => call(`/api/events/${eventId}/selectors`, "GET")}
        style={btnStyle}
      >
        {loading ? "Loading…" : "List Selectors"}
      </button>
      <ResultBox result={result} />
    </Section>
  );
}

function CreateSelector() {
  const { result, loading, call } = useApi();
  const [eventId, setEventId] = useState("1");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<"RH" | "Technique">("RH");

  return (
    <Section
      title="POST /api/events/[id]/selectors"
      subtitle="Add a selector (user by email)"
    >
      <label style={labelStyle}>
        Event ID
        <input value={eventId} onChange={(e) => setEventId(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        User Email
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Selector Type
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "RH" | "Technique")}
          style={inputStyle}
        >
          <option value="RH">RH</option>
          <option value="Technique">Technique</option>
        </select>
      </label>
      <button
        disabled={loading}
        onClick={() =>
          call(`/api/events/${eventId}/selectors`, "POST", {
            email,
            selectorType: type,
          })
        }
        style={btnStyle}
      >
        {loading ? "Sending…" : "Add Selector"}
      </button>
      <ResultBox result={result} />
    </Section>
  );
}

function PatchSelector() {
  const { result, loading, call } = useApi();
  const [eventId, setEventId] = useState("1");
  const [selectorId, setSelectorId] = useState("1");
  const [rawBody, setRawBody] = useState('{ "selectorType": "Technique" }');

  const submit = () => {
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      alert("Invalid JSON body");
      return;
    }
    call(`/api/events/${eventId}/selectors/${selectorId}`, "PATCH", body);
  };

  return (
    <Section
      title="PATCH /api/events/[id]/selectors/[selectorId]"
      subtitle="Update a selector"
    >
      <label style={labelStyle}>
        Event ID
        <input value={eventId} onChange={(e) => setEventId(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Selector ID
        <input
          value={selectorId}
          onChange={(e) => setSelectorId(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label style={labelStyle}>
        JSON Body
        <textarea
          value={rawBody}
          onChange={(e) => setRawBody(e.target.value)}
          rows={3}
          style={{ ...inputStyle, fontFamily: "monospace" }}
        />
      </label>
      <button disabled={loading} onClick={submit} style={btnStyle}>
        {loading ? "Sending…" : "Patch Selector"}
      </button>
      <ResultBox result={result} />
    </Section>
  );
}

function DeleteSelector() {
  const { result, loading, call } = useApi();
  const [eventId, setEventId] = useState("1");
  const [selectorId, setSelectorId] = useState("1");

  return (
    <Section
      title="DELETE /api/events/[id]/selectors/[selectorId]"
      subtitle="Deactivate a selector (soft-delete → isActive=false)"
    >
      <label style={labelStyle}>
        Event ID
        <input value={eventId} onChange={(e) => setEventId(e.target.value)} style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Selector ID
        <input
          value={selectorId}
          onChange={(e) => setSelectorId(e.target.value)}
          style={inputStyle}
        />
      </label>
      <button
        disabled={loading}
        onClick={() =>
          call(`/api/events/${eventId}/selectors/${selectorId}`, "DELETE")
        }
        style={{ ...btnStyle, backgroundColor: "#c0392b" }}
      >
        {loading ? "Deleting…" : "Deactivate Selector"}
      </button>
      <ResultBox result={result} />
    </Section>
  );
}

/* ================================================================
   Layout helpers
   ================================================================ */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div style={sectionStyle}>
      <h3 style={{ margin: 0, fontFamily: "monospace" }}>{title}</h3>
      <p style={{ margin: "4px 0 12px", color: "#888", fontSize: 13 }}>
        {subtitle}
      </p>
      {children}
    </div>
  );
}

function ResultBox({ result }: { result: ApiResult | null }) {
  if (!result) return null;
  const isError = result.status >= 400 || result.status === 0;
  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 6,
        backgroundColor: isError ? "#2d1517" : "#0d1f0d",
        border: `1px solid ${isError ? "#6b2c2e" : "#1e4620"}`,
        fontFamily: "monospace",
        fontSize: 13,
        overflowX: "auto",
      }}
    >
      <div style={{ marginBottom: 6, color: "#aaa" }}>
        <strong>Status:</strong>{" "}
        <span style={{ color: isError ? "#e74c3c" : "#2ecc71" }}>
          {result.status}
        </span>{" "}
        — {result.timestamp}
      </div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#ddd" }}>
        {JSON.stringify(result.body, null, 2)}
      </pre>
    </div>
  );
}

/* ================================================================
   Inline styles (plain, no CSS modules or tailwind)
   ================================================================ */

const sectionStyle: React.CSSProperties = {
  padding: 20,
  marginBottom: 16,
  borderRadius: 8,
  backgroundColor: "#1a1a2e",
  border: "1px solid #333",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "8px 10px",
  marginTop: 4,
  borderRadius: 4,
  border: "1px solid #444",
  backgroundColor: "#111",
  color: "#eee",
  fontSize: 14,
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 10,
  color: "#ccc",
  fontSize: 13,
};

const btnStyle: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 6,
  border: "none",
  backgroundColor: "#2980b9",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
};

/* ================================================================
   Page
   ================================================================ */

export default function ApiTesterPage() {
  return (
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "32px 20px",
        backgroundColor: "#0f0f23",
        minHeight: "100vh",
        color: "#eee",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 4 }}>
        🧪 API Tester
      </h1>
      <p
        style={{
          textAlign: "center",
          color: "#888",
          marginBottom: 32,
          fontSize: 14,
        }}
      >
        Dev-only page — calls every backend endpoint and displays raw JSON
        responses.
      </p>

      <h2 style={headingStyle}>Events</h2>
      <ListEvents />
      <CreateEvent />
      <GetEvent />
      <PatchEvent />
      <DeleteEvent />

      <h2 style={headingStyle}>Selectors</h2>
      <ListSelectors />
      <CreateSelector />
      <PatchSelector />
      <DeleteSelector />
    </div>
  );
}

const headingStyle: React.CSSProperties = {
  borderBottom: "1px solid #333",
  paddingBottom: 8,
  marginTop: 36,
  marginBottom: 16,
  color: "#aaa",
  fontSize: 16,
  textTransform: "uppercase",
  letterSpacing: 2,
};

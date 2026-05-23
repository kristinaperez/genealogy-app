import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PersonResult {
  name: string;
  status: "imported" | "updated" | "not_found" | "error";
  wikidata_id?: string;
  confidence?: number;
  city_name?: string;
  error?: string;
}

interface ImportResponse {
  total: number;
  success: number;
  not_found: number;
  errors: number;
  results: PersonResult[];
}

// ─── Status helpers ────────────────────────────────────────────────────────────

const STATUS_META = {
  imported:  { label: "Импортирован",  color: "#2ecc71", symbol: "✦" },
  updated:   { label: "Обновлён",      color: "#3498db", symbol: "↻" },
  not_found: { label: "Не найден",     color: "#e67e22", symbol: "◌" },
  error:     { label: "Ошибка",        color: "#e74c3c", symbol: "✕" },
} as const;

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.9 ? "#2ecc71" : value >= 0.75 ? "#f39c12" : "#e74c3c";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 4, background: "#2a2a2a", borderRadius: 2, overflow: "hidden"
      }}>
        <div style={{
          width: `${pct}%`, height: "100%", background: color,
          transition: "width 0.6s ease",
        }} />
      </div>
      <span style={{ fontSize: 11, color: "#888", minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

// ─── Row in results table ──────────────────────────────────────────────────────

function ResultRow({ r, idx }: { r: PersonResult; idx: number }) {
  const meta = STATUS_META[r.status];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 130px 1fr 120px",
      gap: 12,
      padding: "10px 16px",
      borderBottom: "1px solid #1e1e1e",
      animationDelay: `${idx * 40}ms`,
      animation: "fadeIn 0.35s ease both",
    }}>
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: "#f0e6d3" }}>
          {r.name}
        </div>
        {r.city_name && (
          <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
            📍 {r.city_name}
          </div>
        )}
        {r.error && (
          <div style={{ fontSize: 11, color: "#e74c3c", marginTop: 2 }}>{r.error}</div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: meta.color, fontSize: 16 }}>{meta.symbol}</span>
        <span style={{ fontSize: 12, color: meta.color }}>{meta.label}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        {r.confidence != null
          ? <ConfidenceBar value={r.confidence} />
          : <span style={{ color: "#444", fontSize: 12 }}>—</span>
        }
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        {r.wikidata_id
          ? (
            <a
              href={`https://www.wikidata.org/wiki/${r.wikidata_id}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11, color: "#7f8c8d", textDecoration: "none" }}
            >
              {r.wikidata_id} ↗
            </a>
          )
          : <span style={{ color: "#333", fontSize: 12 }}>—</span>
        }
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function FamousPeopleImport() {
  const [text, setText] = useState(
    "Pablo Picasso\nFederico García Lorca\nSalvador Dalí"
  );
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ImportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    const names = text
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    if (!names.length) return;

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/import-famous-people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResponse(await res.json());
    } catch (e: any) {
      setError(e.message ?? "Ошибка запроса");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#f0e6d3",
        fontFamily: "'JetBrains Mono', monospace",
        padding: "40px 32px",
      }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#555", marginBottom: 8 }}>
            GENEALOGÍA ESPAÑOLA — ADMIN
          </div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 36,
            fontWeight: 600,
            margin: 0,
            color: "#f0e6d3",
            letterSpacing: "-0.5px",
          }}>
            Импорт известных испанцев
          </h1>
          <div style={{ width: 48, height: 1, background: "#c0a060", marginTop: 12 }} />
        </div>

        {/* Input area */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 24,
          marginBottom: 32,
        }}>
          <div>
            <label style={{ fontSize: 11, letterSpacing: 2, color: "#666", display: "block", marginBottom: 8 }}>
              СПИСОК ИМЁН (по одному на строку)
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              style={{
                width: "100%",
                background: "#111",
                border: "1px solid #222",
                borderRadius: 2,
                color: "#f0e6d3",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                lineHeight: 1.7,
                padding: "14px 16px",
                resize: "vertical",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={e => (e.target.style.borderColor = "#c0a060")}
              onBlur={e  => (e.target.style.borderColor = "#222")}
            />
            <div style={{ fontSize: 11, color: "#444", marginTop: 6 }}>
              {text.split("\n").filter(s => s.trim()).length} имён
            </div>
          </div>

          {/* Sidebar with button + tips */}
          <div style={{ paddingTop: 28 }}>
            <button
              onClick={handleImport}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px 0",
                background: loading ? "#1a1a1a" : "#c0a060",
                color: loading ? "#444" : "#0d0d0d",
                border: "none",
                borderRadius: 2,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: 1,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              {loading && (
                <span style={{
                  width: 14, height: 14, border: "2px solid #444",
                  borderTopColor: "#c0a060", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                }} />
              )}
              {loading ? "ИМПОРТ..." : "ЗАПУСТИТЬ ИМПОРТ"}
            </button>

            <div style={{
              marginTop: 24,
              padding: "16px",
              background: "#111",
              border: "1px solid #1e1e1e",
              borderRadius: 2,
            }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#555", marginBottom: 12 }}>
                АЛГОРИТМ
              </div>
              {[
                "Поиск в Wikidata",
                "Верификация (≥ 0.75)",
                "Загрузка биографии",
                "Создание города",
                "Привязка person → city",
              ].map((step, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  fontSize: 11, color: "#555", marginBottom: 8,
                }}>
                  <span style={{ color: "#c0a060", flexShrink: 0 }}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            padding: "12px 16px", background: "#1a0a0a",
            border: "1px solid #e74c3c", borderRadius: 2,
            color: "#e74c3c", fontSize: 13, marginBottom: 24,
          }}>
            ✕ {error}
          </div>
        )}

        {/* Results */}
        {response && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            {/* Summary pills */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              {[
                { label: "Всего",        value: response.total,     color: "#f0e6d3" },
                { label: "Успешно",      value: response.success,   color: "#2ecc71" },
                { label: "Не найдено",   value: response.not_found, color: "#e67e22" },
                { label: "Ошибок",       value: response.errors,    color: "#e74c3c" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  padding: "8px 20px",
                  border: `1px solid ${color}22`,
                  borderRadius: 2,
                  background: `${color}08`,
                }}>
                  <div style={{ fontSize: 22, color, fontFamily: "'Cormorant Garamond', serif" }}>
                    {value}
                  </div>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginTop: 2 }}>
                    {label.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>

            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 130px 1fr 120px",
              gap: 12,
              padding: "8px 16px",
              borderBottom: "1px solid #222",
              fontSize: 10,
              letterSpacing: 2,
              color: "#444",
            }}>
              <span>ПЕРСОНА</span>
              <span>СТАТУС</span>
              <span>УВЕРЕННОСТЬ</span>
              <span>WIKIDATA</span>
            </div>

            {response.results.map((r, i) => (
              <ResultRow key={r.name + i} r={r} idx={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}


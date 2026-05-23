/**
 * PersonCard — компактная карточка-превью для списков, поиска, карточки города.
 * Не содержит логики редактирования/удаления — только отображение.
 *
 * Использование:
 *   <PersonCard personId={42} />
 *   <PersonCard personId={42} onClick={() => navigate(`/persons/${42}`)} />
 */

import { useEffect, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface City {
  id: number;
  name: string;
  province?: string;
  coat_of_arms_url?: string;
}

interface Person {
  id: number;
  wikidata_id: string;
  full_name: string;
  birth_date?: string;
  death_date?: string;
  occupation?: string;
  summary_es?: string;
  main_image_url?: string;
  source_url?: string;
  birth_city?: City;
}

interface PersonCardProps {
  personId: number;
  /** Если передан — карточка становится кликабельной */
  onClick?: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatYear(iso?: string): string | null {
  const m = iso?.match(/^(\d{4})/);
  return m ? m[1] : null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Skeleton({ height, width = "100%" }: { height: number; width?: string }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: "var(--border-radius-sm)",
        background: "var(--color-background-secondary)",
        animation: "skPulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

function BirthInfo({
  city,
  birthYear,
  deathYear,
}: {
  city?: City;
  birthYear: string | null;
  deathYear: string | null;
}) {
  if (!city && !birthYear) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
      {(birthYear || deathYear) && (
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-tertiary)" }}>
          {birthYear && `р. ${birthYear}`}
          {deathYear && ` · † ${deathYear}`}
        </p>
      )}
      {city && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {city.coat_of_arms_url ? (
            <img
              src={city.coat_of_arms_url}
              alt=""
              style={{ width: 14, height: 14, objectFit: "contain" }}
            />
          ) : (
            <span style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>📍</span>
          )}
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
            {city.name}
            {city.province ? `, ${city.province}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function PersonCard({ personId, onClick }: PersonCardProps) {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setImgError(false);
    fetch(`/api/persons/${personId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setPerson)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [personId]);

  const cardStyle: React.CSSProperties = {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "1rem 1.25rem",
    maxWidth: 420,
    cursor: onClick ? "pointer" : "default",
    transition: "border-color 0.15s",
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={cardStyle}>
        <style>{`@keyframes skPulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
        <div style={{ display: "flex", gap: 20 }}>
          <div
            style={{
              width: 96,
              height: 120,
              borderRadius: "var(--border-radius-md)",
              background: "var(--color-background-secondary)",
              animation: "skPulse 1.4s ease-in-out infinite",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
            <Skeleton height={22} width="70%" />
            <Skeleton height={13} width="40%" />
            <Skeleton height={13} width="55%" />
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton height={13} />
          <Skeleton height={13} />
          <Skeleton height={13} width="80%" />
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !person) {
    return (
      <div style={{ ...cardStyle, borderColor: "var(--color-border-danger)" }}>
        <p style={{ color: "var(--color-text-danger)", fontSize: 13, margin: 0 }}>
          No se ha podido cargar el perfil #{personId}
          {error ? `: ${error}` : ""}
        </p>
      </div>
    );
  }

  // ── Content ──────────────────────────────────────────────────────────────────
  const birthYear = formatYear(person.birth_date);
  const deathYear = formatYear(person.death_date);
  const showInitials = !person.main_image_url || imgError;
  const initials = getInitials(person.full_name);

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick)
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "var(--color-border-primary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "var(--color-border-tertiary)";
      }}
    >
      <style>{`@keyframes skPulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* Photo / Initials + Name block */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {showInitials ? (
          <div
            style={{
              width: 96,
              height: 120,
              borderRadius: "var(--border-radius-md)",
              background: "var(--color-background-info)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 500,
              color: "var(--color-text-info)",
              flexShrink: 0,
              letterSpacing: 1,
            }}
          >
            {initials}
          </div>
        ) : (
          <img
            src={person.main_image_url}
            alt={person.full_name}
            onError={() => setImgError(true)}
            style={{
              width: 96,
              height: 120,
              objectFit: "cover",
              borderRadius: "var(--border-radius-md)",
              flexShrink: 0,
              border: "0.5px solid var(--color-border-tertiary)",
            }}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 500, lineHeight: 1.3 }}>
            {person.full_name}
          </h2>
          {person.occupation && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--color-text-secondary)",
                fontStyle: "italic",
              }}
            >
              {person.occupation}
            </p>
          )}
          <BirthInfo city={person.birth_city} birthYear={birthYear} deathYear={deathYear} />
        </div>
      </div>

      {/* Summary */}
      {person.summary_es && (
        <div
          style={{
            borderTop: "0.5px solid var(--color-border-tertiary)",
            marginTop: 16,
            paddingTop: 14,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--color-text-secondary)",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {person.summary_es}
          </p>
        </div>
      )}

      {/* Wikipedia link */}
      {person.source_url && (
        <div style={{ marginTop: 14 }}>
          <a
            href={person.source_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 12, color: "var(--color-text-tertiary)", textDecoration: "none" }}
          >
            Wikipedia ES ↗
          </a>
        </div>
      )}
    </div>
  );
}


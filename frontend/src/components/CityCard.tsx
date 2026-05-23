import { useEffect, useState } from "react";

interface FamousPerson {
  id: number;
  full_name: string;
  occupation?: string;
  main_image_url?: string;
  birth_date?: string;
  death_date?: string;
}

interface City {
  id: number;
  wikidata_id: string;
  name: string;
  province?: string;
  region?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  coat_of_arms_url?: string;
  hero_image_url?: string;
  famous_people: FamousPerson[];
}

interface CityCardProps {
  cityId: number;
  onPersonClick?: (personId: number) => void;
}

function formatYear(iso?: string) {
  return iso ? iso.slice(0, 4) : null;
}

function getInitials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

function PersonRow({ person, onClick }: { person: FamousPerson; onClick?: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  const showAvatar = !person.main_image_url || imgErr;
  const initials = getInitials(person.full_name);
  const birth = formatYear(person.birth_date);
  const death = formatYear(person.death_date);
  const years = birth ? (death ? `${birth}–${death}` : `н. ${birth}`) : null;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 0",
        borderBottom: "0.5px solid var(--color-border-tertiary)",
        cursor: onClick ? "pointer" : "default",
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLDivElement).style.background = "var(--color-background-secondary)")}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
    >
      {showAvatar ? (
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--color-background-info)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 500, color: "var(--color-text-info)",
          flexShrink: 0,
        }}>{initials}</div>
      ) : (
        <img src={person.main_image_url} alt={person.full_name}
          onError={() => setImgErr(true)}
          style={{
            width: 44, height: 44, borderRadius: "50%",
            objectFit: "cover", flexShrink: 0,
            border: "0.5px solid var(--color-border-tertiary)",
          }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
          {person.full_name}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          {person.occupation && (
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              {person.occupation}
            </span>
          )}
          {years && (
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontVariantNumeric: "tabular-nums" }}>
              {years}
            </span>
          )}
        </div>
      </div>
      {onClick && (
        <span style={{ fontSize: 16, color: "var(--color-text-tertiary)", flexShrink: 0 }}>›</span>
      )}
    </div>
  );
}

function Skeleton({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div style={{
      width, height, borderRadius: 4,
      background: "var(--color-background-secondary)",
      animation: "skPulse 1.4s ease-in-out infinite",
    }} />
  );
}

export default function CityCard({ cityId, onPersonClick }: CityCardProps) {
  const [city, setCity] = useState<City | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroErr, setHeroErr] = useState(false);
  const [armsErr, setArmsErr] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setHeroErr(false);
    setArmsErr(false);
    fetch(`/api/cities/${cityId}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setCity)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [cityId]);

  const cardStyle: React.CSSProperties = {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    overflow: "hidden",
    maxWidth: 480,
  };

  if (loading) return (
    <div style={cardStyle}>
      <style>{`@keyframes skPulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      <div style={{ height: 140, background: "var(--color-background-secondary)", animation: "skPulse 1.4s ease-in-out infinite" }} />
      <div style={{ padding: "1rem 1.25rem" }}>
        <Skeleton height={22} width="55%" />
        <div style={{ marginTop: 8 }}><Skeleton height={13} width="35%" /></div>
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--color-background-secondary)", animation: "skPulse 1.4s ease-in-out infinite", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton height={14} width="65%" />
                <Skeleton height={12} width="40%" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error || !city) return (
    <div style={{ ...cardStyle, padding: "1rem 1.25rem", borderColor: "var(--color-border-danger)" }}>
      <p style={{ color: "var(--color-text-danger)", fontSize: 13, margin: 0 }}>
        No se ha podido cargar la ciudad #{cityId}{error ? `: ${error}` : ""}
      </p>
    </div>
  );

  const showHero = city.hero_image_url && !heroErr;
  const showArms = city.coat_of_arms_url && !armsErr;
  const locationParts = [city.province, city.region].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div style={cardStyle}>
      <style>{`@keyframes skPulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>

      {/* Hero image */}
      {showHero ? (
        <div style={{ position: "relative", height: 160 }}>
          <img src={city.hero_image_url} alt={city.name}
            onError={() => setHeroErr(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.55) 100%)",
          }} />
        </div>
      ) : (
        <div style={{ height: 8, background: "var(--color-background-secondary)" }} />
      )}

      {/* Body */}
      <div style={{ padding: "1rem 1.25rem" }}>

        {/* City name + coat of arms */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{city.name}</h2>
            {locationParts.length > 0 && (
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-secondary)" }}>
                {locationParts.join(", ")}
              </p>
            )}
          </div>
          {showArms && (
            <img src={city.coat_of_arms_url} alt={`Герб ${city.name}`}
              onError={() => setArmsErr(true)}
              style={{ height: 48, objectFit: "contain", flexShrink: 0 }} />
          )}
        </div>

        {/* Coordinates pill */}
        {city.latitude != null && city.longitude != null && (
          <div style={{ marginTop: 10 }}>
            <a
              href={`https://www.openstreetmap.org/?mlat=${city.latitude}&mlon=${city.longitude}&zoom=12`}
              target="_blank" rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, color: "var(--color-text-tertiary)", textDecoration: "none",
              }}
            >
              📍 {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)} ↗
            </a>
          </div>
        )}

        {/* Famous people */}
        {city.famous_people.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 500, color: "var(--color-text-secondary)", letterSpacing: 1, textTransform: "uppercase" }}>
              Известные уроженцы
            </h3>
            <div style={{ marginTop: 4 }}>
              {city.famous_people.map(p => (
                <PersonRow
                  key={p.id}
                  person={p}
                  onClick={onPersonClick ? () => onPersonClick(p.id) : undefined}
                />
              ))}
            </div>
          </div>
        )}

        {city.famous_people.length === 0 && (
          <p style={{ marginTop: 20, fontSize: 13, color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
            Aún no se han añadido personajes famosos nacidos en esta localidad
          </p>
        )}
      </div>
    </div>
  );
}


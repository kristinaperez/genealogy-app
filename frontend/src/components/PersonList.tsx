import { useEffect, useState } from "react";
import { api } from "../api";
import type { Person } from "../api";

interface Props {
  onSelect: (id: number) => void;
  onAdd: () => void;
}

function getInitials(p: Person): string {
  const parts = (p.full_name ?? "").trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(d: string | null | undefined): number | null {
  if (!d) return null;
  const year = new Date(d).getFullYear();
  return isNaN(year) ? null : year;
}

export default function PersonList({ onSelect }: Props) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .listPersons()
      .then(setPersons)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = persons.filter((p) => {
    const q = query.toLowerCase();
    return (p.full_name ?? "").toLowerCase().includes(q);
  });

  if (loading) return <div className="state-msg">Загрузка…</div>;
  if (error) return <div className="state-msg error">Error: {error}</div>;

  return (
    <div className="person-list-page">
      <div className="list-header">
        <h1 className="list-title">
          Todos las personas
          <span className="list-count">{persons.length}</span>
        </h1>
        <input
          className="search-input"
          type="search"
          placeholder="Buscar por nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div className="state-msg">No se ha encontrado a nadie</div>
      )}

      <ul className="person-grid">
        {filtered.map((p) => (
          <li key={p.id} className="person-card" onClick={() => onSelect(p.id)}>
            <div className="card-photo">
              {p.main_image_url ? (
                <img src={p.main_image_url} alt={p.full_name ?? ""} />
              ) : (
                <span className="card-initials">{getInitials(p)}</span>
              )}
            </div>
            <div className="card-info">
              <span className="card-name">{p.full_name ?? "—"}</span>
              {(p.birth_date || p.death_date) && (
                <span className="card-dates">
                  {formatDate(p.birth_date) ?? "?"}
                  {p.death_date ? ` — ${formatDate(p.death_date)}` : ""}
                </span>
              )}
            </div>
            <span className="card-arrow">→</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

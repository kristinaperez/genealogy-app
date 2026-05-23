import { useEffect, useState } from "react";
import { api } from "../api";
import type { Person } from "../api";

interface Props {
  onSelect: (id: number) => void;
  onAdd: () => void;
}

function initials(p: Person) {
  return (p.first_name[0] + p.last_name[0]).toUpperCase();
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).getFullYear();
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
    return (
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q)
    );
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
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.first_name} />
              ) : (
                <span className="card-initials">{initials(p)}</span>
              )}
            </div>
            <div className="card-info">
              <span className="card-name">
                {p.first_name} {p.last_name}
              </span>
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


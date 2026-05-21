import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../api";
import type { Person, RelativeInfo, RelationType } from "../api";

interface Props {
  id: number;
  onBack: () => void;
  onEdit: (id: number) => void;
  onSelect: (id: number) => void;
}

const ROLE_LABEL: Record<RelationType, string> = {
  parent: "Родители",
  child:  "Дети",
  spouse: "Супруг(а)",
};

function formatFullDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function PersonCard({ id, onBack, onEdit, onSelect }: Props) {
  const [person,     setPerson]     = useState<Person | null>(null);
  const [relatives,  setRelatives]  = useState<RelativeInfo[]>([]);
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [addRole,    setAddRole]    = useState<RelationType | null>(null);
  const [pickedId,   setPickedId]   = useState<number | "">("");
  const [linking,    setLinking]    = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [p, rels] = await Promise.all([
      api.getPerson(id),
      api.getRelatives(id),
    ]);
    setPerson(p);
    setRelatives(rels);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    load().catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [load]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !person) return;
    setUploading(true);
    try {
      const updated = await api.uploadPhoto(person.id, file);
      setPerson(updated);
    } catch (e: any) {
      alert("Ошибка загрузки: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!person) return;
    if (!confirm(`Удалить ${person.first_name} ${person.last_name}?`)) return;
    setDeleting(true);
    try {
      await api.deletePerson(person.id);
      onBack();
    } catch (e: any) {
      alert("Ошибка удаления: " + e.message);
      setDeleting(false);
    }
  }

  async function openAddPanel(role: RelationType) {
    setAddRole(role);
    setPickedId("");
    const all = await api.listPersons();
    const relIds = new Set([id, ...relatives.map((r) => r.id)]);
    setAllPersons(all.filter((p) => !relIds.has(p.id)));
  }

  async function handleLink() {
    if (!pickedId || !addRole || !person) return;
    setLinking(true);
    try {
      if (addRole === "child") {
        await api.createRelationship({ person_a: person.id, person_b: Number(pickedId), type: "parent" });
      } else if (addRole === "parent") {
        await api.createRelationship({ person_a: Number(pickedId), person_b: person.id, type: "parent" });
      } else {
        await api.createRelationship({ person_a: person.id, person_b: Number(pickedId), type: "spouse" });
      }
      setAddRole(null);
      await load();
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setLinking(false);
    }
  }

  if (loading) return <div className="state-msg">Загрузка…</div>;
  if (error || !person) return <div className="state-msg error">Ошибка: {error ?? "not found"}</div>;

  const initials = (person.first_name[0] + person.last_name[0]).toUpperCase();
  const groups: RelationType[] = ["parent", "spouse", "child"];

  return (
    <div className="person-detail-page">
      <button className="btn-back" onClick={onBack}>← Назад</button>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-photo" onClick={() => fileRef.current?.click()} title="Изменить фото">
          {person.photo_url
            ? <img src={person.photo_url} alt={person.first_name} />
            : <span className="detail-initials">{initials}</span>}
          <div className="photo-overlay">{uploading ? "Загрузка…" : "Изменить фото"}</div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />

        <div className="detail-identity">
          <h1 className="detail-name">{person.first_name} {person.last_name}</h1>
          <div className="detail-lifespan">
            <span>р. {formatFullDate(person.birth_date)}</span>
            {person.death_date && <span>† {formatFullDate(person.death_date)}</span>}
          </div>
        </div>
      </div>

      {/* Биография */}
      {person.bio && (
        <section className="detail-section">
          <h2 className="section-title">Биография</h2>
          <p className="detail-bio">{person.bio}</p>
        </section>
      )}

      {/* Родственники */}
      <section className="detail-section">
        <h2 className="section-title">Родственники</h2>

        {groups.map((role) => {
          const group = relatives.filter((r) => r.role === role);
          if (group.length === 0) return null;
          return (
            <div key={role} className="rel-group">
              <span className="rel-group-label">{ROLE_LABEL[role]}</span>
              <div className="rel-chips">
                {group.map((r) => (
                  <button key={r.id} className="rel-chip" onClick={() => onSelect(r.id)}>
                    <div className="chip-avatar">
                      {r.photo_url
                        ? <img src={r.photo_url} alt={r.first_name} />
                        : <span>{(r.first_name[0] + r.last_name[0]).toUpperCase()}</span>}
                    </div>
                    {r.first_name} {r.last_name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Панель добавления */}
        {addRole === null ? (
          <div className="relatives-placeholder">
            <button className="btn-rel" onClick={() => openAddPanel("parent")}>+ Родитель</button>
            <button className="btn-rel" onClick={() => openAddPanel("child")}>+ Ребёнок</button>
            <button className="btn-rel" onClick={() => openAddPanel("spouse")}>+ Супруг(а)</button>
          </div>
        ) : (
          <div className="add-rel-panel">
            <span className="add-rel-label">
              Добавить {addRole === "parent" ? "родителя" : addRole === "child" ? "ребёнка" : "супруга"}:
            </span>
            <select
              className="rel-select"
              value={pickedId}
              onChange={(e) => setPickedId(Number(e.target.value))}
            >
              <option value="">— выберите человека —</option>
              {allPersons.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
            <div className="add-rel-actions">
              <button className="btn-rel" onClick={() => setAddRole(null)}>Отмена</button>
              <button className="btn-save" onClick={handleLink} disabled={!pickedId || linking}>
                {linking ? "Сохранение…" : "Связать"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Действия */}
      <div className="detail-actions">
        <button className="btn-edit" onClick={() => onEdit(person.id)}>Редактировать</button>
        <button className="btn-delete" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Удаление…" : "Удалить"}
        </button>
      </div>
    </div>
  );
}


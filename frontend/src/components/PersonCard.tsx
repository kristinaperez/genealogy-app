import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { Person } from "../api";

interface Props {
  id: number;
  onBack: () => void;
  onEdit: (id: number) => void;
}

function formatFullDate(d: string | null) {
  if (!d) return "—";

  return new Date(d).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PersonCard({
  id,
  onBack,
  onEdit,
}: Props) {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    api
      .getPerson(id)
      .then(setPerson)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePhotoChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
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

    const confirmed = confirm(
      `Удалить ${person.first_name} ${person.last_name}?`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      await api.deletePerson(person.id);
      onBack();
    } catch (e: any) {
      alert("Ошибка удаления: " + e.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="state-msg">Загрузка…</div>;
  }

  if (error || !person) {
    return (
      <div className="state-msg error">
        Ошибка: {error ?? "person not found"}
      </div>
    );
  }

  const initials = (
    person.first_name[0] + person.last_name[0]
  ).toUpperCase();

  return (
    <div className="person-detail-page">
      <button className="btn-back" onClick={onBack}>
        ← Назад
      </button>

      <div className="detail-hero">
        <div
          className="detail-photo"
          onClick={() => fileRef.current?.click()}
          title="Нажмите, чтобы изменить фото"
        >
          {person.photo_url ? (
            <img
              src={person.photo_url}
              alt={person.first_name}
            />
          ) : (
            <span className="detail-initials">
              {initials}
            </span>
          )}

          <div className="photo-overlay">
            {uploading ? "Загрузка…" : "Изменить фото"}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handlePhotoChange}
        />

        <div className="detail-identity">
          <h1 className="detail-name">
            {person.first_name} {person.last_name}
          </h1>

          <div className="detail-lifespan">
            <span>
              р. {formatFullDate(person.birth_date)}
            </span>

            {person.death_date && (
              <span>
                † {formatFullDate(person.death_date)}
              </span>
            )}
          </div>
        </div>
      </div>

      {person.bio && (
        <section className="detail-section">
          <h2 className="section-title">
            Биография
          </h2>

          <p className="detail-bio">
            {person.bio}
          </p>
        </section>
      )}

      <section className="detail-section">
        <h2 className="section-title">
          Родственники
        </h2>

        <div className="relatives-placeholder">
          <button className="btn-rel">
            + Добавить родителя
          </button>

          <button className="btn-rel">
            + Добавить ребёнка
          </button>

          <button className="btn-rel">
            + Добавить супруга
          </button>
        </div>
      </section>

      <div className="detail-actions">
        <button
          className="btn-edit"
          onClick={() => onEdit(person.id)}
        >
          Редактировать
        </button>

        <button
          className="btn-delete"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Удаление…" : "Удалить"}
        </button>
      </div>
    </div>
  );
}

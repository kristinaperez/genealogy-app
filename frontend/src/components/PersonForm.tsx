import { useEffect, useState } from "react";
import { api } from "../api";
import type  { PersonPayload } from "../api";

interface Props {
  editId?: number;
  onBack: () => void;
  onSaved: (id: number) => void;
}

const EMPTY: PersonPayload = {
  first_name: "",
  last_name: "",
  birth_date: null,
  death_date: null,
  bio: null,
};

export type PersonPayload = {
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  death_date?: string | null;
  bio?: string | null;
};

export default function PersonForm({ editId, onBack, onSaved }: Props) {
  const [form, setForm] = useState<PersonPayload>(EMPTY);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PersonPayload, string>>>({});

  useEffect(() => {
    if (!editId) return;
    api
      .getPerson(editId)
      .then((p) =>
        setForm({
          first_name: p.first_name,
          last_name: p.last_name,
          birth_date: p.birth_date,
          death_date: p.death_date,
          bio: p.bio,
        })
      )
      .finally(() => setLoading(false));
  }, [editId]);

  function set(field: keyof PersonPayload, value: string) {
    setForm((f) => ({ ...f, [field]: value || null }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.first_name.trim()) e.first_name = "Введите имя";
    if (!form.last_name.trim()) e.last_name = "Введите фамилию";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const person = editId
        ? await api.updatePerson(editId, form)
        : await api.createPerson(form);
      onSaved(person.id);
    } catch (e: any) {
      alert("Ошибка сохранения: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="state-msg">Загрузка…</div>;

  return (
    <div className="form-page">
      <button className="btn-back" onClick={onBack}>
        ← Назад
      </button>

      <h1 className="form-title">
        {editId ? "Редактировать" : "Новый человек"}
      </h1>

      <form className="person-form" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="form-field">
            <label>Имя *</label>
            <input
              value={form.first_name ?? ""}
              onChange={(e) => set("first_name", e.target.value)}
              placeholder="Иван"
              className={errors.first_name ? "input-error" : ""}
            />
            {errors.first_name && (
              <span className="field-error">{errors.first_name}</span>
            )}
          </div>

          <div className="form-field">
            <label>Фамилия *</label>
            <input
              value={form.last_name ?? ""}
              onChange={(e) => set("last_name", e.target.value)}
              placeholder="Петров"
              className={errors.last_name ? "input-error" : ""}
            />
            {errors.last_name && (
              <span className="field-error">{errors.last_name}</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Дата рождения</label>
            <input
              type="date"
              value={form.birth_date ?? ""}
              onChange={(e) => set("birth_date", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Дата смерти</label>
            <input
              type="date"
              value={form.death_date ?? ""}
              onChange={(e) => set("death_date", e.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <label>Биография</label>
          <textarea
            value={form.bio ?? ""}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Краткая биография…"
            rows={5}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onBack}>
            Отмена
          </button>
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? "Сохранение…" : editId ? "Сохранить" : "Создать"}
          </button>
        </div>
      </form>
    </div>
  );
}


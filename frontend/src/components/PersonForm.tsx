import { useEffect, useState } from "react";
import { api } from "../api";
import type { PersonPayload } from "../api";

interface Props {
  editId?: number;
  onBack: () => void;
  onSaved: (id: number) => void;
}

const EMPTY: PersonPayload = {
  full_name: "",
  birth_date: null,
  death_date: null,
  occupation: null,
  summary_es: null,
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
          full_name: p.full_name ?? "",
          birth_date: p.birth_date ?? null,
          death_date: p.death_date ?? null,
          occupation: p.occupation ?? null,
          summary_es: p.summary_es ?? null,
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
    if (!form.full_name?.trim()) e.full_name = "Escribe el nombre completo";
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
      alert("Error al guardar: " + e.message);
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
        {editId ? "Editar" : "La persona nueva"}
      </h1>

      <form className="person-form" onSubmit={handleSubmit} noValidate>

        <div className="form-field">
          <label>Nombre completo *</label>
          <input
            value={form.full_name ?? ""}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Pablo Picasso"
            className={errors.full_name ? "input-error" : ""}
          />
          {errors.full_name && (
            <span className="field-error">{errors.full_name}</span>
          )}
        </div>

        <div className="form-field">
          <label>Ocupación</label>
          <input
            value={form.occupation ?? ""}
            onChange={(e) => set("occupation", e.target.value)}
            placeholder="Pintor, escritor…"
          />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label>Fecha de nacimiento</label>
            <input
              type="date"
              value={form.birth_date ?? ""}
              onChange={(e) => set("birth_date", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Fecha de defunción</label>
            <input
              type="date"
              value={form.death_date ?? ""}
              onChange={(e) => set("death_date", e.target.value)}
            />
          </div>
        </div>

        <div className="form-field">
          <label>Biografía</label>
          <textarea
            value={form.summary_es ?? ""}
            onChange={(e) => set("summary_es", e.target.value)}
            placeholder="Breve biografía…"
            rows={5}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onBack}>
            Cancelación
          </button>
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? "Conservación…" : editId ? "Guardar" : "Crear"}
          </button>
        </div>
      </form>
    </div>
  );
}

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type Person = {
  id: number;
  wikidata_id: string;
  full_name?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  occupation?: string | null;
  summary_es?: string | null;
  main_image_url?: string | null;
  source_url?: string | null;
  confidence_score?: number | null;
};

export type PersonPayload = {
  full_name?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  occupation?: string | null;
  summary_es?: string | null;
  main_image_url?: string | null;
};


export type RelationType = "parent" | "child" | "spouse";
 
export interface RelativeInfo {
  id: number;
  full_name?: string | null;
  main_image_url?: string | null;
  role: RelationType;
}
 
export interface RelationshipPayload {
  person_a: number;
  person_b: number;
  type: RelationType;
}
 
export interface RelationshipResponse {
  id: number;
  person_a: number;
  person_b: number;
  type: RelationType;
}
 
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}


export const api = {
  async listPersons(): Promise<Person[]> {
    const res = await fetch(`${BASE}/api/persons/`);

    if (!res.ok) {
      throw new Error("Failed to fetch persons");
    }

    return res.json();
  },

  async getPerson(id: number): Promise<Person> {
    const res = await fetch(`${BASE}/api/persons/${id}`);

    if (!res.ok) {
      throw new Error("Failed to fetch person");
    }

    return res.json();
  },

async createPerson(data: PersonPayload): Promise<Person> {
    const res = await fetch(`${BASE}/api/persons/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Failed to create person");
    }

    return res.json();
  },

  async updatePerson(id: number, data: PersonPayload): Promise<Person> {
    const res = await fetch(`${BASE}/api/persons/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Failed to update person");
    }

    return res.json();
  },

  async deletePerson(id: number): Promise<void> {
    const res = await fetch(`${BASE}/api/persons/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete person");
    }
  },
  
  uploadPhoto: async (id: number, file: File): Promise<Person> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/api/persons/${id}/photo`, {
      method: "POST", body: form,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  
  // ── Relationships ─────────────────────────────────────────────────────────
  listRelationships: () => req<RelationshipResponse[]>("/api/relationships/"),
  getRelatives: (personId: number) =>
    req<RelativeInfo[]>(`/api/relationships/person/${personId}`),
  createRelationship: (data: RelationshipPayload) =>
    req<RelationshipResponse>("/api/relationships/", {
      method: "POST", body: JSON.stringify(data),
    }),
  deleteRelationship: (id: number) =>
    req<void>(`/api/relationships/${id}`, { method: "DELETE" }),
};

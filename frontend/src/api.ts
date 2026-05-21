const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type Person = {
  id: number;
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  death_date?: string | null;
  bio?: string | null;
  photo_url?: string | null;
};

export type PersonPayload = {
  first_name: string;
  last_name: string;
  birth_date?: string | null;
  death_date?: string | null;
  bio?: string | null;
};


export type RelationType = "parent" | "child" | "spouse";
 
export interface RelativeInfo {
  id: number;
  first_name: string;
  last_name: string;
  photo_url: string | null;
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
    const res = await fetch(`${BASE}/persons/`);

    if (!res.ok) {
      throw new Error("Failed to fetch persons");
    }

    return res.json();
  },

  async getPerson(id: number): Promise<Person> {
    const res = await fetch(`${BASE}/persons/${id}`);

    if (!res.ok) {
      throw new Error("Failed to fetch person");
    }

    return res.json();
  },

async createPerson(data: PersonPayload): Promise<Person> {
    const res = await fetch(`${BASE}/persons/`, {
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
    const res = await fetch(`${BASE}/persons/${id}`, {
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
    const res = await fetch(`${BASE}/persons/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete person");
    }
  },
  
  uploadPhoto: async (id: number, file: File): Promise<Person> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/persons/${id}/photo`, {
      method: "POST", body: form,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  },

  
  // ── Relationships ─────────────────────────────────────────────────────────
  listRelationships: () => req<RelationshipResponse[]>("/relationships/"),
  getRelatives: (personId: number) =>
    req<RelativeInfo[]>(`/relationships/person/${personId}`),
  createRelationship: (data: RelationshipPayload) =>
    req<RelationshipResponse>("/relationships/", {
      method: "POST", body: JSON.stringify(data),
    }),
  deleteRelationship: (id: number) =>
    req<void>(`/relationships/${id}`, { method: "DELETE" }),
};

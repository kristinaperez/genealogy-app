import { useState } from "react";
import PersonList from "./components/PersonList";
import PersonCard from "./components/PersonCard";
import PersonForm from "./components/PersonForm";
import "./App.css";

export type View =
  | { type: "list" }
  | { type: "card"; id: number }
  | { type: "form"; editId?: number };

export default function App() {
  const [view, setView] = useState<View>({ type: "list" });

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <button className="logo" onClick={() => setView({ type: "list" })}>
            <span className="logo-icon">✦</span>
            <span className="logo-text">Родословная</span>
          </button>
          <button
            className="btn-add"
            onClick={() => setView({ type: "form" })}
          >
            + Добавить
          </button>
        </div>
      </header>

      <main className="app-main">
        {view.type === "list" && (
          <PersonList
            onSelect={(id) => setView({ type: "card", id })}
            onAdd={() => setView({ type: "form" })}
          />
        )}
        {view.type === "card" && (
          <PersonCard
            id={view.id}
            onBack={() => setView({ type: "list" })}
            onEdit={(id) => setView({ type: "form", editId: id })}
          />
        )}
        {view.type === "form" && (
          <PersonForm
            editId={view.editId}
            onBack={() => setView({ type: "list" })}
            onSaved={(id) => setView({ type: "card", id })}
          />
        )}
      </main>
    </div>
  );
}


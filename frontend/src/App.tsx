import { useState } from "react";
import PersonList from "./components/PersonList";
import PersonCard from "./components/PersonCard";
import PersonForm from "./components/PersonForm";
import FamilyTree from "./components/FamilyTree";
import "./App.css";

type Tab = "list" | "tree";

export type View =
  | { type: "list" }
  | { type: "card"; id: number }
  | { type: "form"; editId?: number; from?: Tab };

export default function App() {
  const [view, setView] = useState<View>({ type: "list" });
  const [activeTab,  setActiveTab]  = useState<Tab>("list");

function goTab(tab: Tab) {
    setActiveTab(tab);
    setView({ type: tab === "list" ? "list" : "list", ...(tab === "tree" ? { type: "tree" as any } : {}) });
    if (tab === "list") setView({ type: "list" });
    if (tab === "tree") setView({ type: "tree" as any });
  }

  function openCard(id: number) {
    setView({ type: "card", id, from: activeTab });
  }

  function goBack() {
    const from = (view as any).from ?? activeTab;
    if (from === "tree") { setView({ type: "tree" as any }); setActiveTab("tree"); }
    else                 { setView({ type: "list" });         setActiveTab("list"); }
  }

  const showTabs = view.type === "list" || (view as any).type === "tree";

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <button className="logo" onClick={() => goTab(activeTab)}>
            <span className="logo-icon">✦</span>
            <span className="logo-text">Родословная</span>
          </button>

          <nav className="tab-nav">
            <button
              className={`tab-btn ${activeTab === "list" ? "tab-btn--active" : ""}`}
              onClick={() => goTab("list")}
            >
              Список
            </button>
            <button
              className={`tab-btn ${activeTab === "tree" ? "tab-btn--active" : ""}`}
              onClick={() => goTab("tree")}
            >
              Дерево
            </button>
          </nav>

          <button className="btn-add" onClick={() => setView({ type: "form", from: activeTab })}>
            + Добавить
          </button>
        </div>
      </header>

      <main className={`app-main ${(view as any).type === "tree" ? "app-main--tree" : ""}`}>
        {view.type === "list" && (
          <PersonList
            onSelect={openCard}
            onAdd={() => setView({ type: "form", from: "list" })}
          />
        )}
        {(view as any).type === "tree" && (
          <FamilyTree onSelect={openCard} />
        )}
        {view.type === "card" && (
          <PersonCard
            id={view.id}
            onBack={goBack}
            onEdit={(id) => setView({ type: "form", editId: id, from: (view as any).from })}
            onSelect={openCard}
          />
        )}
        {view.type === "form" && (
          <PersonForm
            editId={view.editId}
            onBack={goBack}
            onSaved={(id) => setView({ type: "card", id, from: (view as any).from })}
          />
        )}
      </main>
    </div>
  );
}


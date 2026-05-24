import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import type { Person } from "../api";

interface Props {
  data: { person: Person };
  selected: boolean;
}

function initials(p: Person) {
  const name = p.full_name ?? "";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function lifeYears(p: Person) {
  const b = p.birth_date ? new Date(p.birth_date).getFullYear() : "?";
  const d = p.death_date ? new Date(p.death_date).getFullYear() : "";
  return d ? `${b} — ${d}` : `р. ${b}`;
}

// Разбиваем полное имя на строки по 2 слова
function formatName(fullName: string): string[] {
  const parts = fullName.trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    lines.push(parts.slice(i, i + 2).join(" "));
  }
  return lines;
}

function PersonNode({ data: { person }, selected }: Props) {
  const [hovered, setHovered] = useState(false);
  const expanded = selected || hovered;
  const nameLines = formatName(person.full_name ?? "—");

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        className={`pnode ${selected ? "pnode--selected" : ""} ${expanded ? "pnode--expanded" : ""}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="pnode-avatar">
          {person.main_image_url
            ? <img src={person.main_image_url} alt={person.full_name ?? ""} />
            : <span className="pnode-initials">{initials(person)}</span>}
        </div>
        <div className="pnode-info">
          {expanded ? (
            <span className="pnode-name pnode-name--full">
              {nameLines.map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}
            </span>
          ) : (
            <span className="pnode-name pnode-name--short">
              {nameLines[0] ?? "—"}
            </span>
          )}
          {person.birth_date && (
            <span className="pnode-years">{lifeYears(person)}</span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
}

export default memo(PersonNode);

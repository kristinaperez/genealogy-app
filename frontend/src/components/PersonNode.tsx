import { memo } from "react";
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
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0][0]}. ${parts[1]}`;
  if (parts.length === 3) return `${parts[0][0]}. ${parts[1][0]}. ${parts[2]}`;
  // 4 и больше: первые два — инициалы, третье — полное
  return `${parts[0][0]}. ${parts[1][0]}. ${parts[2]}`;
}

function lifeYears(p: Person) {
  const b = p.birth_date ? new Date(p.birth_date).getFullYear() : "?";
  const d = p.death_date ? new Date(p.death_date).getFullYear() : "";
  return d ? `${b} — ${d}` : `р. ${b}`;
}

function PersonNode({ data: { person }, selected }: Props) {
  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div className={`pnode ${selected ? "pnode--selected" : ""}`}>
        <div className="pnode-avatar">
          {person.main_image_url
            ? <img src={person.main_image_url} alt={person.full_name ?? ""} />
            : <span className="pnode-initials">{initials(person)}</span>}
        </div>
        <div className="pnode-info">
          <span className="pnode-name" title={person.full_name ?? ""}>
            {initials(person)}
          </span>
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

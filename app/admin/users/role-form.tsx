"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole } from "./actions";

export function UserRoleForm({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <select
      value={currentRole}
      disabled={pending}
      onChange={(e) => {
        const newRole = e.target.value;
        startTransition(async () => {
          await updateUserRole(userId, newRole);
          router.refresh();
        });
      }}
      style={{
        height: 30,
        padding: "0 8px",
        border: "1px solid var(--color-divider)",
        background: "var(--color-bg)",
        fontFamily: "var(--font-heading)",
        fontStyle: "italic",
        fontSize: 12,
        color: "var(--color-text)",
        borderRadius: 0,
        outline: "none",
      }}
    >
      <option value="customer">customer</option>
      <option value="admin">admin</option>
    </select>
  );
}

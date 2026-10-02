"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "./actions";

const STATUSES = ["pending", "paid", "shipped", "delivered", "canceled"] as const;

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <select
      value={currentStatus}
      disabled={pending}
      onChange={(e) => {
        const newStatus = e.target.value;
        startTransition(async () => {
          await updateOrderStatus(orderId, newStatus);
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
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

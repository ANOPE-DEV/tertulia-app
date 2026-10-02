"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct, deleteProduct } from "./actions";

type ProductInput = {
  id: string;
  cat: "queijos" | "vinhos" | "charutos" | "casa" | "kit";
  name: string;
  origin: string;
  price: number;
  old_price: number | null;
  unit: string;
  stock: number;
  badge: string | null;
  description: string;
  sommelier_note: string | null;
  active: boolean;
};

interface Props {
  initial?: ProductInput;
  mode: "create" | "edit";
}

const emptyProduct: ProductInput = {
  id: "",
  cat: "queijos",
  name: "",
  origin: "",
  price: 0,
  old_price: null,
  unit: "",
  stock: 0,
  badge: null,
  description: "",
  sommelier_note: null,
  active: true,
};

export function ProductForm({ initial, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProductInput>(initial ?? emptyProduct);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createProduct(form)
          : await updateProduct(form.id, form);
      if (!res.ok) {
        setError(res.error ?? "Erro ao salvar");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (!confirm("Desativar este produto? (soft-delete — histórico é preservado)")) return;
    startTransition(async () => {
      const res = await deleteProduct(form.id);
      if (!res.ok) {
        setError(res.error ?? "Erro ao excluir");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    });
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form-row">
        <div className="admin-field">
          <label>ID (slug único)</label>
          <input
            type="text"
            required
            disabled={mode === "edit"}
            value={form.id}
            onChange={(e) => set("id", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            placeholder="ex: barolo-2020"
          />
        </div>
        <div className="admin-field">
          <label>Categoria</label>
          <select
            value={form.cat}
            onChange={(e) => set("cat", e.target.value as ProductInput["cat"])}
          >
            <option value="queijos">Queijos</option>
            <option value="vinhos">Vinhos</option>
            <option value="charutos">Charutos</option>
            <option value="casa">Casa</option>
            <option value="kit">Kit</option>
          </select>
        </div>
      </div>

      <div className="admin-field">
        <label>Nome</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div className="admin-field">
        <label>Origem / região</label>
        <input
          type="text"
          required
          value={form.origin}
          onChange={(e) => set("origin", e.target.value)}
          placeholder="ex: Piemonte, Itália"
        />
      </div>

      <div className="admin-form-row">
        <div className="admin-field">
          <label>Preço (R$)</label>
          <input
            type="number"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="admin-field">
          <label>Preço "de" (opcional)</label>
          <input
            type="number"
            step="0.01"
            value={form.old_price ?? ""}
            onChange={(e) =>
              set("old_price", e.target.value ? parseFloat(e.target.value) : null)
            }
          />
        </div>
        <div className="admin-field">
          <label>Unidade</label>
          <input
            type="text"
            required
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
            placeholder="ex: 750 ml"
          />
        </div>
        <div className="admin-field">
          <label>Estoque</label>
          <input
            type="number"
            required
            value={form.stock}
            onChange={(e) => set("stock", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="admin-field">
        <label>Badge (opcional)</label>
        <input
          type="text"
          value={form.badge ?? ""}
          onChange={(e) => set("badge", e.target.value || null)}
          placeholder="ex: Sommelier indica, Lote limitado"
        />
      </div>

      <div className="admin-field">
        <label>Descrição</label>
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="admin-field">
        <label>Nota do sommelier (opcional)</label>
        <textarea
          rows={2}
          value={form.sommelier_note ?? ""}
          onChange={(e) => set("sommelier_note", e.target.value || null)}
          placeholder="ex: Decante uma hora antes de servir."
        />
      </div>

      <div className="admin-field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <input
          type="checkbox"
          id="active"
          checked={form.active}
          onChange={(e) => set("active", e.target.checked)}
          style={{ width: 18, height: 18 }}
        />
        <label htmlFor="active" style={{ letterSpacing: 0, fontSize: 13, textTransform: "none" }}>
          Ativo (visível na loja)
        </label>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-actions">
        <button type="submit" className="admin-btn admin-btn-primary" disabled={pending}>
          {pending ? "Salvando..." : mode === "create" ? "Criar produto" : "Salvar"}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => router.push("/admin/products")}
          disabled={pending}
        >
          Cancelar
        </button>
        {mode === "edit" && (
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={handleDelete}
            disabled={pending}
            style={{ marginLeft: "auto" }}
          >
            Desativar
          </button>
        )}
      </div>
    </form>
  );
}

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!product) notFound();

  return (
    <>
      <div className="admin-hd">
        <div className="admin-hd-l">
          <span className="admin-hd-kicker">Sortimento</span>
          <h1>Editar · {product.name}</h1>
        </div>
      </div>
      <ProductForm
        mode="edit"
        initial={{
          id: product.id,
          cat: product.cat,
          name: product.name,
          origin: product.origin,
          price: Number(product.price),
          old_price: product.old_price ? Number(product.old_price) : null,
          unit: product.unit,
          stock: product.stock,
          badge: product.badge,
          description: product.description,
          sommelier_note: product.sommelier_note,
          active: product.active,
        }}
      />
    </>
  );
}

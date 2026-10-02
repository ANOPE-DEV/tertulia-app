import { ProductForm } from "../product-form";

export const dynamic = "force-dynamic";

export default function NewProduct() {
  return (
    <>
      <div className="admin-hd">
        <div className="admin-hd-l">
          <span className="admin-hd-kicker">Sortimento</span>
          <h1>Novo produto</h1>
        </div>
      </div>
      <ProductForm mode="create" />
    </>
  );
}

import { redirect } from "next/navigation";

export default function AdminKits() {
  // Kits are just products with cat='kit'
  redirect("/admin/products?cat=kit");
}

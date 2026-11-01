import { PosTerminal } from "@/components/sales/pos-terminal";
import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SalesPosPage() {
  await requireAdmin();
  const products = await db.product.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  return <PosTerminal isAdmin products={products.map((product) => ({ id: product.id, sku: product.sku, name: product.name, description: product.description, price: Number(product.price), stock: product.stock }))} />;
}

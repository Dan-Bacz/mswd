"use server";

import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth/permissions";
import { z } from "zod";

const productSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required.").max(40),
  name: z.string().trim().min(2, "Product name is required.").max(120),
  description: z.string().trim().max(255).optional().or(z.literal("")),
  price: z.coerce.number().finite().positive("Price must be greater than zero."),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative."),
});

const checkoutSchema = z.object({
  cart: z.string().min(2),
  discount: z.coerce.number().finite().min(0).default(0),
  paymentMethod: z.enum(["CASH", "GCASH", "CARD", "OTHER"]),
  amountTendered: z.coerce.number().finite().min(0),
});

export type SalesActionState = { ok: boolean; message: string; receiptId?: string };

export async function createProductAction(
  _previousState: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  await requireAdmin();
  const parsed = productSchema.safeParse({
    sku: String(formData.get("sku") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    stock: String(formData.get("stock") ?? ""),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Review the product details." };

  try {
    await db.product.create({
      data: {
        sku: parsed.data.sku.toUpperCase(),
        name: parsed.data.name,
        description: parsed.data.description || null,
        price: parsed.data.price.toFixed(2),
        stock: parsed.data.stock,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, message: "That SKU already exists." };
    throw error;
  }
  revalidatePath("/admin/sales/pos");
  return { ok: true, message: "Product added to the POS catalog." };
}

export async function updateProductAction(
  _previousState: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  await requireAdmin();
  const id = String(formData.get("productId") ?? "").trim();
  const parsed = productSchema.safeParse({
    sku: String(formData.get("sku") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    stock: String(formData.get("stock") ?? ""),
  });
  if (!id || !parsed.success) return { ok: false, message: parsed.success ? "Product was not found." : parsed.error.issues[0]?.message ?? "Review the product details." };
  try {
    await db.product.update({ where: { id }, data: { sku: parsed.data.sku.toUpperCase(), name: parsed.data.name, description: parsed.data.description || null, price: parsed.data.price.toFixed(2), stock: parsed.data.stock } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, message: "That SKU already exists." };
    throw error;
  }
  revalidatePath("/admin/sales/pos");
  return { ok: true, message: "Product updated." };
}

export async function checkoutSaleAction(
  _previousState: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  const cashier = await requireAuth();
  const parsed = checkoutSchema.safeParse({
    cart: String(formData.get("cart") ?? ""),
    discount: String(formData.get("discount") ?? "0"),
    paymentMethod: String(formData.get("paymentMethod") ?? "CASH"),
    amountTendered: String(formData.get("amountTendered") ?? "0"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Review the payment details." };

  let requestedItems: Array<{ productId: string; quantity: number }>;
  try {
    const value: unknown = JSON.parse(parsed.data.cart);
    if (!Array.isArray(value)) throw new Error();
    requestedItems = value.map((item) => ({ productId: String(item.productId), quantity: Number(item.quantity) })).filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return { ok: false, message: "The cart is invalid. Please rebuild the order." };
  }
  if (requestedItems.length === 0) return { ok: false, message: "Add at least one product to the cart." };

  const quantities = new Map<string, number>();
  for (const item of requestedItems) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  const products = await db.product.findMany({ where: { id: { in: [...quantities.keys()] }, isActive: true } });
  if (products.length !== quantities.size) return { ok: false, message: "One or more products are no longer available." };
  for (const product of products) {
    const quantity = quantities.get(product.id) ?? 0;
    if (product.stock < quantity) return { ok: false, message: `${product.name} only has ${product.stock} in stock.` };
  }

  const subtotal = products.reduce((sum, product) => sum + Number(product.price) * (quantities.get(product.id) ?? 0), 0);
  if (parsed.data.discount > subtotal) return { ok: false, message: "Discount cannot be greater than the subtotal." };
  const total = subtotal - parsed.data.discount;
  const amountTendered = parsed.data.paymentMethod === "CASH" ? parsed.data.amountTendered : total;
  if (amountTendered < total) return { ok: false, message: "Amount tendered is not enough to complete the sale." };
  const changeAmount = amountTendered - total;
  const receiptNumber = `MSWD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;

  try {
    const sale = await db.$transaction(async (transaction) => {
      for (const product of products) {
        const result = await transaction.product.updateMany({ where: { id: product.id, isActive: true, stock: { gte: quantities.get(product.id) ?? 0 } }, data: { stock: { decrement: quantities.get(product.id) ?? 0 } } });
        if (result.count !== 1) throw new Error(`Stock changed for ${product.name}. Please refresh and try again.`);
      }
      return transaction.sale.create({
        data: {
          receiptNumber,
          subtotal: subtotal.toFixed(2),
          discount: parsed.data.discount.toFixed(2),
          total: total.toFixed(2),
          paymentMethod: parsed.data.paymentMethod,
          amountTendered: amountTendered.toFixed(2),
          changeAmount: changeAmount.toFixed(2),
          cashierId: cashier.id,
          items: {
            create: products.map((product) => {
              const quantity = quantities.get(product.id) ?? 0;
              return { productId: product.id, productName: product.name, sku: product.sku, quantity, unitPrice: Number(product.price).toFixed(2), lineTotal: (Number(product.price) * quantity).toFixed(2) };
            }),
          },
        },
        select: { id: true },
      });
    });
    revalidatePath("/admin/sales/pos");
    revalidatePath("/admin/sales/receipts");
    return { ok: true, message: `Sale completed. Receipt ${receiptNumber} is ready.`, receiptId: sale.id };
  } catch (error) {
    if (error instanceof Error && !(error instanceof Prisma.PrismaClientKnownRequestError)) return { ok: false, message: error.message };
    throw error;
  }
}

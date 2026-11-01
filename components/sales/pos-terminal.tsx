"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { Banknote, Calculator, CheckCircle2, PackagePlus, Plus, ReceiptText, Search, ShoppingCart, Trash2 } from "lucide-react";
import { checkoutSaleAction, createProductAction, type SalesActionState } from "@/app/actions/sales";
import { useRouter } from "next/navigation";

type Product = { id: string; sku: string; name: string; description: string | null; price: number; stock: number };
type CartItem = Product & { quantity: number };
const initialState: SalesActionState = { ok: true, message: "" };
const money = (value: number) => `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function PosTerminal({ products, isAdmin }: { products: Product[]; isAdmin: boolean }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountTendered, setAmountTendered] = useState(0);
  const [saleState, saleAction, salePending] = useActionState(checkoutSaleAction, initialState);
  const [productState, productAction, productPending] = useActionState(createProductAction, initialState);
  const filteredProducts = products.filter((product) => `${product.name} ${product.sku}`.toLowerCase().includes(query.toLowerCase()));
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, amountTendered - total);

  useEffect(() => { if (productState.ok && productState.message) router.refresh(); }, [productState, router]);

  function addProduct(product: Product) {
    if (product.stock < 1) return;
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item);
      return [...current, { ...product, quantity: 1 }];
    });
  }
  function updateQuantity(id: string, value: number) { setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.stock, value)) } : item)); }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <header className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-[#0B1A3E] to-[#0645AD] p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFD21F]">Sales terminal</p><h1 className="mt-1 text-3xl font-bold">Point of Sale</h1><p className="mt-1 text-sm text-blue-100">Select products, take payment, and issue a printable receipt.</p></div><Link href="/admin/sales/receipts" className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-semibold hover:bg-white/25"><ReceiptText className="h-4 w-4" /> Sales receipts</Link></header>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold text-[#0B1A3E]"><PackagePlus className="h-5 w-5 text-[#0645AD]" /> Product catalog</h2><p className="mt-1 text-xs text-slate-500">Tap a product to add it to the current order.</p></div><label className="relative block sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product or SKU" className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-sky-500" /></label></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filteredProducts.map((product) => <button key={product.id} type="button" onClick={() => addProduct(product)} disabled={product.stock < 1} className="group rounded-2xl border border-slate-200 p-4 text-left transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"><div className="flex items-start justify-between gap-2"><span className="rounded-lg bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700">{product.sku}</span><Plus className="h-4 w-4 text-sky-600 opacity-0 transition group-hover:opacity-100" /></div><p className="mt-3 font-semibold text-slate-900">{product.name}</p><p className="mt-1 text-lg font-bold text-[#0645AD]">{money(product.price)}</p><p className="mt-1 text-xs text-slate-500">{product.stock} in stock</p></button>)}</div>
          {filteredProducts.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No products match your search.</p>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold text-[#0B1A3E]"><ShoppingCart className="h-5 w-5 text-[#0645AD]" /> Current order <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{cart.length} items</span></h2><div className="mt-4 space-y-3">{cart.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-12 text-center"><ShoppingCart className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-600">Cart is empty</p><p className="mt-1 text-xs text-slate-400">Choose a product to begin a sale.</p></div> : cart.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{money(item.price)} each</p></div><input aria-label={`Quantity for ${item.name}`} type="number" min="1" max={item.stock} value={item.quantity} onChange={(event) => updateQuantity(item.id, Number(event.target.value))} className="h-9 w-16 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm" /><p className="w-20 text-right text-sm font-bold text-slate-800">{money(item.price * item.quantity)}</p><button type="button" onClick={() => setCart((current) => current.filter((cartItem) => cartItem.id !== item.id))} aria-label={`Remove ${item.name}`} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div>)}</div>
          <form action={saleAction} className="mt-5 border-t border-slate-200 pt-4"><input type="hidden" name="cart" value={JSON.stringify(cart.map((item) => ({ productId: item.id, quantity: item.quantity })))} /><div className="space-y-3"><div className="flex items-center justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-semibold text-slate-800">{money(subtotal)}</span></div><label className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-500">Discount</span><input name="discount" type="number" min="0" step="0.01" value={discount} onChange={(event) => setDiscount(Math.max(0, Number(event.target.value)))} className="h-9 w-32 rounded-lg border border-slate-200 px-2 text-right" /></label><div className="flex items-center justify-between border-t border-slate-200 pt-3 text-lg"><span className="font-bold text-slate-900">Total</span><span className="font-bold text-[#0645AD]">{money(total)}</span></div><label className="block text-sm font-medium text-slate-600">Payment method<select name="paymentMethod" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3"><option value="CASH">Cash</option><option value="GCASH">GCash</option><option value="CARD">Card</option><option value="OTHER">Other</option></select></label><label className="block text-sm font-medium text-slate-600">Amount tendered<input name="amountTendered" type="number" min={total} step="0.01" value={paymentMethod === "CASH" ? amountTendered : total} onChange={(event) => setAmountTendered(Math.max(0, Number(event.target.value)))} readOnly={paymentMethod !== "CASH"} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3" /></label><div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm"><span className="text-emerald-800">Change</span><span className="font-bold text-emerald-800">{money(change)}</span></div></div><button type="submit" disabled={salePending || cart.length === 0} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#168653] text-sm font-bold text-white shadow-sm hover:bg-[#127447] disabled:cursor-not-allowed disabled:opacity-50"><Banknote className="h-5 w-5" />{salePending ? "Processing..." : "Complete sale & generate receipt"}</button>{saleState.message && <div className={`mt-3 rounded-xl p-3 text-sm ${saleState.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{saleState.ok && <CheckCircle2 className="mr-1 inline h-4 w-4" />}{saleState.message}{saleState.receiptId && <Link href={`/admin/sales/receipts/${saleState.receiptId}`} className="ml-2 font-bold underline">Open receipt</Link>}</div>}</form>
        </section>
      </div>
      {isAdmin && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-lg font-bold text-[#0B1A3E]"><Calculator className="h-5 w-5 text-[#0645AD]" /> Add product to catalog</h2><form action={productAction} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><input name="sku" required placeholder="SKU" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input name="name" required placeholder="Product name" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input name="description" placeholder="Description" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><input name="price" required type="number" min="0.01" step="0.01" placeholder="Price" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /><div className="flex gap-2"><input name="stock" required type="number" min="0" step="1" placeholder="Stock" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm" /><button type="submit" disabled={productPending} className="inline-flex h-10 items-center gap-1 rounded-lg bg-[#0B1A3E] px-3 text-xs font-bold text-white hover:bg-[#172B4D]"><PackagePlus className="h-4 w-4" />Add</button></div></form>{productState.message && <p className={`mt-3 text-sm ${productState.ok ? "text-emerald-700" : "text-rose-700"}`}>{productState.message}</p>}</section>}
    </div>
  );
}

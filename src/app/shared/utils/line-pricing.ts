/**
 * Length-aware line pricing.
 *
 * Products sold by length (e.g. pipes) carry an optional `metres` value. When it
 * is set, the priced amount multiplies pieces AND metres:
 *   gross = unitPrice × quantity × metres        (e.g. 2 pcs × 6 m × ₹120/m)
 * Otherwise it is the normal piece pricing:
 *   gross = unitPrice × quantity
 * Unit price is always treated as the per-metre rate for length items.
 */
export function pricedUnits(quantity: number, meters?: number | null): number {
  return meters && meters > 0 ? quantity * meters : quantity;
}

/** Gross amount in paise (before discount) for a line. */
export function lineGross(unitPrice: number, quantity: number, meters?: number | null): number {
  return Math.round(unitPrice * pricedUnits(quantity, meters));
}

"""Node 3: Quotation Ingestion and Extraction Node."""

from datetime import date, timedelta
from decimal import Decimal
from typing import Any, Dict, List
from app.graphs.state import ProcurementEvaluationState


def quotation_node(state: ProcurementEvaluationState) -> Dict[str, Any]:
    """Ingest, extract, and normalize supplier quotations for shortlisted vendors."""
    existing_quotes = state.get("quotations", [])
    if existing_quotes and len(existing_quotes) > 0:
        return {
            "status": "EVALUATING",
            "quotations": existing_quotes,
        }

    shortlisted = state.get("shortlisted_vendors", [])
    spec = state.get("procurement_spec", {})
    budget_val = spec.get("budget_ceiling")
    budget = Decimal(str(budget_val)) if budget_val else Decimal("100000.00")
    target_date = spec.get("target_delivery_date") or str(date.today() + timedelta(days=30))

    quotations: List[Dict[str, Any]] = []

    for i, v in enumerate(shortlisted):
        v_id = v.get("vendor_id")
        v_name = v.get("vendor_name", f"Supplier {i+1}")

        # Check if real internet search pricing was already extracted
        if v.get("base_price"):
            base_price = Decimal(str(v["base_price"]))
            freight = Decimal(str(v.get("shipping_cost", "0.00")))
            tax = Decimal(str(v.get("tax_amount", (base_price * Decimal("0.05")).quantize(Decimal("0.01")))))
            discount = Decimal(str(v.get("discount_amount", "0.00")))
            warranty = int(v.get("warranty_months", 12))
            terms = "Instant Online Checkout / Credit Card"
        else:
            # Fallback for enterprise demo suppliers
            base_price = (budget * Decimal(str(0.85 + (i * 0.05)))).quantize(Decimal("0.01"))
            freight = Decimal("2500.00")
            tax = (base_price * Decimal("0.05")).quantize(Decimal("0.01"))
            discount = Decimal("1000.00")
            warranty = 24
            terms = "Net 30"

        delivery_days = int(v.get("delivery_days", 3))
        vendor_delivery_date = str(date.today() + timedelta(days=delivery_days))

        quotations.append({
            "vendor_id": v_id,
            "vendor_name": v_name,
            "base_price": str(base_price),
            "freight_cost": str(freight),
            "insurance_cost": "0.00" if v.get("base_price") else "500.00",
            "tax_amount": str(tax),
            "discount_amount": str(discount),
            "currency": spec.get("currency", "INR"),
            "quoted_delivery_date": vendor_delivery_date,
            "incoterms": "DDP",
            "payment_terms": terms,
            "warranty_months": warranty,
            "source_url": v.get("source_url", ""),
            "evidence_snippet": v.get("evidence_snippet", ""),
            "product_title": v.get("product_title", ""),
            "condition": v.get("condition", "Brand New"),
            "is_cheapest": v.get("is_cheapest", False),
        })

    return {
        "status": "EVALUATING",
        "quotations": quotations,
    }

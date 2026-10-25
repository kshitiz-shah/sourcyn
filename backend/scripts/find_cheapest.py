#!/usr/bin/env python3
"""CLI utility: Autonomous Multi-Agent Internet Price Hunter.

Performs requirement analysis, checks prices across the internet using multiple agents,
compares options deterministically, and finds the cheapest one on the internet.

Usage:
    python scripts/find_cheapest.py "Sony WH-1000XM5 headphones"
    python scripts/find_cheapest.py "MacBook Pro M3 16GB" --budget 1600
    python scripts/find_cheapest.py "iPhone 15 Pro 128GB" --currency USD
"""

import argparse
import os
import sys
from decimal import Decimal

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.coordinator_agent import coordinator


def run_price_hunter(query: str, budget: float = None, currency: str = "INR"):
    sym = "₹" if currency.upper() == "INR" else ("$" if currency.upper() == "USD" else ("€" if currency.upper() == "EUR" else ("£" if currency.upper() == "GBP" else currency + " ")))

    print("\n" + "=" * 76)
    print("  🌐 AUTONOMOUS MULTI-AGENT INTERNET PRICE HUNTER")
    print("  Live Web Search • Deterministic Normalization • Cheapest Price Finder")
    print("=" * 76 + "\n")

    print(f"🔎 [Agent 1: Requirement Analysis]")
    print(f"    Target Product / Spec: \"{query}\"")
    if budget:
        print(f"    Budget Ceiling:        {sym}{budget:,.2f} {currency}")
    print(f"    Target Currency:       {currency}")

    print(f"\n🌐 [Agents 2 & 3: Multi-Agent Parallel Internet Price Search]")
    if currency.upper() == "INR":
        print(f"    • Agent A (Indian Retail Giants): Scanning Flipkart, Amazon India, Croma, Reliance...")
        print(f"    • Agent B (Electronics Specialists): Scanning Sony Center (ShopAtSC), Vijay Sales, Tata CLiQ...")
        print(f"    • Agent C (Marketplace Bargains): Scanning Smartprix, 91Mobiles, Cashify, Gadgets360...")
    else:
        print(f"    • Agent A (Retail Giants): Scanning Amazon, Walmart, Best Buy, Target...")
        print(f"    • Agent B (Tech Specialists): Scanning B&H Photo, Newegg, Direct Stores...")
        print(f"    • Agent C (Marketplace Bargains): Scanning eBay, Refurbished Outlets...")

    result = coordinator.start_evaluation(
        raw_text=query,
        organization_id="00000000-0000-0000-0000-000000000001",
        budget_ceiling=budget,
        currency=currency,
    )

    sc = result.get("scorecard", {})
    scores = sc.get("scores", [])
    quotes = result.get("quotations", [])
    exp = result.get("decision_explanation", {})

    quote_map = {q.get("vendor_name"): q for q in quotes}

    print("\n" + "-" * 76)
    print("  📊 COMPARATIVE PRICE LEADERBOARD (RANKED BY CHEAPEST DELIVERED PRICE)")
    print("-" * 76)

    cheapest_vendor = None
    cheapest_price = None
    highest_price = None

    for i, s in enumerate(scores):
        v_name = s.get("vendor_name")
        rank = s.get("rank", i + 1)
        cost = Decimal(str(s.get("landed_cost_calculated", "0.00")))
        overall_score = s.get("overall_score", "0.00")
        is_winner = (rank == 1)

        if cheapest_price is None:
            cheapest_price = cost
            cheapest_vendor = v_name
        highest_price = cost

        q_info = quote_map.get(v_name, {})
        base_p = q_info.get("base_price", str(cost))
        ship_p = q_info.get("freight_cost", "0.00")
        src_url = q_info.get("source_url") or "https://www.google.co.in/search?q=" + query.replace(" ", "+")
        cond = q_info.get("condition", "Brand New")
        
        is_over_budget = budget and cost > Decimal(str(budget))
        if is_over_budget:
            badge = f"  ❌ [EXCEEDS BUDGET CEILING of {sym}{budget:,.2f}]"
        elif is_winner:
            badge = "  ⭐ [CHEAPEST ON THE INTERNET]"
        else:
            badge = ""

        print(f"\n  Rank #{rank}: {v_name:<26} | Total Price: {sym}{cost:>10.2f} {currency}{badge}")
        print(f"    • Base: {sym}{Decimal(base_p):>9.2f} | Shipping: {sym}{Decimal(ship_p):>5.2f} | Condition: {cond} | Score: {Decimal(overall_score):.1f}/100")
        print(f"    • Direct Link: {src_url}")

    if budget and cheapest_price and cheapest_price > Decimal(str(budget)):
        deficit = cheapest_price - Decimal(str(budget))
        print("\n" + "=" * 76)
        print("  ⚠️  NO RESULTS FOUND WITHIN THIS BUDGET:")
        print(f"     Budget Ceiling:   {sym}{budget:,.2f} {currency}")
        print(f"     Lowest Market:    {cheapest_vendor} at {sym}{cheapest_price:,.2f} {currency}")
        print(f"     Deficit:          Exceeds budget ceiling by {sym}{deficit:,.2f}")
        print("     Status:           No results on this budget. Please increase or remove ceiling.")
        print("=" * 76)
    elif cheapest_price and highest_price and highest_price > cheapest_price:
        savings = highest_price - cheapest_price
        pct = (savings / highest_price) * 100
        print("\n" + "=" * 76)
        print(f"  🏆 WINNER & BEST DEAL FOUND:")
        print(f"     Vendor:   {cheapest_vendor}")
        print(f"     Price:    {sym}{cheapest_price:,.2f} {currency}")
        print(f"     Savings:  Save {sym}{savings:,.2f} ({pct:.1f}%) compared to highest online store")
        print("=" * 76)

    print("\n🧠 [Agent 8: Decision Rationale]")
    print(f"    {exp.get('executive_summary', 'Evaluation complete.')}")
    if exp.get("winner_justification"):
        print(f"    {exp.get('winner_justification')}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Autonomous Multi-Agent Internet Price Hunter and Comparison Engine."
    )
    parser.add_argument("query", type=str, help="Product or requirement to search (e.g. 'Sony WH-1000XM5')")
    parser.add_argument("--budget", type=float, default=None, help="Optional budget ceiling")
    parser.add_argument("--currency", type=str, default="INR", help="Currency code (INR, USD, EUR, GBP, etc.)")

    args = parser.parse_args()
    run_price_hunter(args.query, budget=args.budget, currency=args.currency)


if __name__ == "__main__":
    main()

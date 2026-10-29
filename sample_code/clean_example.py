"""
Clean, PEP 8-compliant Python module with excellent maintainability.
Serves as reference baseline for high code quality.
"""

from typing import List, Dict, Optional


class OrderProcessor:
    """Processes customer orders and calculates tax-adjusted totals."""

    def __init__(self, tax_rate: float = 0.08) -> None:
        """Initialize processor with standard regional tax rate."""
        self.tax_rate = max(0.0, tax_rate)

    def calculate_subtotal(self, items: List[Dict[str, float]]) -> float:
        """Calculate line item subtotal before taxes."""
        return sum(item.get("price", 0.0) * item.get("quantity", 1) for item in items)

    def calculate_tax(self, subtotal: float) -> float:
        """Calculate tax on the given subtotal."""
        return round(subtotal * self.tax_rate, 2)

    def finalize_order(self, items: List[Dict[str, float]], discount: float = 0.0) -> Dict[str, float]:
        """Finalize total price with applied discount and tax calculation."""
        subtotal = self.calculate_subtotal(items)
        discounted = max(0.0, subtotal - discount)
        tax = self.calculate_tax(discounted)
        total = round(discounted + tax, 2)

        return {
            "subtotal": round(subtotal, 2),
            "discount": round(discount, 2),
            "tax": tax,
            "total": total,
        }

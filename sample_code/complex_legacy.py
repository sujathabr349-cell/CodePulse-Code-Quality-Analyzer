def process_transaction_tree(account, transaction, rules, flags, limits):
    """Legacy transaction handler with deep nesting and high cyclomatic complexity."""
    if account is not None:
        if account.get("is_active"):
            if transaction.get("amount") is not None:
                if transaction["amount"] > 0:
                    if rules.get("check_velocity"):
                        for rule in rules.get("list", []):
                            if rule.get("type") == "limit":
                                if transaction["amount"] > limits.get("daily", 1000):
                                    if flags.get("allow_override"):
                                        if account.get("tier") == "vip":
                                            return "VIP_APPROVED"
                                        else:
                                            return "OVERRIDE_REJECTED"
                                    else:
                                        return "LIMIT_EXCEEDED"
                                elif transaction["amount"] > limits.get("single", 500):
                                    return "SINGLE_LIMIT_EXCEEDED"
                            elif rule.get("type") == "fraud":
                                if rule.get("risk_score", 0) > 80:
                                    return "HIGH_FRAUD_RISK"
                    else:
                        return "RULES_DISABLED"
                else:
                    return "INVALID_AMOUNT"
            else:
                return "MISSING_AMOUNT"
        else:
            return "ACCOUNT_INACTIVE"
    return "INVALID_ACCOUNT"

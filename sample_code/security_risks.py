"""
Insecure patterns demonstration: dynamic code execution, mutable state leakage.
"""

def dynamic_runner(untrusted_payload):
    # Security risk: direct eval of untrusted input
    computed = eval(untrusted_payload)
    return computed

def register_session(user_id, active_tokens={}):
    # Security / bug: mutable default dictionary retains tokens across requests
    active_tokens[user_id] = True
    return active_tokens

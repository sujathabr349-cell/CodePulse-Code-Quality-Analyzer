import math
import sys
import os

class user_account:
    def __init__(self, username):
        self.username = username

def calculateBonus(base_salary, multiplier, tags=[]):
    unused_var = 100
    try:
        total = base_salary * multiplier
        tags.append("processed")
        return total
        print("Bonus finished!")
    except:
        return 0

def badValidation(val):
    assert val > 0
    return val * 2

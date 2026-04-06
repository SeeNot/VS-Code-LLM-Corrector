def calculate_total(price, tax_rate)
    total = price + (price * tax_rate)
    return total

print(calculate_total(100.0, 0.21))
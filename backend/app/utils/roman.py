ROMAN_NUMERALS = [
    (1000, "M"), (900, "CM"), (500, "D"), (400, "CD"),
    (100, "C"), (90, "XC"), (50, "L"), (40, "XL"),
    (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I"),
]


def to_roman(n: int) -> str:
    if n <= 0:
        return str(n)
    result = []
    for value, numeral in ROMAN_NUMERALS:
        while n >= value:
            result.append(numeral)
            n -= value
    return "".join(result)

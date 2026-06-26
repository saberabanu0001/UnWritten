function toRoman(n: number): string {
  const numerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let result = ''
  let num = n
  for (const [value, symbol] of numerals) {
    while (num >= value) {
      result += symbol
      num -= value
    }
  }
  return result || String(n)
}

export { toRoman }

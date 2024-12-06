export function last<T>(x: T[]): T {
  return x[x.length - 1]
}

export function first<T>(x: T[]): T {
  return x[0]
}

export function isEmpty(col: any[]): boolean {
  return col.length === 0
}

import { formatSeconds } from './generator.js'
export { formatSeconds }

function gcd(a, b) {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) { [a, b] = [b, a % b] }
  return a
}

function lcm(a, b) {
  return (a / gcd(a, b)) * b
}

function simplify(num, den) {
  if (den === 0) return { num, den }
  const sign = den < 0 ? -1 : 1
  num *= sign
  den *= sign
  const g = gcd(Math.abs(num), den)
  return { num: num / g, den: den / g }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateFraction() {
  const den = randInt(2, 12)
  const num = randInt(1, den - 1)
  return simplify(num, den)
}

function fAdd(a, b) {
  const den = lcm(a.den, b.den)
  const num = a.num * (den / a.den) + b.num * (den / b.den)
  return simplify(num, den)
}

function fSub(a, b) {
  const den = lcm(a.den, b.den)
  const num = a.num * (den / a.den) - b.num * (den / b.den)
  return simplify(num, den)
}

function fMul(a, b) {
  return simplify(a.num * b.num, a.den * b.den)
}

function fDiv(a, b) {
  if (b.num === 0) return null
  return simplify(a.num * b.den, a.den * b.num)
}

function applyOp(a, op, b) {
  switch (op) {
    case '+': return fAdd(a, b)
    case '-': return fSub(a, b)
    case '*': return fMul(a, b)
    case '/': return fDiv(a, b)
    default: return null
  }
}

// Evaluate 5 fractions with 4 operators using standard precedence (* / before + -)
// Returns { ok, value } — fails if any intermediate result is negative or invalid
function evaluateWithChecks(fracs, ops) {
  const ns = fracs.map(f => ({ ...f }))
  const os = ops.slice()

  // First pass: handle * and / left-to-right
  let i = 0
  while (i < os.length) {
    if (os[i] === '*' || os[i] === '/') {
      const result = applyOp(ns[i], os[i], ns[i + 1])
      if (!result || result.den === 0 || result.num < 0) return { ok: false }
      ns.splice(i, 2, result)
      os.splice(i, 1)
    } else {
      i++
    }
  }

  // Second pass: handle + and - left-to-right
  while (os.length > 0) {
    const result = applyOp(ns[0], os[0], ns[1])
    if (!result || result.den === 0 || result.num < 0) return { ok: false }
    ns.splice(0, 2, result)
    os.splice(0, 1)
  }

  const value = ns[0]
  if (value.den === 0 || value.num < 0) return { ok: false }
  return { ok: true, value }
}

export function formatFraction(f) {
  if (f.den === 1) return String(f.num)
  return `${f.num}/${f.den}`
}

function formatExpr(fracs, ops) {
  let s = formatFraction(fracs[0])
  for (let i = 0; i < ops.length; i++) {
    const displayOp = ops[i] === '/' ? '÷' : ops[i] === '*' ? '×' : ops[i]
    s += ` ${displayOp} ${formatFraction(fracs[i + 1])}`
  }
  return s
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function generateOne() {
  // 5 fractions, exactly one each of + - * /
  for (let attempt = 0; attempt < 2000; attempt++) {
    const fracs = [generateFraction(), generateFraction(), generateFraction(), generateFraction(), generateFraction()]
    const ops = shuffle(['+', '-', '*', '/'])
    const res = evaluateWithChecks(fracs, ops)
    if (!res.ok) continue
    return {
      expr: formatExpr(fracs, ops),
      answer: res.value,
      answerStr: formatFraction(res.value),
    }
  }
  // Deterministic fallback: a * b / c + d - e with known-good fractions
  // 1/2 * 1/3 / 1/6 + 1/4 - 1/8
  // Step by step: 1/2 * 1/3 = 1/6, 1/6 / 1/6 = 1, 1 + 1/4 = 5/4, 5/4 - 1/8 = 9/8
  const fracs = [
    { num: 1, den: 2 },
    { num: 1, den: 3 },
    { num: 1, den: 6 },
    { num: 1, den: 4 },
    { num: 1, den: 8 },
  ]
  const ops = ['*', '/', '+', '-']
  const res = evaluateWithChecks(fracs, ops)
  return {
    expr: formatExpr(fracs, ops),
    answer: res.value,
    answerStr: formatFraction(res.value),
  }
}

export function generateFractionSet(count = 5) {
  const items = []
  const exprs = new Set()
  while (items.length < count) {
    const p = generateOne()
    if (exprs.has(p.expr)) continue
    exprs.add(p.expr)
    items.push(p)
  }
  return items
}

export function parseFraction(input) {
  const s = input.trim()
  if (s.includes('/')) {
    const parts = s.split('/')
    if (parts.length !== 2) return null
    const num = parseInt(parts[0], 10)
    const den = parseInt(parts[1], 10)
    if (isNaN(num) || isNaN(den) || den === 0) return null
    return simplify(num, den)
  }
  const num = parseInt(s, 10)
  if (isNaN(num)) return null
  return { num, den: 1 }
}

export function fractionsEqual(f1, f2) {
  if (!f1 || !f2) return false
  return f1.num * f2.den === f2.num * f1.den
}

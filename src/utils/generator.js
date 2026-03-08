// Utility to generate mixed-operation expressions with two-digit numbers (10-99)
// Requirements:
// - Every question must include + - * /
// - No negative numbers introduced at any intermediate step or in the final result
// - All intermediate and final results must be integers
// - No parentheses; precedence: * and / before + and -, left-to-right for same precedence.

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)]
}

// Evaluate a tokens list (nums length = ops length + 1) with precedence and checks
function evaluateWithChecks(nums, ops) {
  // Copy tokens
  const ns = nums.slice()
  const os = ops.slice()

  const apply = (a, op, b) => {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '*': return a * b
      case '/': return a / b
      default: throw new Error('bad op')
    }
  }

  // Helper to apply op at position i (ns[i] op os[i] ns[i+1]) and splice tokens
  const doAt = (i) => {
    const a = ns[i]
    const b = ns[i + 1]
    const op = os[i]
    if (op === '/') {
      if (b === 0) return { ok: false }
      const res = apply(a, op, b)
      if (!Number.isFinite(res) || Math.floor(res) !== res) return { ok: false }
      if (res < 0) return { ok: false }
      ns.splice(i, 2, res)
      os.splice(i, 1)
      return { ok: true }
    } else if (op === '*') {
      const res = apply(a, op, b)
      if (!Number.isFinite(res) || Math.floor(res) !== res) return { ok: false }
      if (res < 0) return { ok: false }
      ns.splice(i, 2, res)
      os.splice(i, 1)
      return { ok: true }
    } else if (op === '+' || op === '-') {
      const res = apply(a, op, b)
      if (!Number.isFinite(res) || Math.floor(res) !== res) return { ok: false }
      if (res < 0) return { ok: false }
      ns.splice(i, 2, res)
      os.splice(i, 1)
      return { ok: true }
    }
    return { ok: false }
  }

  // First pass: handle * and / left-to-right
  let idx = 0
  while (idx < os.length) {
    if (os[idx] === '*' || os[idx] === '/') {
      const r = doAt(idx)
      if (!r.ok) return { ok: false }
    } else {
      idx++
    }
  }

  // Second pass: handle + and - left-to-right
  idx = 0
  while (os.length > 0) {
    const r = doAt(0)
    if (!r.ok) return { ok: false }
  }

  const value = ns[0]
  if (!Number.isFinite(value) || Math.floor(value) !== value) return { ok: false }
  if (value < 0) return { ok: false }
  return { ok: true, value }
}

// shuffle utility
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function displayOp(op) {
  if (op === '*') return '×'
  if (op === '/') return '÷'
  return op
}

function formatExpr(nums, ops) {
  return `${nums[0]} ${displayOp(ops[0])} ${nums[1]} ${displayOp(ops[1])} ${nums[2]} ${displayOp(ops[2])} ${nums[3]} ${displayOp(ops[3])} ${nums[4]}`
}

function generateOne() {
  // Build expressions with five numbers and exactly one of each operator + - * /
  for (let attempts = 0; attempts < 2000; attempts++) {
    const nums = [randInt(10, 99), randInt(10, 99), randInt(10, 99), randInt(10, 99), randInt(10, 99)]
    const ops = shuffle(['+', '-', '*', '/'])

    // Quick divisibility heuristics to improve success chance:
    // Ensure any immediate division in the high-precedence phase will be exact.
    // We'll try a couple of simple adjustments by swapping numbers around.
    // Note: Full correctness is enforced by evaluateWithChecks below.

    const res = evaluateWithChecks(nums, ops)
    if (!res.ok) continue
    const value = res.value
    if (!Number.isFinite(value)) continue
    if (Math.abs(value) > 9999) continue
    return {
      expr: formatExpr(nums, ops),
      answer: value,
    }
  }
  // Fallback builder that guarantees constraints: a * b / c + d - e
  const a = randInt(10, 30)
  const b = randInt(10, 30)
  // choose c as a divisor of a*b between 10 and 99
  const prod = a * b
  let cCandidates = []
  for (let d = 10; d <= 99; d++) {
    if (prod % d === 0) cCandidates.push(d)
  }
  if (cCandidates.length === 0) cCandidates = [10]
  const c = pick(cCandidates)
  const t2 = prod / c
  const dNum = randInt(10, 99)
  const maxE = Math.min(99, t2 + dNum)
  const e = randInt(10, maxE)
  const nums = [a, b, c, dNum, e]
  const ops = ['*', '/', '+', '-']
  const res = evaluateWithChecks(nums, ops)
  const value = res.ok ? res.value : (t2 + dNum - e)
  return {
    expr: `${nums[0]} ${ops[0]} ${nums[1]} ${ops[1]} ${nums[2]} ${ops[2]} ${nums[3]} ${ops[3]} ${nums[4]}`,
    answer: value,
  }
}

export function generateSet(count = 5) {
  const items = []
  const exprs = new Set()
  while (items.length < count) {
    const p = generateOne()
    if (exprs.has(p.expr)) continue
    exprs.add(p.expr)
    items.push({ ...p })
  }
  return items
}

export function formatSeconds(sec) {
  const s = Math.max(0, Math.floor(sec))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

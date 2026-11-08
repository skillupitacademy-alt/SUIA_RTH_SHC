// Offline SQL model for repository verification. Uses real Drizzle SQL generation;
// models only supported predicates, not PostgreSQL transactions or lock scheduling.
import { drizzle } from 'drizzle-orm/pg-proxy';

type Row = Record<string, any>;
export type QueryEvidence = { sql: string; params: unknown[]; affected: number };
const clone = <T>(value: T): T => structuredClone(value);
const canonical = (value: any): string => value && typeof value === 'object'
  ? Array.isArray(value) ? `[${value.map(canonical).join(',')}]`
    : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
  : JSON.stringify(value);

function predicate(expression: string, row: Row, params: any[]): boolean {
  const tokens = expression.match(/"[^"]+"(?:\."[^"]+")?|\$\d+|::jsonb|<=|>=|<>|[=<>+()]|\b(?:and|or|is|null|not|\d+)\b/gi) ?? [];
  let position = 0;
  const atom = (): any => {
    const token = tokens[position++];
    if (!token) throw new Error(`Missing SQL operand: ${expression}`);
    if (token.startsWith('$')) {
      let value = params[Number(token.slice(1)) - 1];
      if (tokens[position] === '::jsonb') { position++; value = JSON.parse(value); }
      return value;
    }
    if (token.startsWith('"')) {
      const column = [...token.matchAll(/"([^"]+)"/g)].at(-1)![1];
      const value = row[column];
      return ['payload', 'envelope'].includes(column) && typeof value === 'string' ? JSON.parse(value) : value;
    }
    if (token.toLowerCase() === 'null') return null;
    return Number(token);
  };
  const comparison = (): boolean => {
    if (tokens[position] === '(') {
      position++;
      const value = disjunction();
      if (tokens[position++] !== ')') throw new Error('Unbalanced SQL expression');
      return value;
    }
    const left = atom();
    const operator = tokens[position++]?.toLowerCase();
    if (operator === 'is') {
      const invert = tokens[position]?.toLowerCase() === 'not';
      if (invert) position++;
      if (tokens[position++]?.toLowerCase() !== 'null') throw new Error('Unsupported IS predicate');
      return invert ? left != null : left == null;
    }
    const right = atom();
    if (left == null || right == null) return false; // SQL NULL comparisons do not match WHERE.
    if (operator === '=') return canonical(left) === canonical(right);
    if (operator === '<>') return canonical(left) !== canonical(right);
    // Serialized timestamp operands use the same UTC representation from Drizzle.
    const temporal = typeof left === 'string' && typeof right === 'string' && /^\d{4}-\d{2}-\d{2}/.test(left) && /^\d{4}-\d{2}-\d{2}/.test(right);
    const a = temporal ? Date.parse(left) : left;
    const b = temporal ? Date.parse(right) : right;
    if (operator === '>') return a > b;
    if (operator === '<') return a < b;
    if (operator === '<=') return a <= b;
    if (operator === '>=') return a >= b;
    throw new Error(`Unsupported predicate ${operator}`);
  };
  const conjunction = (): boolean => {
    let value = comparison();
    while (tokens[position]?.toLowerCase() === 'and') { position++; const next = comparison(); value = value && next; }
    return value;
  };
  const disjunction = (): boolean => {
    let value = conjunction();
    while (tokens[position]?.toLowerCase() === 'or') { position++; const next = conjunction(); value = value || next; }
    return value;
  };
  const result = disjunction();
  if (position !== tokens.length) throw new Error(`Unconsumed SQL predicate: ${tokens.slice(position).join(' ')}`);
  return result;
}

export function controlledSql(initial: Row[] = []) {
  const state = { rows: clone(initial), queries: [] as QueryEvidence[], beforeUpdate: undefined as undefined | ((sql: string, params: any[]) => void) };
  const execute = async (sql: string, params: any[]) => {
    let results: Row[] = [];
    const where = sql.match(/\bwhere\s+(.+?)(?:\s+returning\s|\s+limit\s|$)/i)?.[1];
    if (/^select /i.test(sql)) {
      results = clone(state.rows.filter(row => !where || predicate(where, row, params)));
    } else if (/^update /i.test(sql)) {
      state.beforeUpdate?.(sql, params);
      const changes = sql.match(/\bset\s+(.+?)\s+where\s/i)?.[1];
      if (!changes || !where) throw new Error(`Unsupported UPDATE: ${sql}`);
      for (const row of state.rows) {
        if (!predicate(where, row, params)) continue;
        for (const assignment of changes.split(/,\s*(?=")/)) {
          const match = assignment.match(/^"([^"]+)"\s*=\s*(.+)$/);
          if (!match) throw new Error(`Unsupported assignment: ${assignment}`);
          const [, column, value] = match;
          if (/^\$\d+$/.test(value)) row[column] = clone(params[Number(value.slice(1)) - 1]);
          else if (value.includes('+ 1')) row[column] = Number(row[column]) + 1;
          else if (value === 'null') row[column] = null;
          else throw new Error(`Unsupported SET: ${value}`);
        }
        results.push(clone(row));
      }
    } else if (/^insert /i.test(sql)) {
      const match = sql.match(/\((.+?)\) values \((.+?)\)/);
      if (!match) throw new Error(`Unsupported INSERT: ${sql}`);
      const columns = match[1].split(',').map(c => c.trim().replaceAll('"', ''));
      const values = match[2].split(',').map(v => v.trim());
      const row: Row = {};
      columns.forEach((column, index) => {
        const value = values[index];
        row[column] = value?.startsWith('$') ? clone(params[Number(value.slice(1)) - 1]) : null;
      });
      state.rows.push(row); results = [clone(row)];
    } else throw new Error(`Unsupported SQL: ${sql}`);
    state.queries.push({ sql, params: clone(params), affected: results.length });
    const selection = /^select /i.test(sql) ? sql.match(/^select (.+?) from /i)?.[1] : sql.match(/ returning (.+)$/i)?.[1];
    if (!selection) return { rows: [] };
    const columns = selection.split(',').map(field => [...field.matchAll(/"([^"]+)"/g)].at(-1)?.[1]);
    return { rows: results.map(row => columns.map(column => {
      const value = row[column!];
      return column?.endsWith('_at') && typeof value === 'string' ? value.replace(/Z$/, '') : value;
    })) };
  };
  const db = drizzle(execute);
  // Snapshot transaction is an explicit controlled simulation, not a driver transaction.
  const transaction = async <T>(action: (tx: typeof db) => Promise<T>) => {
    const snapshot = clone(state.rows);
    try { return await action(db); } catch (error) { state.rows = snapshot; throw error; }
  };
  return { state, db, transaction };
}

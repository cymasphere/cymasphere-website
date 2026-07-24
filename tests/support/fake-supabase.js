/**
 * @fileoverview Dumpable in-memory Supabase stand-in for support-ticket integration tests.
 * @module tests/support/fake-supabase
 */

/**
 * @typedef {'support'|'bug'|'feature'|'crash'} TicketType
 */

/**
 * @returns {{
 *   tables: Record<string, object[]>,
 *   storage: { bucket: string, path: string, bytes: Uint8Array }[],
 *   rpcShouldFail: boolean,
 *   nextTicketNumber: string,
 *   dumpTable: (name: string) => object[],
 *   client: object,
 *   serviceClient: object,
 * }}
 */
function createFakeSupabase() {
  const tables = {
    support_tickets: [],
    support_messages: [],
    support_attachments: [],
  };
  const storage = [];
  let rpcShouldFail = false;
  let nextTicketNumber = "T-1001";
  let idCounter = 1;

  function nextId() {
    const id = `00000000-0000-4000-8000-${String(idCounter++).padStart(12, "0")}`;
    return id;
  }

  function makeQuery(tableName) {
    const state = { filters: [], insertRow: null, selectCols: "*" };

    const builder = {
      insert(row) {
        state.insertRow = Array.isArray(row) ? row[0] : row;
        return builder;
      },
      select(cols) {
        state.selectCols = cols || "*";
        return builder;
      },
      eq(col, val) {
        state.filters.push({ col, val });
        return builder;
      },
      single() {
        if (state.insertRow) {
          const row = {
            id: nextId(),
            ...state.insertRow,
          };
          tables[tableName].push(row);
          return Promise.resolve({ data: row, error: null });
        }
        let rows = tables[tableName];
        for (const f of state.filters) {
          rows = rows.filter((r) => r[f.col] === f.val);
        }
        if (rows.length === 0) {
          return Promise.resolve({
            data: null,
            error: { code: "PGRST116", message: "not found" },
          });
        }
        return Promise.resolve({ data: rows[0], error: null });
      },
      then(resolve, reject) {
        return builder.single().then(resolve, reject);
      },
    };
    return builder;
  }

  const client = {
    rpc(name) {
      if (name === "generate_ticket_number") {
        if (rpcShouldFail) {
          return Promise.resolve({
            data: null,
            error: { message: "rpc failed" },
          });
        }
        return Promise.resolve({ data: nextTicketNumber, error: null });
      }
      return Promise.resolve({ data: null, error: { message: "unknown rpc" } });
    },
    from(tableName) {
      return makeQuery(tableName);
    },
  };

  const serviceClient = {
    storage: {
      from(bucket) {
        return {
          upload(path, buffer) {
            const bytes =
              buffer instanceof Uint8Array
                ? buffer
                : new Uint8Array(Buffer.from(buffer));
            storage.push({ bucket, path, bytes });
            return Promise.resolve({ data: { path }, error: null });
          },
        };
      },
    },
    from(tableName) {
      return makeQuery(tableName);
    },
  };

  return {
    tables,
    storage,
    get rpcShouldFail() {
      return rpcShouldFail;
    },
    set rpcShouldFail(v) {
      rpcShouldFail = v;
    },
    get nextTicketNumber() {
      return nextTicketNumber;
    },
    set nextTicketNumber(v) {
      nextTicketNumber = v;
    },
    dumpTable(name) {
      return tables[name].map((r) => ({ ...r }));
    },
    client,
    serviceClient,
  };
}

module.exports = { createFakeSupabase };

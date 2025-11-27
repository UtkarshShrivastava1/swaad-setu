/**
 * 🧭 extractTableId
 * -------------------------
 * Safely extracts a table ID string from any input shape:
 * - Direct string ID
 * - Object with `_id`, `id`, or `tableId`
 * - Nested object like `{ table: { _id } }`
 * - Fallback to string conversion if unknown
 * Logs its behavior for visibility during debugging.
 */
export const extractTableId = (maybe: unknown): string => {
  if (!maybe) {
    console.warn(
      "%c[extractTableId] ⚠️ Received null/undefined input",
      "color:orange"
    );
    return "";
  }

  // 🔤 Direct string input
  if (typeof maybe === "string") {
    console.log(
      "%c[extractTableId] 📦 Direct string tableId:",
      "color:#2196F3",
      maybe
    );
    return maybe.trim();
  }

  // 🧱 Object-based cases
  if (typeof maybe === "object" && maybe !== null) {
    const obj = maybe as any;

    // Common shapes
    if (obj._id && typeof obj._id === "string") {
      console.log("%c[extractTableId] ✅ Found _id:", "color:#4CAF50", obj._id);
      return obj._id.trim();
    }

    if (obj.id && typeof obj.id === "string") {
      console.log("%c[extractTableId] ✅ Found id:", "color:#4CAF50", obj.id);
      return obj.id.trim();
    }

    if (obj.tableId && typeof obj.tableId === "string") {
      console.log(
        "%c[extractTableId] ✅ Found tableId:",
        "color:#4CAF50",
        obj.tableId
      );
      return obj.tableId.trim();
    }

    // Nested table object
    if (obj.table && typeof obj.table === "object") {
      const inner = obj.table;
      if (inner._id && typeof inner._id === "string") {
        console.log(
          "%c[extractTableId] ✅ Found nested table._id:",
          "color:#4CAF50",
          inner._id
        );
        return inner._id.trim();
      }
      if (inner.id && typeof inner.id === "string") {
        console.log(
          "%c[extractTableId] ✅ Found nested table.id:",
          "color:#4CAF50",
          inner.id
        );
        return inner.id.trim();
      }
    }

    // Fallback for debugging
    console.warn(
      "%c[extractTableId] ⚠️ Unknown object shape:",
      "color:orange",
      obj
    );
    return JSON.stringify(obj);
  }

  // ⚙️ Fallback: attempt safe string conversion
  const str = String(maybe);
  console.warn(
    "%c[extractTableId] ⚠️ Fallback string conversion:",
    "color:orange",
    str
  );
  return str;
};

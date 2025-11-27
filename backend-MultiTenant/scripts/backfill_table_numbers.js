/**
 * Backfill missing tableNumber in bills (safe, idempotent)
 * Run with: node scripts/backfill_table_numbers.js
 */

const mongoose = require("mongoose");
require("dotenv").config(); // ensure .env has your Mongo URI

const Bill = require("../models/bill.model");
const Table = require("../models/table.model");

(async () => {
  try {
    console.log("🚀 Starting backfill of missing tableNumber fields...");

    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/yourdb",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    // Fetch bills missing tableNumber but having tableId
    const bills = await Bill.find({
      tableNumber: { $in: [null, undefined] },
      tableId: { $ne: null },
    }).lean();

    console.log(`📦 Found ${bills.length} bills needing backfill.`);

    for (const bill of bills) {
      try {
        const { Types } = mongoose;
        const tableQuery = {
          _id: Types.ObjectId.isValid(bill.tableId)
            ? new Types.ObjectId(bill.tableId)
            : bill.tableId,
          restaurantId: bill.restaurantId,
        };

        const table = await Table.findOne(tableQuery).lean();
        if (!table) {
          console.warn(
            `⚠️ No table found for Bill ${bill._id} (tableId: ${bill.tableId})`
          );
          continue;
        }

        await Bill.updateOne(
          { _id: bill._id },
          { $set: { tableNumber: table.tableNumber } }
        );

        console.log(
          `✅ Updated Bill ${bill._id} → Table #${table.tableNumber}`
        );
      } catch (err) {
        console.error(`💥 Failed for Bill ${bill._id}:`, err.message);
      }
    }

    console.log("🎉 Backfill completed successfully!");
    await mongoose.disconnect();
  } catch (err) {
    console.error("💥 Fatal error:", err);
    process.exit(1);
  }
})();

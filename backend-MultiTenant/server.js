// server.js — Multi-Tenant Boot Console (Premium Edition)
require("dotenv").config();
const http = require("http");
const chalk = require("chalk");
const Table = require("cli-table3");

const app = require("./app");
const { initializeSocket } = require("./services/socket.service");
const config = require("./config");
const logger = require("./common/libs/logger");
const { connectDB } = require("./db/mongoose");

const { loadTenants } = require("./common/middlewares/tenant.middleware");

// Models for tenant metrics (now handled in middleware)
// const Menu = require("./models/menu.model");
// const TableModel = require("./models/table.model");
// const StaffModel = require("./models/admin.model"); 

const server = http.createServer(app);
let io = null;

// Color helpers
const divider = () =>
  console.log(
    chalk.gray("──────────────────────────────────────────────────────────────")
  );

async function boot() {
  console.clear();

  console.log(
    chalk.cyanBright(`
==================================================
   🍽️   SWAD SETU — MULTI-TENANT ENGINE BOOT    
==================================================`)
  );

  const bootStart = Date.now();

  // ------------------------------------------------------------
  // CONFIG VALIDATION
  // ------------------------------------------------------------
  process.stdout.write(chalk.yellow("🔧 CONFIG CHECK ........... "));
  try {
    config.validate();
    console.log(chalk.green("✔ OK"));
  } catch (err) {
    console.log(chalk.red("✖ FAILED"));
    console.error(err.message);
    process.exit(1);
  }

  // ------------------------------------------------------------
  // MONGODB CONNECTION
  // ------------------------------------------------------------
  process.stdout.write(chalk.yellow("🛢️  MONGODB CONNECT ........ "));
  await connectDB();
  console.log(chalk.green("✔ CONNECTED"));

  // ------------------------------------------------------------
  // LOAD TENANTS + METRICS
  // ------------------------------------------------------------
  console.log(chalk.yellow("📊 LOADING TENANTS ........"));
  const tenants = await loadTenants();

  // Note: Detailed metrics like menu/table counts are no longer displayed here
  // to simplify boot. They can be re-added if needed.
  if (tenants.length > 0) {
    const tTable = new Table({
      head: [
        chalk.blueBright("#"),
        chalk.blueBright("Restaurant Name"),
        chalk.blueBright("RID"),
        chalk.blueBright("Owner / Phone"),
      ],
      colWidths: [4, 26, 28, 30],
      wordWrap: true,
    });

    tenants.forEach((t, i) => {
      tTable.push([
        i + 1,
        t.restaurantName || chalk.gray("N/A"),
        chalk.yellow(t.restaurantId),
        `${t.ownerName || "N/A"} / ${t.phone || "N/A"}`,
      ]);
    });
    console.log(tTable.toString());
  } else {
    console.log(chalk.gray("   (No tenants found)\n"));
  }

  divider();

  // ------------------------------------------------------------
  // SOCKET.IO + REDIS
  // ------------------------------------------------------------
  process.stdout.write(chalk.yellow("📡 SOCKET.IO + REDIS ....... "));
  try {
    io = await initializeSocket(server);
    console.log(chalk.green("✔ READY"));
  } catch (err) {
    console.log(chalk.red("⚠ FALLBACK MODE"));
    console.warn("   Reason:", err.message);
    io = null;
  }

  divider();

  // ------------------------------------------------------------
  // START HTTP SERVER
  // ------------------------------------------------------------
  const PORT = config.PORT || process.env.PORT || 3000;

  server.listen(PORT, () => {
    console.log(chalk.greenBright("🚀  SERVER ONLINE"));
    divider();

    console.log(chalk.white(`🌐 Port: `) + chalk.cyan(PORT));
    console.log(chalk.white(`🔐 Auth: `) + chalk.green("JWT Active"));
    console.log(
      chalk.white(`🧮 Bcrypt Rounds: `) + chalk.yellow(config.BCRYPT_ROUNDS)
    );
    console.log(
      chalk.white(`🗄  Redis: `) +
        (config.REDIS_URL ? chalk.green("Configured") : chalk.gray("Disabled"))
    );

    divider();

    console.log(chalk.cyanBright("📍 ACTIVE TENANT ROUTES:"));
    if (tenants.length === 0) {
      console.log("   (none)");
    } else {
      tenants.forEach((t) => {
        console.log(
          `   → ${chalk.green(
            `http://localhost:${PORT}/api/${t.restaurantId}/admin/login`
          )}`
        );
      });
    }

    divider();

    console.log(
      chalk.yellowBright(`⏱️  BOOT TIME: ${Date.now() - bootStart} ms`)
    );
    divider();
  });
}

// ------------------------------------------------------------
// GRACEFUL SHUTDOWN
// ------------------------------------------------------------
async function gracefulShutdown(sig) {
  console.log(chalk.redBright(`\n⚠ Received ${sig}, shutting down...`));

  if (io && io.close) {
    await new Promise((resolve) => io.close(resolve));
    console.log(chalk.green("   ✔ Socket.IO closed"));
  }

  await new Promise((resolve) => server.close(resolve));
  console.log(chalk.green("   ✔ HTTP server closed"));

  console.log(chalk.blue("👋 Shutdown complete"));
  process.exit(0);
}

["SIGINT", "SIGTERM"].forEach((sig) =>
  process.on(sig, () => gracefulShutdown(sig))
);

process.on("uncaughtException", (err) => {
  console.error(chalk.red("💥 Uncaught exception:"), err);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error(chalk.red("💥 Unhandled rejection:"), reason);
  gracefulShutdown("unhandledRejection");
});

// ------------------------------------------------------------
// START BOOT
// ------------------------------------------------------------
boot();

-- CreateTable
CREATE TABLE "AuditedTrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "algorithm" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "contracts" INTEGER NOT NULL,
    "profit" REAL,
    "profitPct" REAL,
    "cumProfit" REAL,
    "cumProfitPct" REAL,
    "backtestingProfit" REAL,
    "slippage" REAL,
    "slippagePerContract" REAL,
    "totalContracts" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AuditedTrade_algorithm_date_time_type_signal_key" ON "AuditedTrade"("algorithm", "date", "time", "type", "signal");

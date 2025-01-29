interface AuditedTrade {
  algorithm: string;
  symbol: string;
  type: string;
  signal: string;
  date: Date;
  time: string;
  price: number;
  contracts: number;
  profit?: number;
  profitPct?: number;
  cumProfit?: number;
  cumProfitPct?: number;
  backtestingProfit?: number;
  slippage?: number;
  slippagePerContract?: number;
  totalContracts?: number;
}

export function parseAuditedTradeData(text: string, algorithm: string): AuditedTrade[] {
  const trades: AuditedTrade[] = [];
  
  // Split text into lines and remove header
  const lines = text.split('\n').slice(2);
  
  // Process each line
  lines.forEach((line) => {
    // Split line by whitespace, filtering out empty strings
    const parts = line.trim().split(/\s+/).filter(Boolean);
    
    // Skip if line doesn't have enough parts
    if (parts.length < 8) return;
    
    try {
      const trade: AuditedTrade = {
        algorithm,
        symbol: parts[1],
        type: parts[2],
        signal: parts[3],
        date: new Date(parts[4]),
        time: parts[5],
        price: parseFloat(parts[6].replace('$', '').replace(',', '')),
        contracts: parseInt(parts[7], 10),
      };
      
      // Optional fields
      if (parts[8]) trade.profit = parseFloat(parts[8].replace('$', '').replace(',', ''));
      if (parts[9]) trade.profitPct = parseFloat(parts[9].replace('%', ''));
      if (parts[10]) trade.cumProfit = parseFloat(parts[10].replace('$', '').replace(',', ''));
      if (parts[11]) trade.cumProfitPct = parseFloat(parts[11].replace('%', ''));
      if (parts[12]) trade.backtestingProfit = parseFloat(parts[12].replace('$', '').replace(',', ''));
      if (parts[13]) trade.slippage = parseFloat(parts[13].replace('$', '').replace(',', ''));
      if (parts[14]) trade.slippagePerContract = parseFloat(parts[14].replace('$', '').replace(',', ''));
      if (parts[15]) trade.totalContracts = parseInt(parts[15], 10);
      
      trades.push(trade);
    } catch (error) {
      console.error('Error parsing trade line:', line, error);
    }
  });
  
  return trades;
} 
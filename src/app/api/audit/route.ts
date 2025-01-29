import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { prisma } from '@/lib/prisma';
import { parseAuditedTradeData } from '@/lib/utils/audit-parser';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const algorithm = formData.get('algorithm') as string;

    if (!file || !algorithm) {
      return NextResponse.json(
        { error: 'File and algorithm are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Initialize Tesseract worker
    const worker = await createWorker();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');

    // Perform OCR
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    // Parse the OCR text into structured data
    const trades = parseAuditedTradeData(text, algorithm);

    // Save new trades to database
    const savedTrades = await Promise.all(
      trades.map(async (trade) => {
        try {
          return await prisma.auditedTrade.create({
            data: trade,
          });
        } catch (error: any) {
          // If trade already exists (unique constraint violation), skip it
          if (error.code === 'P2002') {
            return null;
          }
          throw error;
        }
      })
    );

    // Filter out null values (skipped duplicates)
    const newTrades = savedTrades.filter(Boolean);

    return NextResponse.json({
      message: `Successfully processed ${newTrades.length} new trades`,
      newTrades,
    });

  } catch (error) {
    console.error('Error processing audit data:', error);
    return NextResponse.json(
      { error: 'Failed to process audit data' },
      { status: 500 }
    );
  }
} 
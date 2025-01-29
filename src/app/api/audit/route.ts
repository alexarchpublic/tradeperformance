import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { prisma } from '@/lib/prisma';
import { parseAuditedTradeData } from '@/lib/utils/audit-parser';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import type { AuditedTrade } from '.prisma/client';

export async function GET() {
  try {
    // Read all files in the audited-data directory
    const auditedTradesDir = path.join(process.cwd(), 'public', 'audited-data');
    const files = await readdir(auditedTradesDir);
    const pngFiles = files.filter(file => file.endsWith('.png'));

    let allNewTrades: AuditedTrade[] = [];

    for (const file of pngFiles) {
      const filePath = path.join(auditedTradesDir, file);
      const buffer = await readFile(filePath);
      const algorithm = path.basename(file, '.png'); // Use filename as algorithm name

      // Initialize Tesseract worker
      const worker = await createWorker();
      // @ts-expect-error - Tesseract.js types don't match the actual API
      await worker.loadLanguage('eng');
      // @ts-expect-error - Tesseract.js types don't match the actual API
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
          } catch (error) {
            // If trade already exists (unique constraint violation), skip it
            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
              return null;
            }
            throw error;
          }
        })
      );

      // Filter out null values (skipped duplicates)
      const newTrades = savedTrades.filter(Boolean);
      allNewTrades = [...allNewTrades, ...newTrades];
    }

    return NextResponse.json({
      message: `Successfully processed ${allNewTrades.length} new trades`,
      newTrades: allNewTrades,
    });

  } catch (error) {
    console.error('Error processing audit data:', error);
    return NextResponse.json(
      { error: 'Failed to process audit data' },
      { status: 500 }
    );
  }
} 
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

export interface ReceiptData {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  items: ReceiptItem[];
  confidence: number;
  rawText: string;
}

export interface ReceiptItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ScanResult {
  success: boolean;
  data?: ReceiptData;
  error?: string;
  suggestions?: string[];
}

class ReceiptScannerService {
  private static instance: ReceiptScannerService;

  private constructor() {}

  public static getInstance(): ReceiptScannerService {
    if (!ReceiptScannerService.instance) {
      ReceiptScannerService.instance = new ReceiptScannerService();
    }
    return ReceiptScannerService.instance;
  }

  // Pick and scan receipt from gallery
  async pickAndScanReceipt(): Promise<ScanResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return {
          success: false,
          error: 'Receipt selection cancelled',
        };
      }

      const fileUri = result.assets[0].uri;
      return await this.scanReceiptFromUri(fileUri);
    } catch (error) {
      console.error('Error picking receipt:', error);
      return {
        success: false,
        error: 'Failed to pick receipt',
      };
    }
  }

  // Scan receipt from file URI
  async scanReceiptFromUri(fileUri: string): Promise<ScanResult> {
    try {
      // In a real implementation, this would use OCR services like:
      // - Google Vision API
      // - AWS Textract
      // - Azure Computer Vision
      // - Tesseract.js for client-side OCR
      
      // For now, we'll simulate OCR processing
      const mockReceiptData = await this.simulateOCRProcessing(fileUri);
      
      if (mockReceiptData) {
        return {
          success: true,
          data: mockReceiptData,
        };
      } else {
        return {
          success: false,
          error: 'Could not extract data from receipt',
          suggestions: [
            'Ensure the receipt is clearly visible',
            'Try taking a photo with better lighting',
            'Make sure the text is not blurry',
          ],
        };
      }
    } catch (error) {
      console.error('Error scanning receipt:', error);
      return {
        success: false,
        error: 'Failed to scan receipt',
      };
    }
  }

  // Simulate OCR processing (replace with real OCR implementation)
  private async simulateOCRProcessing(fileUri: string): Promise<ReceiptData | null> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock receipt data - in real implementation, this would come from OCR
    const mockReceipts = [
      {
        merchant: 'Starbucks Coffee',
        amount: 12.45,
        date: new Date().toISOString(),
        category: 'Food & Dining',
        items: [
          { name: 'Grande Latte', price: 4.95, quantity: 1 },
          { name: 'Blueberry Muffin', price: 3.25, quantity: 1 },
          { name: 'Bottled Water', price: 2.25, quantity: 1 },
          { name: 'Tax', price: 2.00, quantity: 1 },
        ],
        confidence: 0.85,
        rawText: 'STARBUCKS COFFEE\n123 Main St\nGrande Latte $4.95\nBlueberry Muffin $3.25\nBottled Water $2.25\nTax $2.00\nTotal $12.45',
      },
      {
        merchant: 'Walmart Supercenter',
        amount: 89.67,
        date: new Date().toISOString(),
        category: 'Shopping',
        items: [
          { name: 'Groceries', price: 75.32, quantity: 1 },
          { name: 'Household Items', price: 14.35, quantity: 1 },
        ],
        confidence: 0.92,
        rawText: 'WALMART SUPERCENTER\n456 Oak Ave\nGroceries $75.32\nHousehold Items $14.35\nTotal $89.67',
      },
      {
        merchant: 'Shell Gas Station',
        amount: 45.20,
        date: new Date().toISOString(),
        category: 'Transportation',
        items: [
          { name: 'Gasoline', price: 42.00, quantity: 1 },
          { name: 'Snacks', price: 3.20, quantity: 1 },
        ],
        confidence: 0.78,
        rawText: 'SHELL\n789 Pine St\nGasoline $42.00\nSnacks $3.20\nTotal $45.20',
      },
    ];

    // Return random mock receipt
    const randomIndex = Math.floor(Math.random() * mockReceipts.length);
    return mockReceipts[randomIndex];
  }

  // Extract merchant name from receipt text
  extractMerchantName(text: string): string {
    const lines = text.split('\n');
    
    // Look for common merchant patterns
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and common receipt headers
      if (!trimmedLine || 
          trimmedLine.includes('RECEIPT') || 
          trimmedLine.includes('TOTAL') ||
          trimmedLine.includes('DATE') ||
          trimmedLine.includes('TIME')) {
        continue;
      }
      
      // First non-empty line is usually the merchant name
      if (trimmedLine.length > 2 && trimmedLine.length < 50) {
        return trimmedLine;
      }
    }
    
    return 'Unknown Merchant';
  }

  // Extract amount from receipt text
  extractAmount(text: string): number | null {
    // Look for total amount patterns
    const totalPatterns = [
      /total[:\s]*\$?(\d+\.?\d*)/i,
      /amount[:\s]*\$?(\d+\.?\d*)/i,
      /\$(\d+\.?\d*)\s*$/m,
      /(\d+\.?\d*)\s*$/m,
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        if (!isNaN(amount) && amount > 0) {
          return amount;
        }
      }
    }

    return null;
  }

  // Extract date from receipt text
  extractDate(text: string): string | null {
    const datePatterns = [
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
      /(\d{1,2}-\d{1,2}-\d{2,4})/,
      /(\d{4}-\d{1,2}-\d{1,2})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const date = new Date(match[1]);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  // Categorize receipt based on merchant name
  categorizeReceipt(merchant: string): string {
    const merchantLower = merchant.toLowerCase();
    
    // Food & Dining
    if (merchantLower.includes('restaurant') || 
        merchantLower.includes('cafe') || 
        merchantLower.includes('coffee') ||
        merchantLower.includes('pizza') ||
        merchantLower.includes('burger') ||
        merchantLower.includes('food')) {
      return 'Food & Dining';
    }
    
    // Transportation
    if (merchantLower.includes('gas') || 
        merchantLower.includes('shell') ||
        merchantLower.includes('exxon') ||
        merchantLower.includes('chevron') ||
        merchantLower.includes('uber') ||
        merchantLower.includes('lyft')) {
      return 'Transportation';
    }
    
    // Shopping
    if (merchantLower.includes('walmart') || 
        merchantLower.includes('target') ||
        merchantLower.includes('amazon') ||
        merchantLower.includes('store') ||
        merchantLower.includes('shop')) {
      return 'Shopping';
    }
    
    // Entertainment
    if (merchantLower.includes('movie') || 
        merchantLower.includes('theater') ||
        merchantLower.includes('netflix') ||
        merchantLower.includes('spotify')) {
      return 'Entertainment';
    }
    
    // Bills & Utilities
    if (merchantLower.includes('electric') || 
        merchantLower.includes('water') ||
        merchantLower.includes('internet') ||
        merchantLower.includes('phone')) {
      return 'Bills & Utilities';
    }
    
    // Healthcare
    if (merchantLower.includes('pharmacy') || 
        merchantLower.includes('medical') ||
        merchantLower.includes('doctor') ||
        merchantLower.includes('hospital')) {
      return 'Healthcare';
    }
    
    return 'Miscellaneous';
  }

  // Extract individual items from receipt
  extractItems(text: string): ReceiptItem[] {
    const items: ReceiptItem[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for item patterns (name followed by price)
      const itemPattern = /^(.+?)\s+\$?(\d+\.?\d*)$/;
      const match = trimmedLine.match(itemPattern);
      
      if (match) {
        const name = match[1].trim();
        const price = parseFloat(match[2]);
        
        // Skip common receipt elements
        if (name.toLowerCase().includes('total') ||
            name.toLowerCase().includes('tax') ||
            name.toLowerCase().includes('subtotal') ||
            name.toLowerCase().includes('change') ||
            name.toLowerCase().includes('cash')) {
          continue;
        }
        
        if (!isNaN(price) && price > 0) {
          items.push({
            name,
            price,
            quantity: 1,
          });
        }
      }
    }
    
    return items;
  }

  // Validate extracted receipt data
  validateReceiptData(data: ReceiptData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.merchant || data.merchant.trim() === '') {
      errors.push('Merchant name is required');
    }
    
    if (!data.amount || data.amount <= 0) {
      errors.push('Valid amount is required');
    }
    
    if (!data.date) {
      errors.push('Date is required');
    }
    
    if (data.confidence < 0.5) {
      errors.push('Low confidence in extracted data');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Get suggestions for improving scan quality
  getScanQualitySuggestions(): string[] {
    return [
      'Ensure good lighting when taking photos',
      'Keep the receipt flat and avoid wrinkles',
      'Make sure all text is clearly visible',
      'Avoid shadows and reflections',
      'Take the photo straight on, not at an angle',
      'Ensure the receipt fills most of the frame',
    ];
  }

  // Process receipt and create transaction
  async processReceiptToTransaction(receiptData: ReceiptData): Promise<{
    success: boolean;
    transaction?: any;
    error?: string;
  }> {
    try {
      const validation = this.validateReceiptData(receiptData);
      
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      const transaction = {
        id: `receipt_${Date.now()}`,
        amount: receiptData.amount,
        description: `${receiptData.merchant} - Receipt Scan`,
        category: receiptData.category,
        type: 'expense' as const,
        date: receiptData.date,
        createdAt: new Date().toISOString(),
        source: 'receipt_scan',
        confidence: receiptData.confidence,
        items: receiptData.items,
      };

      return {
        success: true,
        transaction,
      };
    } catch (error) {
      console.error('Error processing receipt to transaction:', error);
      return {
        success: false,
        error: 'Failed to process receipt data',
      };
    }
  }
}

export default ReceiptScannerService;

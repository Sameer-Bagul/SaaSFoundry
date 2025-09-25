import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { ITransaction } from '../../shared/schema';
import { IUser } from '../models/User';

export class InvoiceService {
  private static readonly INVOICE_DIR = path.join(process.cwd(), 'invoices');

  static async generateInvoice(transaction: ITransaction, user: IUser): Promise<string> {
    // Ensure invoice directory exists
    if (!fs.existsSync(this.INVOICE_DIR)) {
      fs.mkdirSync(this.INVOICE_DIR, { recursive: true });
    }

    const invoiceNumber = `INV-${transaction.transactionId}`;
    const fileName = `${invoiceNumber}.pdf`;
    const filePath = path.join(this.INVOICE_DIR, fileName);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Company Info
    doc.fontSize(12).text('SaaS Foundry', { align: 'right' });
    doc.fontSize(10).text('123 Business Street', { align: 'right' });
    doc.text('Tech City, TC 12345', { align: 'right' });
    doc.text('Email: support@saasfoundry.com', { align: 'right' });
    doc.moveDown();

    // Invoice Details
    doc.fontSize(14).text(`Invoice No: ${invoiceNumber}`, { align: 'left' });
    doc.fontSize(10).text(`Date: ${new Date(transaction.createdAt).toLocaleDateString()}`, { align: 'left' });
    doc.moveDown();

    // User Details
    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10);
    doc.text(`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username);
    doc.text(`Email: ${user.email}`);
    if (user.phone) doc.text(`Mobile: ${user.phone}`);
    doc.text(`Country: N/A`);
    doc.moveDown();

    // Payment Details
    doc.fontSize(12).text('Payment Details:', { underline: true });
    doc.fontSize(10);
    doc.text(`Razorpay Payment ID: ${transaction.razorpayPaymentId || 'N/A'}`);
    doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString()}`);
    doc.text(`Status: ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}`);
    doc.moveDown();

    // Transaction Details Table
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidth = 150;

    // Table Header
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Description', tableLeft, tableTop);
    doc.text('Quantity', tableLeft + colWidth, tableTop);
    doc.text('Unit Price', tableLeft + colWidth * 2, tableTop);
    doc.text('Amount', tableLeft + colWidth * 3, tableTop);

    // Table Row
    doc.fontSize(10).font('Helvetica');
    const rowY = tableTop + 20;
    doc.text(transaction.packageName, tableLeft, rowY);
    doc.text(transaction.tokens.toString(), tableLeft + colWidth, rowY);
    doc.text(`${transaction.currency === 'INR' ? '₹' : '$'}${(transaction.amount / transaction.tokens).toFixed(2)}`, tableLeft + colWidth * 2, rowY);
    doc.text(`${transaction.currency === 'INR' ? '₹' : '$'}${transaction.amount.toFixed(2)}`, tableLeft + colWidth * 3, rowY);

    // Total
    const totalY = rowY + 40;
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total:', tableLeft + colWidth * 2, totalY);
    doc.text(`${transaction.currency === 'INR' ? '₹' : '$'}${transaction.amount.toFixed(2)}`, tableLeft + colWidth * 3, totalY);

    // Footer
    doc.fontSize(8).font('Helvetica');
    doc.text('Thank you for your business!', 50, doc.page.height - 100, {
      align: 'center',
      width: doc.page.width - 100
    });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(fileName));
      stream.on('error', reject);
    });
  }

  static getInvoicePath(fileName: string): string {
    return path.join(this.INVOICE_DIR, fileName);
  }

  static invoiceExists(fileName: string): boolean {
    const filePath = this.getInvoicePath(fileName);
    return fs.existsSync(filePath);
  }
}

export default InvoiceService;
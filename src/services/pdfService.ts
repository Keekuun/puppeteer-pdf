import puppeteer, {Browser} from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import htmlTemplate from '@/templates/invoice.hbs?raw';

// 定义数据类型，享受TypeScript的好处
interface BillData {
  orderId: string;
  customer: { name: string };
  issueDate: string;
  items: { name: string; quantity: number; price: string; total: string }[];
  totalAmount: string;
}

// 缓存编译后的模板以提高性能
let compiledTemplate: handlebars.TemplateDelegate | null = null;
// const templatePath = path.join(__dirname, '../templates/invoice.hbs');

async function getTemplate() {
  if (!compiledTemplate) {
    // const templateHtml = await fs.readFile(templatePath, 'utf-8');
    compiledTemplate = handlebars.compile(htmlTemplate);
  }
  return compiledTemplate;
}

export const generatePdfFromData = async (
  data: BillData
): Promise<{ buffer: Uint8Array<ArrayBufferLike>; filePath: string }> => {
  const template = await getTemplate();
  const finalHtml = template(data);
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });
    // --- 新增的保存文件逻辑 ---
    // 1. 定义临时目录的路径 (__dirname -> 'src/services', 所以需要../..回到根目录)
    // const tempDir = path.join(__dirname, '../../temp');
    const tempDir = path.join(process.cwd(), 'temp');
    // 2. 确保目录存在, recursive: true 避免了目录已存在时的错误
    await fs.mkdir(tempDir, { recursive: true });
    // 3. 创建一个唯一的文件名
    const fileName = `invoice-${data.orderId}-${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);
    // 4. 将 buffer 写入文件
    await fs.writeFile(filePath, pdfBuffer);
    console.log(`PDF successfully saved to: ${filePath}`);
    // 5. 返回 Buffer 和文件路径
    return { buffer: pdfBuffer, filePath: filePath };
    // --- 逻辑新增结束 ---
  } catch (error) {
    console.error('PDF generation or saving failed:', error);
    throw new Error('Could not generate or save PDF.');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

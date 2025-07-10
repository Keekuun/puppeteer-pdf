import puppeteer, {Browser} from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import handlebars from 'handlebars';
import htmlTemplate from '@/templates/table.hbs?raw';

export interface ReportItem {
  id: number;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReportData {
  reportTitle: string;
  orderId: string;
  companyName: string;
  customer: {
    name: string;
    address: string;
  };
  items: ReportItem[];
  grandTotal: number;
}

// 缓存编译后的模板以提高性能
let compiledTemplate: handlebars.TemplateDelegate | null = null;
/**
 * 根据数据和模板生成最终的 HTML 字符串。
 * @param data - 报告所需的数据
 * @returns {Promise<string>} 渲染完成的 HTML 字符串
 */
export const generateHtmlFromData = async (data: ReportData): Promise<string> => {
  // 1. 编译 Handlebars 模板
  if (!compiledTemplate) {
    compiledTemplate = handlebars.compile(htmlTemplate);
  }

  // 2. 准备所有模板需要的数据，包括 Base64 编码的图片
  const logoPath = path.join(process.cwd(), 'src/assets/images/logo.png');
  const logoImageBase64 = await getImageAsBase64(logoPath);

  const contentImgPath = path.join(process.cwd(), 'src/assets/images/test.png');
  const contentImageBase64 = await getImageAsBase64(contentImgPath);

  // Combine report data with assets and other dynamic info
  const templateData = {
    ...data,
    logoImage: logoImageBase64,
    contentImage: contentImageBase64,
    year: new Date().getFullYear(),
  };

  // 3. 渲染并返回 HTML 字符串
  return compiledTemplate(templateData);
};

/**
 * 接收报告数据，生成 PDF 文件并返回 Buffer。
 * 它现在专注于 Puppeteer 的操作。
 * @param data - 报告所需的数据
 * @returns PDF Buffer 和文件路径
 */
export const generatePdfFromData = async (
  data: ReportData
): Promise<{ buffer: Uint8Array<ArrayBufferLike>; filePath: string }> => {

  // 1. 调用新函数来获取 HTML 内容
  const finalHtml = await generateHtmlFromData(data);

  console.log('--- HTML content fed to Puppeteer ---');

  // 2. 剩下的部分专注于 Puppeteer 的工作
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      // ✨ 关闭无头模式来进行可视化调试
      // headless: false,
      // 增加一个延迟，让你有时间看清楚窗口里的内容
      // slowMo: 250,
    });

    const page = await browser.newPage();

    // 增加监听，捕获页面内的任何错误
    page.on('pageerror', error => {
      console.error('Puppeteer page error:', error.message);
    }).on('requestfailed', request => {
      console.error(`Puppeteer request failed: ${request.url()} (${request.failure()?.errorText})`);
    });

    await page.setContent(finalHtml, {waitUntil: 'networkidle0'});

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      // 定义pdf头部
      headerTemplate: `<div style="font-size: 10px; color: #6c757d; width: 100%; display: flex; justify-content: space-between; padding: 0 30px; box-sizing: border-box; border-bottom: 1px solid #000">
        页面头部标题
      </div>`,
      // 定义pdf页脚
      footerTemplate: `
      <div style="font-size: 10px; color: #6c757d; width: 100%; display: flex; justify-content: space-between; padding: 0 30px; box-sizing: border-box;">
        <span>报告生成日期: ${new Date().toString()}</span>
        <span>第 <span class="pageNumber"></span> 页 / 共 <span class="totalPages"></span> 页</span>
      </div>
    `,
      margin: {
        top: '100px',
        bottom: '60px',
        left: '30px',
        right: '30px'
      }
    });

    // ✨ Buffer 大小
    console.log(`Generated PDF Buffer Size: ${pdfBuffer.length} bytes`);
    // 添加一个显式的错误检查
    if (!pdfBuffer || pdfBuffer.length < 100) { // 小于100字节的PDF基本都是无效的
      throw new Error('PDF generation resulted in an empty or invalid buffer.');
    }

    // 文件保存
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, {recursive: true});
    const fileName = `report-${data.orderId}-${Date.now()}.pdf`;
    const filePath = path.join(tempDir, fileName);
    await fs.writeFile(filePath, pdfBuffer);
    console.log(`PDF successfully saved to: ${filePath}`);

    return {buffer: pdfBuffer, filePath: filePath};

  } catch (error) {
    console.error('PDF generation or saving failed:', error);
    throw new Error('Could not generate or save PDF.');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// getImageAsBase64 函数定义...
const getImageAsBase64 = async (imagePath: string): Promise<string> => {
  try {
    const ext = path.extname(imagePath).toLowerCase();
    let mimeType;
    switch (ext) {
      case '.png':
        mimeType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.svg':
        mimeType = 'image/svg+xml';
        break;
      case '.webp':
        mimeType = 'image/webp';
        break;
      default:
        throw new Error(`Unsupported image type: ${ext}`);
    }
    const fileBuffer = await fs.readFile(imagePath);
    const base64String = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error(`Error reading image file at ${imagePath}:`, error);
    return '';
  }
};

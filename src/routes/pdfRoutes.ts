import {Router, Request, Response} from 'express';
import {generatePdfFromData} from '@/services/pdfService';
import {
  generateHtmlFromData,
  generatePdfFromData as generateTablePdfFromData,
  ReportData
} from '@/services/pdfTableService';
import path from "path";

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  const {billId} = req.body;

  if (!billId) {
    return res.status(400).json({success: false, message: 'Missing billId'});
  }

  try {
    // ---- 模拟数据库查询 ----
    const billData = {
      orderId: billId,
      customer: {name: '未来科技有限公司'},
      issueDate: new Date().toLocaleDateString('zh-CN'),
      items: [
        {name: '云主机 Pro', quantity: 2, price: '¥199.00', total: '¥398.00'},
        {name: '对象存储 Plus', quantity: 1, price: '¥50.00', total: '¥50.00'},
        {name: '数据库服务 Basic', quantity: 1, price: '¥120.00', total: '¥120.00'},
      ],
      totalAmount: '¥568.00',
    };
    // -------------------------

    const {buffer: pdfBuffer, filePath} = await generatePdfFromData(billData);

    console.log(`file path: ${filePath}. Buffer size: ${pdfBuffer.length} bytes.`);
    // ---- 模拟上传到云存储并获取URL ----
    const fileName = `invoice-${billId}-${Date.now()}.pdf`;
    console.log(`Generated ${fileName}. Buffer size: ${pdfBuffer.length} bytes.`);
    // 在真实场景中，你会在这里调用 AWS S3, Aliyun OSS等のSDK上传pdfBuffer
    const mockCdnUrl = `https://your-cdn.com/pdfs/${fileName}`;
    // ------------------------------------

    // **方案A：返回URL (推荐)**
    res.status(200).json({success: true, url: mockCdnUrl, path: filePath});

    /*
    // **直接将文件流发给前端下载**
    // 如果你不想用云存储，也可以这样，但这会占用服务器带宽
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.end(pdfBuffer);
    */

  } catch (error) {
    console.error(`Error processing bill ${billId}:`, error);
    res.status(500).json({success: false, message: 'Internal Server Error'});
  }
});

// mock data
const createSampleData = (): ReportData => {
  const items = [];
  let grandTotal = 0;
  for (let i = 1; i <= 80; i++) {
    const quantity = Math.floor(Math.random() * 5) + 1;
    const price = parseFloat((Math.random() * 100 + 10).toFixed(2));
    const total = parseFloat((quantity * price).toFixed(2));
    items.push({id: i, description: `Service or Product #${i} - Lorem ipsum dolor sit amet`, quantity, price, total});
    grandTotal += total;
  }
  return {
    reportTitle: 'Annual Activity Report',
    orderId: 'ORD-2023-12345',
    companyName: 'TechInnovate Inc.',
    customer: {name: 'John Doe Corp.', address: '123 Innovation Drive, Tech City, 12345'},
    items,
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
};

router.get('/table/preview', async (req, res) => {
  try {
    // 1. 生成同样的示例数据
    const sampleData = createSampleData();

    // 2. 调用只生成 HTML 的服务函数
    const htmlContent = await generateHtmlFromData(sampleData);

    // 3. 设置正确的 Content-Type 为 text/html
    res.setHeader('Content-Type', 'text/html');

    // 4. 将 HTML 字符串发送给浏览器
    res.send(htmlContent);

  } catch (error) {
    console.error("HTML preview generation failed:", error);
    res.status(500).send('An error occurred while generating the HTML preview.');
  }
});

router.get('/table/generate', async (req, res) => {
  try {
    const sampleData = createSampleData();
    const {buffer, filePath} = await generateTablePdfFromData(sampleData);
    // 1. 设置正确的 Content-Type，明确告诉浏览器这是一个PDF文件
    res.setHeader('Content-Type', 'application/pdf');
    // 2. 设置 Content-Disposition，让浏览器弹出下载框，并指定文件名
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
    // 3. (可选但推荐) 设置 Content-Length，让浏览器知道文件大小，可以显示下载进度
    res.setHeader('Content-Length', buffer.length);
    // res.send 会做一些额外的处理，导致浏览器访问该路由生成的pdf损坏了，无法打开
    res.end(buffer)
  } catch (error) {
    console.error("PDF generation failed:", error instanceof Error ? error.message : error);
    res.status(500).send('An error occurred while generating the PDF.');
  }
});


export default router;

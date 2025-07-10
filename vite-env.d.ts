/// <reference types="vite/client" />

// 在文件末尾添加以下声明
declare module '*?raw' {
  const content: string;
  export default content;
}

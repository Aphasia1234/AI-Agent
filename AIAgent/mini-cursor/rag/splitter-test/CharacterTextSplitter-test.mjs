import "dotenv/config";
// CharacterTextSplitter是按固定分隔符“一刀切”的简单分割器，
// 而 RecursiveCharacterTextSplitter 则是会“层层递进”尝试保留语义的智能分割器
import { 
    //CharacterTextSplitter 
    RecursiveCharacterTextSplitter
    } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import {
    getEncodingNameForModel,
    getEncoding 
} from "js-tiktoken";

// 日志文件
const logDocument = new Document({
    pageContent:`
    Error: Cannot find module 'D:\DeskTop\AI-Agent\AIAgent\mini-cursor\rag\splitter-test\titoken-test.mjs'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1207:15)
    at Module._load (node:internal/modules/cjs/loader:1038:27)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12)
    at node:internal/main/run_main_module:28:49 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}
  INFO: 用户登录模块检测到异常访问行为，源IP地址为 192.168.1.105，地理位置定位为境外。该 IP 在过去 5 分钟内发起了 237 次登录请求，其中失败次数为 198 次，成功次数为 0 次。系统初步判断为暴力破解攻击，已自动触发安全防御机制：临时封锁该 IP 访问权限 30 分钟，并向管理员邮箱发送告警通知。与此同时，数据库连接池出现高负载情况，当前活跃连接数为 45，最大连接数为 50。建议开发团队检查是否存在未释放的连接泄漏问题，并考虑优化慢查询 SQL 语句。监控系统将持续跟踪该异常状态，每 10 秒刷新一次指标数据。
    `
})

const logSplitter = new RecursiveCharacterTextSplitter({
    separators: ['\n','。','！','，'],
    chunkSize: 100,
    chunkOverlap: 10,
})

const logChunks = await logSplitter.splitDocuments([logDocument]);
//console.log(logChunks);

const enc = getEncoding("cl100k_base");
logChunks.forEach(doc => {
    console.log(doc);
    console.log('character length',doc.pageContent.length);
    console.log('token length',enc.encode(doc.pageContent).length);
})
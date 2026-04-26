import {
   InMemoryChatMessageHistory
} from '@langchain/core/chat_history'
import {
    HumanMessage,
    AIMessage,
    trimMessages,
    //SystemMessage
} from '@langchain/core/messages'
import {
    getEncoding
} from 'js-tiktoken';

async function messageCountTruncation() {
    const history = new InMemoryChatMessageHistory();
    const maxMessages = 4;

    const messages = [
        {type:'human', content:'你好'},
        {type:'ai', content:'你好，我是cursor'},
        {type:'human', content:'我今年18岁'},
        {type:'ai', content:'18岁正是青春年华，有什么问题我可以帮助你吗？'},
        {type:'human', content:'我喜欢编程'},
        {type:'ai', content:'编程是一个非常有趣的事情，你主要学习什么编程语言？'},
        {type:'human', content:'我主要学习JavaScript'},
        {type:'ai', content:'JavaScript是一个非常流行的编程语言，它可以在浏览器和服务器端运行'},
        {type:'human', content:'我最近在学习React'},
        {type:'ai', content:'React是一个非常流行的前端框架，它可以帮助你构建单页应用程序'}
    ];
    // 模拟添加消息到历史记录
    for(const msg of messages){
        if(msg.type === 'human'){
            await history.addMessage(new HumanMessage(msg.content));
        }else{
            await history.addMessage(new AIMessage(msg.content));
        }
    }
    // 打印所有消息
    let allMessages = await history.getMessages();
    console.log('所有消息:', allMessages);
    // 修剪消息
    const trimmedMessages = allMessages.slice(-maxMessages);
    console.log('修剪后的消息:', trimmedMessages.map(m =>`
        ${m.constructor.name}:${m.content}
        `).join("."));
}

async function runAll() {
    await messageCountTruncation();// 消息的条目
}

runAll()
   .catch(console.error);

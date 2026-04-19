// exec 执行命令
import {
    spawn
    //node 内置模块
    // 创建一个子进程
    // 进程：分配资源的最小单位
    // 线程：执行的最小单位
    // 主进程： node
    // cmd 本身就是进程
} from 'node:child_process';
// bash 命令
const command = 'ls -la';
// 新建一个子进程来执行命令
const [cmd,...args]=command.split(' ');
const cwd = process.cwd();
console.log(`当前工作目录:${cwd}`);
// 并发
const child = spawn(cmd,args,{
    cwd,
    // 继承父进程的输入输出流
    stdio:'inherit',
    // shell执行命令
    shell:true
});

let errorMsg='';
//进程间的通信 基于事件
child.on('error',(error)=>{
    errorMsg=error.message;
});

child.on('close',(code)=>{
    if(code===0){
        console.log('命令执行成功');
        process.exit(0);
    }else{
        if(errorMsg){
            console.log(`错误:${errorMsg}`);
        }
        process.exit(code||1);
    }
})
// 观察者模式是经典的设计模式
import {
    Observable
} from 'rxjs';
// 创建了一个Observable对象
// 参数是一个回调函数
// subscriber 观察者对象，有next、error、complete 方法
const stream = new Observable((subscriber)=>{
    // next 发送数据
    // complete 完成事件
    subscriber.next('hello');
    subscriber.next('world');
    subscriber.complete();
});

// 订阅数据流
stream.subscribe((data)=>{
    console.log(data);
});

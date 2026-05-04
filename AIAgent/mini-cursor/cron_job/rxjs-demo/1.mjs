import {
    from
} from 'rxjs';
// from 方法将数组转换为Observable对象
const stream = from([1,2,3]);
// 订阅数据流
stream.subscribe(v => console.log(v));

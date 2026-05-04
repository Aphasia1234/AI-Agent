function *fruitGenerator(){
    console.log('开始生产水果');
    yield '苹果';
    console.log('继续生产水果');
    yield '香蕉';
    console.log('生成完成');
    return '所有水果都生产完成';
}
// 迭代器对象
const fruitMachine = fruitGenerator();
// 调用next方法，获取第一个值
console.log(fruitMachine.next());
// 调用next方法，获取第二个值
console.log(fruitMachine.next().value);
console.log(fruitMachine.next());

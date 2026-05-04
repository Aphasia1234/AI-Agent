import { Injectable } from '@nestjs/common';

// interface 只能定义对象
// type 可以定义简单数据类型
type User = {
    id: string;
    name: string;
    email: string;
    role: string;
}

@Injectable()
export class UserService {
    private readonly users = new Map<string,User>([
        ['001',{id:'001',name:'张三',email:'zhangsan@example.com',role:'user'}],
        ['002',{id:'002',name:'李四',email:'lisi@example.com',role:'user'}],
        ['003',{id:'003',name:'王五',email:'wangwu@example.com',role:'admin'}],
        ['004',{id:'004',name:'赵六',email:'zhaoliu@example.com',role:'user'}],
        ['005',{id:'005',name:'王二',email:'wanger@example.com',role:'user'}]
    ])

    findAll():User[]{
        return Array.from(this.users.values());
    }
    findOne(id:string):User | undefined{
        return this.users.get(id);
    }

    create(user:User):User{
        this.users.set(user.id,user);
        return user;
    }
    // Partial 表示可选的属性
    // Omit 表示排除 id 属性
    update(id: string,partial: Partial<Omit<User,'id'>>):User | undefined{
        const user = this.users.get(id);
        if(user){
            Object.assign(user,partial);
            this.users.set(id,user);
        }
        return user;
    }
}

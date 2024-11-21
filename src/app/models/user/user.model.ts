export class User {
    name: string;
    email: string;
    password: string;
    id?: string;
    avatar: string;
    online: boolean;
    authenticated: boolean;

    constructor(obj?: any) {
        this.name = obj ? obj.name : '';
        this.email = obj ? obj.email : '';
        this.password = obj ? obj.password : '';
        this.avatar = obj ? obj.avatar : '';
        this.online = obj ? obj.online : false;
        this.authenticated = obj ? obj.authenticated : false;
        this.id = obj ? obj.id : '';
    }

    toJSON() {
        return {
            name: this.name,
            email: this.email,
            avatar: this.avatar,
            online: this.online
        };
    }
}

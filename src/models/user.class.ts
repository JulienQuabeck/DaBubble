export class User {
    id: string;
    name: string;
    mail: string;
    password: string;
    avatar: string;
    online: boolean;

    constructor(obj?: any) {
        this.id = obj ? obj.id: '';
        this.name = obj ? obj.name:'';
        this.mail = obj ? obj.email: '';
        this.password = obj ? obj.passwort: '';
        this.avatar = obj ? obj.avatar: '';
        this.online = obj ? obj.status: '';
    }
}
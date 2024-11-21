export class Channel {
  channel_id: string;
  channel_name: string;
  description: string;
  admin: string;
  chosen: boolean;
  thread_open: boolean;

  constructor(obj?: any) {
    this.channel_id = obj && obj.channel_id ? obj.channel_id : '';
    this.channel_name = obj && obj.channel_name ? obj.channel_name : '';
    this.description = obj && obj.description ? obj.description : '';
    this.admin = obj && obj.admin ? obj.admin : '';
    this.chosen = obj && obj.chosen ? obj.chosen : false;
    this.thread_open = obj && obj.thread_open ? obj.thread_open : false;
  }

  toJSON() {
    return {
      channel_id: this.channel_id,
      channel_namename: this.channel_name,
      description: this.description,
      admin: this.admin,
      chosen: this.chosen,
      thread_open: this.thread_open
    };
  }
}

import { Message } from "./channel-message.model";

export class ThreadMessage extends Message {
    channelId: string;
    messageId: string;
    threadId: string;

    constructor(obj?: any) {
        super(obj);
        this.channelId = obj && obj.channelId ? obj.channelId : '';
        this.messageId = obj && obj.messageId ? obj.messageId : '';
        this.threadId = obj && obj.threadId ? obj.threadId : '';
    }
}

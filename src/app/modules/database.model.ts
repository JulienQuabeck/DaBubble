import { SafeResourceUrl } from '@angular/platform-browser';
import { nanoid } from 'nanoid';

////////////// MODEL FOR USER ///////////////////////////////
export class User {
  id!: string;
  name!: string;
  email!: string;
  password!: string;
  online!: boolean;
  thread_open!: boolean;
  activeChannelId!: string;
  avatar!: string;

  constructor(obj?: any) {
    this.id = obj ? obj.id || nanoid() : '';
    this.name! = obj ? obj.name : '';
    this.email = obj ? obj.email : '';
    this.password = obj ? obj.password : '';
    this.online = obj ? obj.online : false;
    this.thread_open = obj ? obj.thread_open : false;
    this.activeChannelId = obj ? obj.activeChannelId : '';
    this.avatar = obj ? obj.avatar : '';
  }

  public toObject() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      password: this.password,
      online: this.online,
      thread_open: this.thread_open,
      activeChannelId: this.activeChannelId,
      avatar: this.avatar,
    };
  }
}

///////////// MODEL FOR DIRECT MESSAGES ////////////////////////////////////////////
export class Message {
  message_id!: string;
  message_content!: string;
  response_content!: string;
  from_user_origin!: string;
  send_date!: number;
  from_user!: string;
  to_user!: string;
  is_updated!: boolean;
  reaction!: string;
  fileName!: string;
  fileUrl!: string;
  // fileType!: string | null;

  constructor(obj?: any) {
    this.message_id = obj ? obj.message_id || nanoid() : '';
    this.message_content = obj ? obj.message_content : '';
    this.response_content = obj ? obj.response_content || '' : '';
    this.from_user_origin = obj ? obj.from_user_origin || '' : '';
    this.send_date = obj ? obj.send_date || Date.now() : '';
    this.from_user = obj ? obj.from_user || '' : '';
    this.to_user = obj ? obj.to_user || '' : '';
    this.is_updated = obj ? obj.is_updated || false : '';
    this.reaction = obj ? obj.reaction || '' : '';
    this.fileName = obj ? obj.fileName || null : '';
    this.fileUrl = obj ? obj.fileUrl || null : null;
    // this.fileType = obj ? obj.fileType || null : null;
  }

  public toObject(): object {
    return {
      message_id: this.message_id,
      message_content: this.message_content,
      response_content: this.response_content,
      from_user_origin: this.from_user_origin,
      send_date: this.send_date,
      from_user: this.from_user,
      to_user: this.to_user,
      is_updated: this.is_updated,
      reaction: this.reaction,
      fileName: this.fileName,
      fileUrl: this.fileUrl,
      // fileType: this.fileType,
    };
  }
}

////////////// MODEL FOR CHANNELS /////////////////////////////

export class Channel {
  channel_id!: string;
  channel_name!: string;
  created_at!: number;
  description!: string;
  admin!: string;
  thread_open!: boolean;
  chosen!: boolean;
  is_deleted!: boolean;
  member!: string | undefined[];

  constructor(obj?: any) {
    this.channel_id = obj ? obj.channel_id || nanoid() : '';
    this.channel_name = obj ? obj.channel_name : '';
    this.created_at = obj ? obj.created_at || Date.now() : '';
    this.description = obj ? obj.description || 'Dieser Channel hat noch keine Beschreibung.' : '';
    this.admin = obj ? obj.admin : '';
    this.thread_open = obj ? obj.thread_open || false : '';
    this.chosen = obj ? obj.chosen || false : '';
    this.is_deleted = obj ? obj.is_deleted || false : '';
    this.member = obj ? obj.member || [] : [];
  }

  public toObject() {
    return {
      channel_id: this.channel_id,
      channel_name: this.channel_name,
      created_at: this.created_at,
      description: this.description,
      admin: this.admin,
      thread_open: this.thread_open,
      chosen: this.chosen,
      is_deleted: this.is_deleted,
      member: this.member,
    };
  }
}

////////////// MODEL FOR CHANNEL MEMBERS /////////////////////////////

export class ChannelMember {
  member_id!: string;
  channel_id!: string;
  joined_date!: number;
  left_date!: number;

  constructor(obj?: any) {
    this.member_id = obj ? obj.member_id || 'Unknown' : '';
    this.channel_id = obj ? obj.channel_id : '';
    this.joined_date = obj ? obj.joined_date || Date.now() : '';
    this.left_date = obj ? obj.left_date || new Date('9999-10-05T17:13:16.804Z').getTime() : '';
  }

  public toObject(): object {
    return {
      member_id: this.member_id,
      channel_id: this.channel_id,
      joined_date: this.joined_date,
      left_date: this.left_date,
    };
  }
}

/////// MODEL FOR EMOJIS ////////////////////

export class Emoji {
  id!: string;
  message_id!: string;
  user_id!: string;
  description!: string;
  occurrence!: number;

  constructor(obj?: any) {
    this.id = obj ? obj.id || nanoid() : '';
    this.message_id = obj ? obj.message_id : '';
    this.user_id = obj ? obj.user_id : '';
    this.description = obj ? obj.description : '';
    this.occurrence = obj ? obj.occurrence || 0 : 0;
  }

  public toObject(): object {
    return {
      id: this.id,
      message_id: this.message_id,
      user_id: this.user_id,
      description: this.description,
      occurrence: this.occurrence,
    };
  }
}

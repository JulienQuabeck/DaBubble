import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { OwnMessageComponent } from '../own-message/own-message.component';
import { ChatServiceService } from '../../firestore-service/chat-service.service';
import { MainServiceService } from '../../firestore-service/main-service.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileUploadService } from '../../firestore-service/file-upload.service';
import { AuthService } from '../../firestore-service/auth.service';
import { ChatareaServiceService } from '../../firestore-service/chatarea-service.service';
import { ReactionService } from '../../firestore-service/reaction.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [MatIconModule, CommonModule, OwnMessageComponent],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss'
})
export class MessageComponent {
  @Input() message: any;
  @Input() previousMessageDate: string | null = null;

  uid: string | null = null;
  channelId: string = '';
  answerCount: number = 0;
  lastAnswerTime: string | null = null;
  allReactions: boolean = false;
  reactionNames: string[] = [];
  fileType: string | null = null;
  fileURL: SafeResourceUrl | null = null;
  fileName: string | null = null;
  avatar: string | null = null;
  messageEdited: boolean = false;

  private sanitizer = inject(DomSanitizer);

  constructor(private chatService: ChatServiceService, private reactionService: ReactionService, private mainService: MainServiceService, private fileUploadService: FileUploadService, private authService: AuthService, private chatAreaService: ChatareaServiceService) { }

  ngOnInit() {
    this.uid = this.authService.getUID();
    this.loadFileUpload();
    this.loadActiveChannelId();
    this.loadReactionNames();
    this.loadAvatar();
  }

  loadAvatar() {
    const docId = this.message.senderId;
    this.chatAreaService.getUserAvatar(docId).subscribe((avatar) => {
      this.avatar = avatar;
    });
  }

  async loadFileUpload() {
    if (this.message.fileName) {
      this.fileType = this.fileUploadService.getFileTypeFromFileName(this.message.fileName)
      this.fileName = this.message.fileName
      this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.message.fileUrl)
    }
  }

  async loadReactionNames() {
    if (this.message.reactions && this.message.reactions.length > 0) {
      for (let reaction of this.message.reactions) {
        const names = [];
        let currentUserIncluded = false;
        for (let id of reaction.userId) {
          if (id === this.uid) {
            currentUserIncluded = true;
          } else {
            const name = await this.chatService.getUserNameByUid(id);
            names.push(name);
          }
        }
        if (currentUserIncluded) {
          if (names.length === 0) {
            this.reactionNames.push('Du');
          } else if (names.length === 1) {
            this.reactionNames.push(`Du und ${names[0]}`);
          } else {
            this.reactionNames.push(`Du und ${names.length} weitere`);
          }
        } else {
          this.reactionNames.push(names.join(' und '));
        }
      }
    }
  }

  loadThreadDetails() {
    if (this.message && this.channelId) {
      this.chatService.getThreadDetails(this.channelId, this.message.id, (count, lastMessageTime) => {
        this.answerCount = count;
        this.lastAnswerTime = lastMessageTime ? this.mainService.formatTime(lastMessageTime) : null;
      });
    }
  }

  openThread(messageId: string) {
    this.chatService.setThreadDataFromMessage(this.uid!, this.channelId, messageId);
  }

  loadActiveChannelId() {
    this.chatAreaService.getActiveChannel().subscribe({
      next: (channel: any) => {
        this.channelId = channel.id;
        this.loadThreadDetails();
      },
      error: (err) => {
        console.error('Fehler beim Laden des aktiven Channels:', err);
      }
    });
  }

  openReactions() {
    this.allReactions = !this.allReactions;
  }

  reactToMessage(messageId: string, emoji: string, path: string) {
    this.openReactions();
    if (!this.channelId) {
      console.error('Keine Channel-ID vorhanden.');
      return;
    }
    this.reactionService.addReactionToMessage(this.channelId, messageId, emoji, this.uid!)
  }

  formatTime(timeString: string): string {
    return this.mainService.formatTime(timeString);
  }

  formatDate(dateString: string): string {
    return this.mainService.formatDate(dateString);
  }
}

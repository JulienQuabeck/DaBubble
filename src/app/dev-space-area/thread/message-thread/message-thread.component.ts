import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChatServiceService } from '../../../firestore-service/chat-service.service';
import { MatMenu } from '@angular/material/menu';
import { MainServiceService } from '../../../firestore-service/main-service.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileUploadThreadService } from '../../../firestore-service/file-upload-thread.service';
import { ChatareaServiceService } from '../../../firestore-service/chatarea-service.service';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../firestore-service/auth.service';

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [MatIconModule, CommonModule, MatMenu],
  templateUrl: './message-thread.component.html',
  styleUrl: './message-thread.component.scss'
})
export class MessageThreadComponent implements OnInit, OnDestroy {
  @ViewChild('reactionContainer') reactionContainer!: ElementRef;
  private sanitizer = inject(DomSanitizer);
  private uidSubscription: Subscription | null = null;

  @Input() thread: any;
  @Input() id: string = '';
  @Input() showReactionIcon: boolean = false;

  threadData: any;
  threadMessages: any[] = [];
  fileType: string | null = null;
  fileURL: SafeResourceUrl | null = null;
  fileName: string | null = null;
  avatar: string | null = null;
  uid: string | null = null;
  reactionNames: string[] = [];
  showReactions: boolean = false;
  reactions: any[] = [];

  constructor(private chatService: ChatServiceService, private mainService: MainServiceService, private fileUploadServiceThread: FileUploadThreadService, private chatareaService: ChatareaServiceService, private authService: AuthService) {
    this.chatService.pickedThread$.subscribe((data) => {
      if (data) {
        this.threadData = data;
      }
    });
  }

  ngOnInit() {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.uid = uid;
    });
    this.loadFileUpload();
    this.loadReactionNames();
    this.loadThreadMessages();
    this.loadUserAvatar();
    this.loadFileUpload();
  }

  ngOnDestroy() {
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
  }

  toggleReactions() {
    this.showReactions = !this.showReactions
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (this.showReactions && this.reactionContainer) {
      const clickedInside = this.reactionContainer.nativeElement.contains(event.target);
      const isMatIcon = (event.target as HTMLElement).closest('mat-icon') !== null;
      if (!clickedInside && !isMatIcon) {
        this.showReactions = false;
      }
    }
  }

  async loadReactionNames() {
    if (this.thread.reactions && this.thread.reactions.length > 0) {
      for (let reaction of this.thread.reactions) {
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

  loadUserAvatar() {
    this.chatareaService.getUserAvatar(this.thread.senderId).subscribe(avatar => {
      this.avatar = avatar;
    });
  }

  async loadFileUpload() {
    if (this.thread.fileName) {
      this.fileType = this.fileUploadServiceThread.getFileTypeFromFileName(this.thread.fileName)
      this.fileName = this.thread.fileName
      this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.thread.fileUrl)
    }
  }

  loadThreadMessages(): void {
    const { channelId, messageId, id: threadId } = this.threadData;
    this.chatService.loadThreadMessages(channelId, messageId, threadId).then((messages) => {
      this.threadMessages = messages;
    });
  }

  reactToThreadMessage(reactionType: string, path: string, id: string): void {
    const { channelId, messageId, id: threadId } = this.threadData;
    if (channelId && messageId && threadId && id) {
      this.chatService.addReactionToThreadMessage(channelId, messageId, threadId, reactionType, path, id, this.uid!)
    }
  }

  formatTime(timeString: string): string {
    return this.mainService.formatTime(timeString);
  }

  formatDate(dateString: string): string {
    return this.mainService.formatDate(dateString);
  }
}

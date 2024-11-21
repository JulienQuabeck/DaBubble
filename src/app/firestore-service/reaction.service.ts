import { Injectable } from '@angular/core';
import { Firestore, arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, updateDoc, writeBatch } from '@angular/fire/firestore';
import { MainServiceService } from './main-service.service';
import { AuthService } from './auth.service';
import { ChatareaServiceService } from './chatarea-service.service';
import { Message } from '../models/messages/channel-message.model';

@Injectable({
  providedIn: 'root'
})
export class ReactionService {

  constructor(private firestore: Firestore, private mainService: MainServiceService, private authService: AuthService, private chatAreaService: ChatareaServiceService) { }

  /**
 * Loads all available reactions from the Firestore 'reactions' collection.
 * @returns {Promise<any[]>} A promise that resolves with an array of reaction objects.
 */
  async loadReactions(): Promise<any[]> {
    const reactionsRef = this.mainService.getChannelRef('reactions');
    const snapshot = await getDocs(reactionsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data()['name'],
      path: doc.data()['path'],
    }));
  }

  async addOrUpdateReaction(reactions: any[], emoji: string, userId: string): Promise<any[]> {
    const existingReaction = reactions.find(reaction => reaction.emoji === emoji);
    if (existingReaction) {
      if (!existingReaction.userId.includes(userId)) {
        existingReaction.userId.push(userId);
        existingReaction.count += 1;
      }
    } else {
      reactions.push({ emoji: emoji, userId: [userId], count: 1 });
    }
    return reactions;
  }


  async addReactionToMessage(channelId: string, messageId: string, emoji: string, userId: string): Promise<void> {
    const messageDocRef = this.mainService.getSingleChannelRef(`channels/${channelId}/messages`, messageId);
    const snapshot = await getDoc(messageDocRef);
    const messageData = snapshot.data();
    const reactions = messageData?.['reactions'] || [];
    const updatedReactions = await this.addOrUpdateReaction(reactions, emoji, userId);
    await updateDoc(messageDocRef, { reactions: updatedReactions });
  }


  /**
   * Checks if a user has already reacted to a message with a specific reaction type.
   * @param {any[]} reactions - The array of reactions.
   * @param {string} reactionType - The type of reaction to check.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<boolean>} A promise that resolves with a boolean indicating whether the user has reacted.
   */
  async hasUserReacted(reactions: any[], reactionType: string, userId: string): Promise<boolean> {
    return reactions.some(reaction => reaction.type === reactionType && reaction.userId === userId);
  }

  async addReactionToThreadMessage(
    channelId: string,
    messageId: string,
    threadId: string,
    emoji: string,
    messageIdThread: string,
    uid: string
  ): Promise<void> {
    const messageDocRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}/threads/${threadId}/messages/${messageIdThread}`);
    const snapshot = await getDoc(messageDocRef);
    const messageData = snapshot.data();
    const reactions = messageData?.['reactions'] || [];
    const updatedReactions = await this.addOrUpdateReaction(reactions, emoji, uid);
    await updateDoc(messageDocRef, { reactions: updatedReactions });
  }

  async updateReactionsInAllThreads(channelId: string, messageId: string, emoji: string, uid: string, count: number) {
    const threadsSnapshot = await getDocs(collection(this.firestore, `channels/${channelId}/messages/${messageId}/threads`));
    const batch = writeBatch(this.firestore);
    threadsSnapshot.forEach(doc => this.updateThreadReactions(doc, emoji, uid, batch));
    await batch.commit();
  }

  private updateThreadReactions(doc: any, emoji: string, uid: string, batch: any) {
    const reactions = doc.data()['reactions'] || [];
    const index = reactions.findIndex((r: any) => r.emoji === emoji);
    if (index !== -1) {
      this.modifyThreadReaction(reactions, index, uid);
    } else {
      reactions.push({ emoji, userId: [uid], count: 1 });
    }
    batch.update(doc.ref, { reactions });
  }

  private modifyThreadReaction(reactions: any[], index: number, uid: string) {
    const reaction = reactions[index];
    const userIdx = reaction.userId.indexOf(uid);
    if (userIdx !== -1) {
      reaction.userId.splice(userIdx, 1);
      reaction.count -= 1;
      if (reaction.count === 0) reactions.splice(index, 1);
    } else {
      reaction.userId.push(uid);
      reaction.count += 1;
    }
  }

  async removeReactionFromMessage(channelId: string, messageId: string, emoji: string, userId: string) {
    const messageDocRef = this.getMessageDocRef(channelId, messageId);
    const reactions = await this.getMessageReactions(messageDocRef);
    const updatedReactions = this.removeUserFromReaction(reactions, emoji, userId);
    if (updatedReactions) await updateDoc(messageDocRef, { reactions: updatedReactions });
  }

  async removeReactionFromThreadMessage(
    channelId: string,
    messageId: string,
    threadId: string,
    emoji: string,
    messageIdThread: string,
    uid: string) {
    const messageDocRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}/threads/${threadId}/messages/${messageIdThread}`);
    const reactions = await this.getMessageReactions(messageDocRef);
    const updatedReactions = this.removeUserFromReaction(reactions, emoji, uid);
    if (updatedReactions) await updateDoc(messageDocRef, { reactions: updatedReactions });
  }

  private getMessageDocRef(channelId: string, messageId: string) {
    return this.mainService.getSingleChannelRef(`channels/${channelId}/messages`, messageId);
  }

  private async getMessageReactions(messageDocRef: any): Promise<any[]> {
    const snapshot = await getDoc(messageDocRef);

    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.data() as Message;
    return data.reactions || [];
  }


  private removeUserFromReaction(reactions: any[], emoji: string, userId: string): any[] | null {
    const index = reactions.findIndex(reaction => reaction.emoji === emoji);
    if (index === -1) return null;

    const reaction = reactions[index];
    const userIdx = reaction.userId.indexOf(userId);
    if (userIdx === -1) return null;

    reaction.userId.splice(userIdx, 1);
    reaction.count -= 1;
    if (reaction.count === 0) reactions.splice(index, 1);
    return reactions;
  }


}

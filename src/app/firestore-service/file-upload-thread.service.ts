import { Injectable, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';

@Injectable({
  providedIn: 'root',
})
export class FileUploadThreadService {
  private firestore = inject(Firestore);
  private maxFileSizeMB: number = 5;
  private isFileSizeValid(fileSize: number): boolean {
    const fileSizeMB = fileSize / (1024 * 1024);
    return fileSizeMB <= this.maxFileSizeMB;
  }

  updateMessageFileUrl(channelId: string, messageId: string, threadId: string, threadMessageId: string, fileUrl: string, fileName: string): Promise<void> {
    const messageDocRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}/threads/${threadId}/messages/${threadMessageId}`);
    return updateDoc(messageDocRef, {
      fileUrl: fileUrl,
      fileName: fileName
    });
  }

  deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const storage = getStorage();
      const fileRef = ref(storage, filePath);
      deleteObject(fileRef).then(() => {
        console.log('Datei erfolgreich gelöscht');
        resolve();
      }).catch((error) => {
        console.error('Fehler beim Löschen der Datei:', error);
        reject(error);
      });
    });
  }

  uploadFile(file: File, messageId: string, onProgress: (progress: number) => void): Promise<{ url: string, fileName: string }> {
    if (!this.isFileSizeValid(file.size)) {
      return Promise.reject(new Error(`The file exceeds the maximum allowed size of ${this.maxFileSizeMB} MB.`));
    }
    const storage = getStorage();
    const storageRef = ref(storage, `threads/${messageId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL, fileName: file.name });
        }
      );
    });
  }

  getFileTypeFromFileName(fileName: string): string | null {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      case 'pdf':
        return 'pdf';
      case 'mp4':
      case 'webm':
      case 'ogg':
        return 'video';
      default:
        return 'unknown';
    }
  }
}

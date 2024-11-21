import { ApplicationConfig, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { routes } from './app.routes';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideHttpClient } from '@angular/common/http';
import { getStorage, provideStorage } from '@angular/fire/storage';

registerLocaleData(localeDe);

const config = {
  // projectId: 'dabubble-57387',
  // appId: '1:1040544770849:web:1df07c76989e5816c56c60',
  // storageBucket: 'dabubble-57387.appspot.com',
  // apiKey: 'AIzaSyBSTXdqT4YVS0tJheGnc1evmzz6_kUya4k',
  // authDomain: 'dabubble-57387.firebaseapp.com',
  // messagingSenderId: '1040544770849',
  apiKey: "AIzaSyClgXGdQyQcIQlxTybULrrB6GN4usQZ6aw",
  authDomain: "dabubblefinal.firebaseapp.com",
  projectId: "dabubblefinal",
  storageBucket: "dabubblefinal.firebasestorage.app",
  messagingSenderId: "209496147712",
  appId: "1:209496147712:web:94b40206b5196e19ad95e5"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(config)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideAnimationsAsync(),
    provideHttpClient(),
  ],
};

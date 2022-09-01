// Import stylesheets
import './style.css';
// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';

// Add the Firebase products and methods that you want to use
import {
  getAuth,
  EmailAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  where,
} from 'firebase/firestore';

import * as firebaseui from 'firebaseui';

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

let rsvpListener = null;
let guestbookListener = null;

let db, auth;

async function main() {
  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: 'AIzaSyD2SG32jLx67s3iffyTH67k2aQfqKozzd0',
    authDomain: 'fir-web-colab-bc110.firebaseapp.com',
    projectId: 'fir-web-colab-bc110',
    storageBucket: 'fir-web-colab-bc110.appspot.com',
    messagingSenderId: '366777445430',
    appId: '1:366777445430:web:bf7a728c9d6f348625bc97',
  };

  // initialize firebase
  initializeApp(firebaseConfig);
  auth = getAuth();
  db = getFirestore();

  // FirebaseUI config
  const uiConfig = {
    credentialHelper: firebaseui.auth.CredentialHelper.NONE,
    signInOptions: [
      // Email / Password Provider.
      EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        // Handle sign-in.
        // Return false to avoid redirect.
        return false;
      },
    },
  };

  // initialize firebaseUI widget using firebase
  const ui = new firebaseui.auth.AuthUI(auth);

  // handle click events with RSVP
  startRsvpButton.addEventListener('click', () => {
    if (auth.currentUser) signOut(auth);
    else ui.start('#firebaseui-auth-container', uiConfig);
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      startRsvpButton.textContent = 'LOGOUT';
      // Show guestbook to logged-in users
      guestbookContainer.style.display = 'block';
      // Subscribe to the guestbook collection
      subscribeGuestbook();
      // Subcribe to the user's RSVP
      subscribeCurrentRSVP(user);
    } else {
      startRsvpButton.textContent = 'RSVP';
      // Hide guestbook for non-logged-in users
      guestbookContainer.style.display = 'none';
      // Unsubscribe from the guestbook collection
      unsubscribeGuestbook();
      // Unsubscribe from the guestbook collection
      unsubscribeCurrentRSVP();
    }
  });

  // handle form submit
  form.addEventListener('submit', async (e) => {
    // prevent the default form redirect
    e.preventDefault();

    // write to the a new document of the collection guestbook
    addDoc(collection(db, 'guestbook'), {
      text: input.value,
      timestamp: Date.now(),
      name: auth.currentUser.displayName,
      userId: auth.currentUser.uid,
    });
    // clear message input field
    input.value = '';
    // Return false to avoid redirect
    return false;
  });

  // listen to guestbook updates
  const subscribeGuestbook = () => {
    // display messages
    const q = query(collection(db, 'guestbook'), orderBy('timestamp', 'desc'));
    guestbookListener = onSnapshot(q, (snaps) => {
      // Reset page
      guestbook.innerHTML = '';
      // Loop through documents in database
      snaps.forEach((doc) => {
        // Create an HTML entry for each document and add it to the chat
        const entry = document.createElement('p');
        entry.textContent = doc.data().name + ': ' + doc.data().text;
        guestbook.appendChild(entry);
      });
    });
  };

  const unsubscribeGuestbook = () => {
    if (guestbookListener != null) {
      guestbookListener();
      guestbookListener = null;
    }
  };

  // Listen to RSVP responses
  rsvpYes.onclick = async () => {
    // get reference to user's document in attendees collection
    const userRef = doc(db, 'attendees', auth.currentUser.uid);

    // save a document with attending to true
    try {
      await setDoc(userRef, {
        attending: true,
      });
    } catch (e) {
      console.log(e);
    }
  };
  rsvpNo.onclick = async () => {
    // get reference to user's document in attendees collection
    const userRef = doc(db, 'attendees', auth.currentUser.uid);

    // save a document with attending to true
    try {
      await setDoc(userRef, {
        attending: false,
      });
    } catch (e) {
      console.log(e);
    }
  };

  // Listen for attendee list
  const attendingQuery = query(
    collection(db, 'attendees'),
    where('attending', '==', true)
  );
  const unsubscribe = onSnapshot(attendingQuery, (snap) => {
    const newAttendeeCount = snap.docs.length;
    numberAttending.innerHTML = newAttendeeCount + ' people going';
  });

  // listen for attendee list and update classes
  const subscribeCurrentRSVP = (user) => {
    const ref = doc(db, 'attendees', user.uid);
    rsvpListener = onSnapshot(ref, (doc) => {
      if (doc && doc.data()) {
        const attendingResponse = doc.data().attending;

        if (attendingResponse) {
          rsvpYes.className = 'clicked';
          rsvpNo.className = '';
        } else {
          rsvpYes.className = '';
          rsvpNo.className = 'clicked';
        }
      }
    });
  };

  function unsubscribeCurrentRSVP() {
    if (rsvpListener != null) {
      rsvpListener();
      rsvpListener = null;
    }
    rsvpYes.className = '';
    rsvpNo.className = '';
  }
}
main();

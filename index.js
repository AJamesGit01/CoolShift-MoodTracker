/* === Firebase Imports === */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, GoogleAuthProvider,
  signInWithPopup, updateProfile
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import {
  getFirestore, collection, addDoc, query, where, orderBy,
  onSnapshot, Timestamp, doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/* === Firebase Setup === */
const firebaseConfig = {
  apiKey: "AIzaSyAQ9SrWqw24RoIDPLh3vZCmFIr2DNUFrOk",
  authDomain: "coolshift-5413e.firebaseapp.com",
  projectId: "coolshift-5413e",
  storageBucket: "coolshift-5413e.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

/* === DOM Elements === */
// Auth elements
const emailInputEl = document.getElementById("email-input");
const passwordInputEl = document.getElementById("password-input");
const displayNameInputEl = document.getElementById("display-name-input");
const photoURLInputEl = document.getElementById("photo-url-input");

const signInButtonEl = document.getElementById("sign-in-btn");
const createAccountButtonEl = document.getElementById("create-account-btn");
const signOutButtonEl = document.getElementById("sign-out-btn");
const signInWithGoogleButtonEl = document.getElementById("sign-in-with-google-btn");
const updateProfileButtonEl = document.getElementById("update-profile-btn");

// UI views
const viewLoggedOut = document.getElementById("logged-out-view");
const viewLoggedIn = document.getElementById("logged-in-view");
const userProfilePictureEl = document.getElementById("user-profile-picture");
const userGreetingEl = document.getElementById("user-greeting");

// Posting
const postInputEl = document.getElementById("post-input");
const postButtonEl = document.getElementById("post-btn");

/* === Event Listeners === */
// Auth
signInButtonEl.addEventListener("click", authSignInWithEmail);
createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail);
signOutButtonEl.addEventListener("click", authSignOut);
signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle);
updateProfileButtonEl.addEventListener("click", authUpdateProfile);

// Post
postButtonEl.addEventListener("click", createMoodPost);

/* === Auth State Handling === */
onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoggedInView();
    showProfilePicture(userProfilePictureEl, user);
    showUserGreeting(userGreetingEl, user);
    initMoodSelection();
    initFilters();
    fetchPosts("today");
  } else {
    showLoggedOutView();
  }
});

/* === Mood Selection Logic === */
function initMoodSelection() {
  let selectedMood = null;
  document.querySelectorAll(".mood-emoji-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedMood = btn.innerText.trim();
      document.querySelectorAll(".mood-emoji-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      window.selectedMood = selectedMood; // store globally
    });
  });
}

/* === Post Filters === */
function initFilters() {
  document.getElementById("today-filter-btn").addEventListener("click", () => fetchPosts("today"));
  document.getElementById("week-filter-btn").addEventListener("click", () => fetchPosts("week"));
  document.getElementById("month-filter-btn").addEventListener("click", () => fetchPosts("month"));
  document.getElementById("all-filter-btn").addEventListener("click", () => fetchPosts("all"));
}

/* === Post Creation === */
function createMoodPost() {
  const text = postInputEl.value;
  const user = auth.currentUser;
  const mood = window.selectedMood;

  if (!text || !mood || !user) return;

  addDoc(collection(db, "moodPosts"), {
    userId: user.uid,
    displayName: user.displayName || "Anonymous",
    mood,
    text,
    createdAt: Timestamp.now()
  }).then(() => {
    postInputEl.value = "";
    console.log("Post saved!");
  }).catch((err) => console.error("Error saving post:", err.message));
}

/* === Fetch Posts by Time Filter === */
function fetchPosts(filterType) {
  const postsRef = collection(db, "moodPosts");
  const now = new Date();
  let q;

  switch (filterType) {
    case "today":
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      q = query(postsRef, where("createdAt", ">=", Timestamp.fromDate(todayStart)), orderBy("createdAt", "desc"));
      break;
    case "week":
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      q = query(postsRef, where("createdAt", ">=", Timestamp.fromDate(weekAgo)), orderBy("createdAt", "desc"));
      break;
    case "month":
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      q = query(postsRef, where("createdAt", ">=", Timestamp.fromDate(monthAgo)), orderBy("createdAt", "desc"));
      break;
    default:
      q = query(postsRef, orderBy("createdAt", "desc"));
  }

  onSnapshot(q, (snapshot) => {
    const postsSection = document.getElementById("posts");
    postsSection.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const postId = doc.id;
      const isOwner = auth.currentUser && auth.currentUser.uid === data.userId;

      const postHTML = `
        <div class="post" data-id="${postId}">
          <strong>${data.displayName}</strong> (${data.mood}):<br>
          <span class="post-text">${data.text}</span><br>
          <small>${data.createdAt.toDate().toLocaleString()}</small>
          ${isOwner ? `
            <br>
            <button class="edit-btn">Edit ✏️</button>
            <button class="delete-btn">Delete 🗑</button>
          ` : ""}
        </div>
      `;

      postsSection.innerHTML += postHTML;
    });

    // Attach edit/delete listeners
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", handleEditPost);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", handleDeletePost);
      
    });
  });
}

function handleEditPost(e) {
  const postDiv = e.target.closest(".post");
  const postId = postDiv.dataset.id;
  const postTextEl = postDiv.querySelector(".post-text");
  const currentText = postTextEl.textContent;

  // Hide the current text
  postTextEl.style.display = "none";

  // Create textarea
  const textarea = document.createElement("textarea");
  textarea.value = currentText;
  textarea.classList.add("edit-textarea");
  textarea.style.width = "100%";

  // Create save button
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save ✅";
  saveBtn.classList.add("save-btn");

  // Create cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel ❌";
  cancelBtn.classList.add("cancel-btn");

  // Insert elements
  const editControls = document.createElement("div");
  editControls.classList.add("edit-controls");
  editControls.appendChild(textarea);
  editControls.appendChild(saveBtn);
  editControls.appendChild(cancelBtn);
  postDiv.insertBefore(editControls, postTextEl.nextSibling);

  // Save logic
  saveBtn.addEventListener("click", () => {
    const newText = textarea.value.trim();
    if (newText && newText !== currentText) {
      const postRef = doc(db, "moodPosts", postId);
      updateDoc(postRef, { text: newText }).then(() => {
        postTextEl.textContent = newText;
        cleanup();
        console.log("Post updated");
      }).catch(err => console.error("Error updating post:", err.message));
    } else {
      cleanup();
    }
  });

  // Cancel logic
  cancelBtn.addEventListener("click", cleanup);

  // Remove editor
  function cleanup() {
    postTextEl.style.display = "block";
    editControls.remove();
  }
}

function handleDeletePost(e) {
  const postDiv = e.target.closest(".post");
  const postId = postDiv.dataset.id;

  if (confirm("Are you sure you want to delete this post?")) {
    const postRef = doc(db, "moodPosts", postId);
    deleteDoc(postRef)
      .then(() => console.log("Post deleted"))
      .catch(err => console.error("Error deleting post:", err.message));
  }
}


/* === Auth Functions === */
function authSignInWithGoogle() {
  signInWithPopup(auth, provider)
    .then(() => console.log("Signed in with Google"))
    .catch(err => console.error(err.message));
}

function authSignInWithEmail() {
  signInWithEmailAndPassword(auth, emailInputEl.value, passwordInputEl.value)
    .then(clearAuthFields)
    .catch(err => console.error(err.message));
}

function authCreateAccountWithEmail() {
  createUserWithEmailAndPassword(auth, emailInputEl.value, passwordInputEl.value)
    .then(clearAuthFields)
    .catch(err => console.error(err.message));
}

function authSignOut() {
  signOut(auth).catch(err => console.error(err.message));
}

function authUpdateProfile() {
  updateProfile(auth.currentUser, {
    displayName: displayNameInputEl.value,
    photoURL: photoURLInputEl.value
  }).then(() => {
    console.log("Profile updated");
  }).catch(err => console.error(err.message));
}

/* === UI Helper Functions === */
function showLoggedOutView() {
  hideView(viewLoggedIn);
  showView(viewLoggedOut);
}

function showLoggedInView() {
  hideView(viewLoggedOut);
  showView(viewLoggedIn);
}

function showView(view) {
  view.style.display = "flex";
}

function hideView(view) {
  view.style.display = "none";
}

function clearInputField(field) {
  field.value = "";
}

function clearAuthFields() {
  clearInputField(emailInputEl);
  clearInputField(passwordInputEl);
}

function showProfilePicture(img, user) {
  img.src = user.photoURL || "assets/images.jpg";
}

function showUserGreeting(el, user) {
  const firstName = user.displayName?.split(" ")[0] || "friend";
  el.textContent = `Hi ${firstName}, Kamusta ka?`;
}

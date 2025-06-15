# 📋 Project Overview
CoolShift is a lightweight web application that allows users to track and share their moods and thoughts. Users can authenticate using Google or email/password, post thoughts tagged with emoji-based moods, and view their emotional history across different time ranges.

## 🔑 Features
🔐 User Authentication
Google Sign-In via Firebase.

- Email/Password Sign-In and Sign-Up.

- Profile Update – Change display name and photo (via URL).

Sign Out option.

## 📝 Mood Posting
Post your thoughts with an associated emoji representing your current mood.

Emoji choices reflect emotional states (happy, sad, angry, etc.).

Post includes your display name, mood emoji, thought text, and timestamp.

## 🛠️ Post Management
- Edit your previous posts directly in the UI using a textarea.

- Delete posts with confirmation.

## 📅 Mood History Filter
Filter your post history by:

Today

- This Week

- This Month

- All Posts

- Posts are fetched and displayed in real time using Firestore listeners.

## 💾 Technologies Used
- Firebase Authentication – User login & registration.

- Firebase Firestore – Real-time database for storing posts.

- JavaScript – Frontend logic and event handling.

- HTML/CSS – Responsive UI and styling.


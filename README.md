# Event Management System

A full-stack event management platform built for college clubs and organizations. It handles everything from event creation and participant registration to QR-based attendance and a per-event discussion forum. Three distinct roles  Admin, Organizer, and Participant each get their own dashboard and a set of actions they're allowed to take.

---

## Libraries, Frameworks, and Modules

### Frontend

| Package | Version | Why I used it |
|---|---|---|
| `react` | ^19 | The entire UI is component-based. React's one-way data flow made it easy to reason about state across dashboards for three different user roles. |
| `vite` | ^7 | Way faster than CRA for both cold starts and hot-module replacement during development. The build output is also noticeably smaller. |
| `react-router-dom` | ^7 | Client-side routing with protected routes. I wrapped all role-specific pages in a `ProtectedRoute` component that redirects based on JWT role. |
| `fuse.js` | ^7 | Fuzzy search across event names, descriptions, organizer names, and tags. Users can search with typos and still find what they're looking for  plain `String.includes` wouldn't cut it. |
| `html5-qrcode` | ^2.3 | Camera-based QR scanning in the browser. Organizers use this to scan participant tickets for attendance. It supports both camera scan and file upload fallback, which I kept both active. |
| `qrcode.react` | ^4 | Renders the ticket's QR code as an SVG/Canvas element on the participant's registration page. Purely a display component, easy to drop in. |

| `react-google-recaptcha-v3` | ^1.11 | Used on the login form. v3 is invisible  it generates a score in the background, and the backend rejects anything below a threshold (default 0.5). |


---

### Backend

| Package | Version | Why I used it |
|---|---|---|
| `express` | ^5 | RESTful API server. Express 5 handles async errors natively so I don't need a wrapper around every route handler. |
| `mongoose` | ^9 | Schema definitions for all models. Mongoose's middleware (`pre('save')`) is where password hashing happens automatically before any document hits the database. |
| `jsonwebtoken` | ^9 | Signs a JWT containing the user's `id` and `role` on login. The token lives in an `httpOnly` cookie  not in localStorage  so it's not accessible to JavaScript and is safe from XSS attacks. |
| `bcryptjs` | ^3 | Password hashing with a salt factor of 10. Every model that stores a password (`Participant`, `Organizer`, `Admin`) uses this in a Mongoose pre-save hook and a `comparePassword` instance method. |
| `cookie-parser` | ^1.4 | Parses the `httpOnly` cookie on every request so the auth middleware can read the JWT without any client-side involvement. |
| `cors` | ^2.8 | Configured to allow the local frontend origin plus any `*.vercel.app` subdomain dynamically, so the deployed frontend always works regardless of which Vercel preview URL is generated. |
| `multer` | ^2 | Handles multipart form uploads  payment proof images that participants attach when registering for paid events. Files are stored locally under the `uploads/` folder and served as static files. |
| `nodemailer` | ^8 | Sends HTML confirmation emails when a registration is approved. The email includes the event details and an embedded QR code image (attached as a CID inline, not a public URL, so it works in all mail clients). |
| `qrcode` | ^1.5 | Generates the QR code as a PNG buffer on the backend, which gets embedded directly into the confirmation email. |
| `dotenv` | ^17 | Loads `.env` variables for the database URL, JWT secret, email credentials, reCAPTCHA secret, and Discord webhook URLs. Nothing sensitive is hardcoded. |
| `nodemon` | ^3 (dev) | Auto-restarts the server on file changes during development. |


---

## Advanced Features

### Tier A  Merchandise Payment Approval Workflow & QR Scanner / Attendance Tracking [8 + 8 Marks]

I chose these two because they are directly connected to the core event lifecycle. Payment approval closes the loop between a participant placing an order and actually being confirmed. QR attendance closes the loop between being registered and physically showing up. Both features touch every layer of the stack and have real failure modes that needed careful handling.

---

**Merchandise Payment Approval Workflow**

*Justification:* Merchandise events involve real money. Letting a participant mark themselves as paid without any verification would be meaningless. This workflow forces every purchase through a manual review by the organizer before stock is decremented or a ticket is issued, which mirrors how actual fest merchandise sales work.

*Design and implementation:*

When a participant places a merchandise order, they must upload a payment proof image as part of the registration form. This is handled by `multer` on the upload route  the file is saved to the `uploads/` folder and the path is stored in `registrationData.paymentProof`. At this point, the registration is created with `participationStatus: "Pending"` and `paymentStatus: "Pending"`. No ticket ID is withheld  the ticket ID is generated at creation time  but no QR or confirmation email is sent yet. The participant sees an "Awaiting Approval" state in their Participation History.

On the organizer side, the event detail page has a dedicated Pending Payments tab that lists all registrations in this state, showing the participant's name, selected variant, and a link to their uploaded payment proof image. The organizer can approve or reject each one individually.

On **approval**, the backend first does an atomic stock check using a MongoDB `$inc` update with a condition on `stock > 0`. If the variant has run out between the time of order and approval, the approval is blocked and the organizer is told the variant is now out of stock. If stock is still available, it is decremented, `participationStatus` is set to `"Registered"`, `paymentStatus` to `"Approved"`, and the confirmation email with the embedded QR code is sent. Stock is deliberately not decremented at order placement  only at approval  so stock isn't locked by unverified orders.

On **rejection**, the organizer can optionally provide a reason. The registration moves to `participationStatus: "Cancelled"`, `paymentStatus: "Rejected"`, and the rejection reason is stored in `rejectionReason`. No stock is touched.

---

**QR Scanner & Attendance Tracking**

*Justification:* Marking attendance manually by name lookup at the event entrance doesn't scale. QR scanning is fast, unambiguous, and creates an audit trail automatically.

*Design and implementation:*

Every confirmed registration (both normal and merch, after payment approval for merch) gets a unique ticket ID in the format `EVT-{last6ofTimestamp}-{4randomDigits}`. This ID is encoded into a QR code on the participant's side using `qrcode.react` for display and `qrcode` (Node.js) for the email attachment.

On the organizer's event detail page, a "Scan QR" button opens a modal powered by `html5-qrcode`. I chose `html5-qrcode` specifically because it supports both live camera scanning and file upload in the same component, which I kept both active. A ref (`isProcessingRef`) is used to gate the scan callback  once a scan is being processed, the callback immediately returns if called again, preventing duplicate API calls from the scanner firing multiple times on the same QR frame.

When a ticket ID is decoded, the frontend sends it to `POST /api/registrations/scan/:eventId`. The backend: verifies the registration exists, belongs to the correct event, has `participationStatus: "Registered"` (not pending or cancelled), and that `attendanceMarked` is not already `true`. If any check fails, a clear error is returned. On success, `attendanceMarked` is set to `true`, `attendedAt` is set to the current timestamp, and `scannedBy` stores the organizer's ID for audit purposes. Duplicate scans return a specific error message distinguishing "already scanned" from "invalid ticket".

The live attendance dashboard on the organizer event page shows the count of scanned vs. total registered participants and updates on each scan. The registrations list can be exported as CSV from the organizer view, which includes the attendance status and timestamp for every participant.

---

### Tier B  Real-Time Discussion Forum & Organizer Password Reset Workflow [6 + 6 Marks]

I chose these two because one improves the experience for participants during an event and the other solves a real operational problem with organizer account management.

---

**Real-Time Discussion Forum**

*Justification:* Participants currently have no way to ask questions about an event after registering. Without a forum, those questions go to WhatsApp groups or just go unanswered. A per-event forum keeps everything in one place and gives the organizer a moderation tool.

*Design and implementation:*

The forum is accessible from the event detail page and is gated by registration status  the backend checks that the requester either owns the event (organizer) or has an active registration with `participationStatus` of `"Registered"` or `"Completed"` before allowing a post. This check is re-validated on every message post, not just on page load.

Messages are stored in a `DiscussionMessage` collection with fields for `event`, `sender`, `senderRole`, `senderName`, `content`, `parentMessage` (for threading), and `isPinned`. Pinned messages are sorted to the top via MongoDB's sort on `{ isPinned: -1, createdAt: 1 }`.

The frontend polls the messages endpoint every 5 seconds using `setInterval`. The tricky part here was the stale closure problem: the polling callback captures `messages` from the render it was created in, so comparing old vs. new messages inside `setInterval` would always compare against the same snapshot. I solved this by maintaining a `messagesRef` with `useRef` that is always updated to the latest messages array in sync with state. The polling callback reads from `messagesRef.current` instead of the state variable, so the comparison is always against the actual latest data.

When the organizer posts a message containing `@everyone`, the backend finds every active registrant for that event and bulk-inserts a notification document for each of them using `Notification.insertMany`. On the frontend, participants who receive a new `@everyone` message see a banner alert for 10 seconds. This is detected by diffing the previous and new message arrays on each poll  new messages with `senderRole === "Organizer"` and `@everyone` in the content trigger the alert.

The organizer can pin any message (pinned messages float to the top for all viewers) and delete any message in the forum. Participants can only delete their own messages. Deleting a parent message also cascades and deletes all its replies via `DiscussionMessage.deleteMany({ parentMessage: messageId })`.

---

**Organizer Password Reset Workflow**

*Justification:* Organizers can't self-reset their passwords because they don't have public-facing registration. The admin provisions their accounts, so the admin also needs to be the one handling resets. This workflow creates a formal request-and-approve flow instead of the admin just changing passwords ad hoc.

*Design and implementation:*

The request flow lives on the organizer's profile page. The organizer submits a reset request with an optional reason. This sets `passwordResetStatus: "PENDING"` and stores `passwordResetRequestedAt` and `passwordResetReason` on the Organizer document. The organizer can see their current request status (Pending / Approved / Rejected) from the same page.

On the admin side, the "Password Reset Requests" page in the admin dashboard lists all organizers with `passwordResetStatus: "PENDING"`, showing organizer name, email, request date, and reason. The admin can approve or reject, optionally adding a comment.

On **approval**, the backend generates a new random 12-character hex password using `crypto.randomBytes(6).toString("hex")`. The new password is set on the organizer document (the Mongoose `pre('save')` hook on the Organizer model hashes it automatically before it hits the database). The current request details are pushed into a `passwordResetHistory` array with `status: "APPROVED"`, `requestedAt`, `resolvedAt`, and `adminComment`. The plain-text new password is returned in the API response so the admin can copy and share it with the organizer. `passwordResetStatus` is reset to `"NONE"`.

On **rejection**, the same history entry is pushed with `status: "REJECTED"` and the admin's comment. `passwordResetStatus` goes back to `"NONE"` so the organizer can submit a new request.

The full password reset history (across all organizers, all time) is viewable from the admin dashboard, with entries sorted by `resolvedAt` descending.

---

### Tier C  Bot Protection [2 Marks]

*Justification:* I chose bot protection over the other Tier C options because it directly strengthens the security of the authentication system, which is the entry point for everything else. An anonymous feedback system or calendar export would have been nice-to-haves, but preventing automated account creation and brute-force login attempts has a direct impact on system integrity.

*Design and implementation:*

I implemented two layers of reCAPTCHA using Google's service  v2 on signup and v3 on login  because they serve different threat models.

On the **signup form**, reCAPTCHA v2 (checkbox challenge) is shown using `react-google-recaptcha`. The user must complete the challenge, which produces a token. The token is sent to the backend as part of the registration request. The backend calls Google's `siteverify` endpoint with the token and the secret key. If verification fails, the registration is rejected.

On the **login form**, reCAPTCHA v3 (invisible, score-based) is used via `react-google-recaptcha-v3`. The `useGoogleReCaptcha` hook generates a score token in the background on each login attempt without any user interaction. The token is sent alongside the login credentials. The backend verifies it and checks the score against a configurable threshold (default `0.5`, set via `RECAPTCHA_SCORE_THRESHOLD` in `.env`). Scores below the threshold indicate bot-like behaviour and the request is rejected with a clear message. v3 is better for login than v2 because it doesn't add friction for real users  the challenge only appears if the score is suspicious.

If `RECAPTCHA_SECRET_KEY` is not set in the environment, the backend logs a warning and skips verification entirely, so local development works without needing to configure keys.

---

## Setup and Installation

### Prerequisites
- Node.js v18 or higher
- MongoDB (local instance or MongoDB Atlas)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Event-Management-System
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder:

```env
PORT=8000
DATABASE_URL=mongodb://127.0.0.1:27017/eventManagementSystem
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development

# Admin account seeded on first start
ADMIN_EMAIL=admin@ems.org
ADMIN_PASSWORD=yourpassword

# Email (Gmail with App Password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password

# Google reCAPTCHA v3
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
RECAPTCHA_SCORE_THRESHOLD=0.5

# Frontend origin for CORS
CORS_ORIGIN=http://localhost:5173
```

Start the backend:

```bash
npm run dev      # development (nodemon)
npm start        # production
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Create a `.env` file inside the `frontend/` folder:

```env
VITE_API_URL=http://localhost:8000
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_v3_site_key
VITE_RECAPTCHA_V2_SITE_KEY=your_recaptcha_v2_site_key
```

Start the frontend:

```bash
npm run dev
```

### 4. Access the app

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

On first start, the backend automatically seeds an admin account using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the `.env`. Use those credentials to log in as admin, then create organizer accounts from the admin dashboard.

---

## Important Notes

- The `uploads/` folder is served as static files and should not be committed. It is already in `.gitignore`.
- If `EMAIL_USER` / `EMAIL_PASS` are not set, the server will log a warning and skip email sending  the rest of the registration flow still works normally.
- If `RECAPTCHA_SECRET_KEY` is not set, the backend skips reCAPTCHA verification and lets all requests through  useful for local development without setting up a key.
- Discord webhook URLs are stored per organizer and are optional. Events publish normally if no URL is configured.
- The backend is deployed on Railway (`railway.json` and `nixpacks.toml` are included for that config). The frontend is deployed on Vercel (`vercel.json` includes the SPA redirect rule). The CORS config on the backend dynamically allows any `*.vercel.app` subdomain so Vercel preview deployments work without any config change.

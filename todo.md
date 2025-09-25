## **Migrate the codebase into the MongoDB databse only**
[x] change the codebase to use the MongoDB database onlt in the project 

## **Remove the unwanted files and fodlers from the codebase**
[x] Remove the unwanted files and fodlers from the codebase

## **Routing & Access Control**

* [x] Ensure `/app` route **no longer shows account page**.

  * Replace with **dummy ChatGPT-like UI** for now.
* [x] Make `/app` a **protected route** (only logged-in users can access).
* [x] Keep `/account` route for **all account management pages** (profile, billing, settings).

---

## **Authentication & User Management**

* [x] Ensure **login & registration** system works correctly.
* [x] Add **mobile number field** during registration.
* [x] Add **country selection** during registration.
* [x] Store user’s **mobile number & country** in the DB.
* [x] Show pricing in both **INR & USD** based on user country.

---

## **Token System**

* [x] Remove “credits” terminology → replace with **tokens** everywhere.
* [x] Set token pricing:

  * **1 token = \$2 = ₹176** (conversion ratio \$1 = ₹88).
* [x] Create a **dedicated Tokens page** with options:

  * Buy 10 tokens
  * Buy 50 tokens
  * Buy 100 tokens
  * Custom token quantity input
* [x] Display price in **both USD and INR** (depending on user’s country).
* [x] Integrate backend logic for **token purchase & balance update**.
* [x] Save purchase history for billing section.

---

## **Payments (Razorpay Integration)**

* [x] Use test Razorpay keys for development.
* [x] Implement **end-to-end Razorpay payment flow**:

  * Create Razorpay order on backend.
  * Open Razorpay checkout on frontend.
  * Verify payment signature.
  * On success: Add tokens to user’s account + save transaction.
* [x] Store payment details in DB (order\_id, payment\_id, status, tokens purchased).

---

## **Invoices & Billing**

* [x] Use **react-pdf** to generate invoices for each successful payment.
* [x] Add a **Billing section in `/account` page** where user can:

  * View all past transactions.
  * Download invoice as PDF.
* [x] Invoice fields:

  * Invoice No.
  * User details (Name, Email, Mobile, Country).
  * Payment details (Razorpay payment\_id, date, status).
  * Tokens purchased & price (INR & USD).

---

## **UI/UX Revamp**

* [x] Redesign `/account` page & all account-related pages for **better usability & modern UI**.
* [x] Use **clean SaaS design** (glassmorphism or modern minimal style).
* [x] Improve token purchase page UI (pricing cards, custom input).
* [x] Improve `/app` UI (ChatGPT-like dummy chat interface).
* [x] Add **responsive design** (mobile & desktop).

---

## **Backend Enhancements**

* [x] Add routes for:

  * `/tokens/create-order` (Razorpay order creation).
  * `/tokens/verify-payment` (verify & add tokens).
  * `/tokens/history` (fetch user’s purchase history).
* [x] Add logic for token balance update after payment.
* [x] Optimize DB queries for performance.
* [x] Write modular controllers & services for cleaner code.
* [x] Add **error handling & logging**.

---

## **Debugging & Optimization**

* [x] Fix existing bugs in authentication & routing.
* [x] Ensure session handling works correctly (no unauthorized access).
* [x] Optimize API responses (reduce unnecessary DB calls).
* [x] Test all edge cases (payment failure, invalid country/mobile, etc.).
* [x] Make frontend & backend production-ready (modular & optimized).

---

✅ **Key Updates:**

* `/app` route will **no longer show account page**.
* `/account` route redesigned and **UI fully revamped**.
* **Mobile number field** added in registration.

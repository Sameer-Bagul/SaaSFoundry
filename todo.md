## **Migrate the codebase into the MongoDB databse only**
[ ] change the codebase to use the MongoDB database onlt in the project 

## **Remove the unwanted files and fodlers from the codebase**
[ ] Remove the unwanted files and fodlers from the codebase

## **Routing & Access Control**

* [ ] Ensure `/app` route **no longer shows account page**.

  * Replace with **dummy ChatGPT-like UI** for now.
* [ ] Make `/app` a **protected route** (only logged-in users can access).
* [ ] Keep `/account` route for **all account management pages** (profile, billing, settings).

---

## **Authentication & User Management**

* [ ] Ensure **login & registration** system works correctly.
* [ ] Add **mobile number field** during registration.
* [ ] Add **country selection** during registration.
* [ ] Store user’s **mobile number & country** in the DB.
* [ ] Show pricing in both **INR & USD** based on user country.

---

## **Token System**

* [ ] Remove “credits” terminology → replace with **tokens** everywhere.
* [ ] Set token pricing:

  * **1 token = \$2 = ₹176** (conversion ratio \$1 = ₹88).
* [ ] Create a **dedicated Tokens page** with options:

  * Buy 10 tokens
  * Buy 50 tokens
  * Buy 100 tokens
  * Custom token quantity input
* [ ] Display price in **both USD and INR** (depending on user’s country).
* [ ] Integrate backend logic for **token purchase & balance update**.
* [ ] Save purchase history for billing section.

---

## **Payments (Razorpay Integration)**

* [ ] Use test Razorpay keys for development.
* [ ] Implement **end-to-end Razorpay payment flow**:

  * Create Razorpay order on backend.
  * Open Razorpay checkout on frontend.
  * Verify payment signature.
  * On success: Add tokens to user’s account + save transaction.
* [ ] Store payment details in DB (order\_id, payment\_id, status, tokens purchased).

---

## **Invoices & Billing**

* [ ] Use **react-pdf** to generate invoices for each successful payment.
* [ ] Add a **Billing section in `/account` page** where user can:

  * View all past transactions.
  * Download invoice as PDF.
* [ ] Invoice fields:

  * Invoice No.
  * User details (Name, Email, Mobile, Country).
  * Payment details (Razorpay payment\_id, date, status).
  * Tokens purchased & price (INR & USD).

---

## **UI/UX Revamp**

* [ ] Redesign `/account` page & all account-related pages for **better usability & modern UI**.
* [ ] Use **clean SaaS design** (glassmorphism or modern minimal style).
* [ ] Improve token purchase page UI (pricing cards, custom input).
* [ ] Improve `/app` UI (ChatGPT-like dummy chat interface).
* [ ] Add **responsive design** (mobile & desktop).

---

## **Backend Enhancements**

* [ ] Add routes for:

  * `/tokens/create-order` (Razorpay order creation).
  * `/tokens/verify-payment` (verify & add tokens).
  * `/tokens/history` (fetch user’s purchase history).
* [ ] Add logic for token balance update after payment.
* [ ] Optimize DB queries for performance.
* [ ] Write modular controllers & services for cleaner code.
* [ ] Add **error handling & logging**.

---

## **Debugging & Optimization**

* [ ] Fix existing bugs in authentication & routing.
* [ ] Ensure session handling works correctly (no unauthorized access).
* [ ] Optimize API responses (reduce unnecessary DB calls).
* [ ] Test all edge cases (payment failure, invalid country/mobile, etc.).
* [ ] Make frontend & backend production-ready (modular & optimized).

---

✅ **Key Updates:**

* `/app` route will **no longer show account page**.
* `/account` route redesigned and **UI fully revamped**.
* **Mobile number field** added in registration.

# PandaGo notes and pickup handover — 25 November 2026

Checkout now captures floor, door and extra delivery instructions as existing address line2 (maximum200 characters). Saved instructions are shown and edited in Account Addresses. Only these instructions flow into rider-visible recipient.notes. Street/contact/order/payment information belongs in its separate existing fields.

Admin Sales Orders shows the backend pickup code: the last10 alphanumeric order-number characters, uppercase. Match this visible code with the rider. The list also matches searches for that code. This is a deterministic display of the existing backend convention, not a new generated identifier or API field.

Verified:26 checkout and9 Admin Orders focused Vitest tests; no-emit Angular compiler checks for shop, admin-shop and account. Backend scope:39 isolated Java tests and8 fulfillment contracts. No real stage order created. Deploy both reviewed repositories, create a new approved stage order, and capture the actual PandaGo order ID. See backend docs/runbooks/pandago-qualification.md and docs/implementation/2026-11-25-PANDAGO-QUALIFICATION-004.md for exact evidence and pending provider acceptance.

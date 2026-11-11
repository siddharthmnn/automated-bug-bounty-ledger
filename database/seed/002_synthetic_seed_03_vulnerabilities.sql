-- Synthetic vulnerability reports (invented test data).
INSERT INTO VULNERABILITY
  (vuln_id, title, description, severity, cvss_score, status, duplicate_of_vuln_id, submitted_date, program_id, researcher_id)
VALUES
  (319, 'Session cookie missing Secure flag',
   'The portal session cookie is set without the Secure attribute.',
   'LOW', 3.5, 'REJECTED', NULL, '2026-05-01', 103, 214),
  (320, 'Clickjacking on the consent form page',
   'The consent form can be embedded in a frame on another site because no frame protection header is sent.',
   'MEDIUM', 4.3, 'SUBMITTED', NULL, '2026-10-30', 103, 211),
  (321, 'Coupon code can be applied multiple times to a single order',
   'Applying the same coupon repeatedly keeps reducing the order total because the coupon is not marked as used for the cart.',
   'HIGH', 7.1, 'ACCEPTED', NULL, '2026-05-20', 105, 204),
  (322, 'Discount stacking by replaying the apply-coupon request',
   'Replaying the request that applies a promotion code adds the discount again each time, so one code can bring an order close to zero.',
   'HIGH', 7.0, 'SUBMITTED', NULL, '2026-11-01', 105, 215),
  (323, 'Reflected XSS in product search query parameter',
   'The search term from the URL is written back into the results page without encoding, so script content in a crafted link runs for the victim.',
   'MEDIUM', 6.1, 'ACCEPTED', NULL, '2026-02-25', 105, 209),
  (324, 'Search box echoes unescaped input into the results page',
   'Whatever is typed in the store search is displayed on the results page as raw HTML, allowing script execution through a shared link.',
   'MEDIUM', 6.1, 'DUPLICATE', 323, '2026-03-01', 105, 210),
  (325, 'Price of cart items can be modified in the checkout request',
   'The checkout request contains the item price, and the server trusts that value, so an order can be placed at any price.',
   'CRITICAL', 9.0, 'ACCEPTED', NULL, '2026-06-15', 105, 212),
  (326, 'Open redirect in login return URL',
   'The returnTo parameter after login accepts any external domain and redirects the user there.',
   'MEDIUM', 4.7, 'TRIAGED', NULL, '2026-08-19', 105, 213);

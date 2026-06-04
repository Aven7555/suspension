[README.md](https://github.com/user-attachments/files/28594399/README.md)
# SuspensionX Malaysia Web App Demo V2

This is a static web app prototype for a luxury / performance suspension repair coordination business.

## V2 Improvements

1. Brighter F1 / motorsport-inspired UIUX
   - White, carbon, red and speed-line visual direction.
   - Less dark and easier to use for owner dashboard and customer-facing pages.

2. Customer status link simulation
   - Each job has a Job ID such as SX1001.
   - Backend can open a status link.
   - Customer can enter Job ID in the Status Link page.
   - Status timeline shows booking, car received, inspection, quotation, repair, testing and collection.
   - Customer or backend can mark the car as collected.

3. Customer membership / CRM
   - One customer account can hold multiple cars.
   - Same phone number groups jobs under one membership.
   - CRM shows customer history, vehicles, total spend, gross profit and suggested member benefit.

4. Working edit function
   - Edit button opens a full editable job record.
   - Can edit customer name, phone, vehicle, source, status, cost, retail price, warranty, agent code, add-on and notes.

5. Warranty add-on
   - Standard warranty months.
   - Optional warranty add-on.
   - Add-on plan and add-on price.
   - Add-on revenue is included in sales and profit reporting.

6. Owner backend reporting
   - Lead and job pipeline.
   - Float / deposit tracking.
   - Export CSV.
   - Print report.
   - Monthly / audit-style report preview.

## How to Use

1. Open `index.html` in a browser.
2. Use Customer Front-End to submit a customer enquiry.
3. Go to Owner Back-End to edit the job, update status and pricing.
4. Click Open Status Link to simulate what the customer sees.
5. Go to Customer Membership to view grouped CRM records and multiple vehicles.

## Notes

This version is a static demo and stores data in browser localStorage. It is suitable for demo, testing and GitHub Pages upload. A production version should add login, cloud database, secure private links, real uploads, payment tracking, invoice PDF, role permissions and backup.

# Klendei

Build a SaaS scheduling platform called Klendei using React, Supabase, and Tailwind CSS. The entire app interface must be in Brazilian Portuguese (PT-BR). The product serves salons (salões de beleza) and clinics/offices (clínicas e consultórios) in Brazil.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRODUCT OVERVIEW

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Klendei is a multi-tenant scheduling SaaS. Each business gets its own branded public page where their clients can book appointments without creating an account. The business owner manages everything through a private dashboard.

Brand colors: primary #7C6EF5 (purple), dark #0D0D0D, surface #F7F6F2.

Typography: clean, modern. Use letter-spacing: -0.5px on headings.

Overall aesthetic: minimal, dark-accented, mobile-first. Feels premium but approachable.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

USER ROLES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BUSINESS OWNER / RECEPTIONIST

   - Authenticated via Supabase Auth (email + password)

   - Accesses the private admin dashboard

2. END CLIENT (no login required)

   - Accesses the public booking page at: klendei.com/[business-slug]

   - Books with only name + phone number. No account needed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ONBOARDING — BUSINESS REGISTRATION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When a business signs up, collect:

- Business name

- Business type: "Salão de beleza" or "Clínica / Consultório"

- Unique slug (auto-generated from name, editable) → becomes the public URL

- WhatsApp phone number

- Operating hours per day of week (open/close time or closed)

After signup, redirect to the dashboard with a setup checklist:

[ ] Add your logo

[ ] Upload a cover photo

[ ] Add your first professional

[ ] Add your first service

[ ] Share your booking link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DASHBOARD — ADMIN PANEL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sidebar navigation with these sections:

1. INÍCIO (Home)

   - Today's appointment summary cards: total bookings, confirmed, pending, revenue estimate

   - Timeline view of today's appointments sorted by time

   - Quick actions: "Novo agendamento", "Ver agenda completa"

2. AGENDA (Schedule)

   - Week view and day view toggle

   - Color-coded by professional

   - Click any slot to see appointment details or create one manually

   - Status badges: Confirmado (green), Pendente (yellow), Cancelado (red), Concluído (gray)

   - Manual booking form (receptionist creates appointment for walk-in client)

3. PROFISSIONAIS (Team)

   - List of professionals with photo, name, specialty, status (active/inactive)

   - Each professional has:

     * Name, specialty, photo upload

     * Individual working hours (may differ from business hours)

     * List of services they perform

     * Their individual booking link (klendei.com/slug/ana)

   - If business type = salon: each professional has their own service list

   - If business type = clinic: professionals share the business service list

4. SERVIÇOS (Services)

   - List of services with name, price (R$), duration in minutes

   - Toggle active/inactive per service

   - Assign services to specific professionals (salon) or all (clinic)

5. CLIENTES (Clients) ← IMPORTANT FEATURE

   - Full client list with name, phone, total visits, last visit date

   - Click any client to open their profile:

     * Contact info (name, phone) with WhatsApp direct link button

     * Full appointment history: service name, professional, date, status, price

     * Total spent (R$) across all visits

     * Notes field (business can add private notes about the client)

     * "Agendar novamente" button that pre-fills a new booking with their info

   - Search clients by name or phone

   - Filter by: new clients, returning clients, inactive (no visit in 60+ days)

6. PERSONALIZAÇÃO (Branding) ← DIFFERENTIATOR

   - Logo upload (shown on public page header)

   - Cover/banner photo upload (shown as hero image on public page)

   - Theme color picker (primary color applied across public page)

   - Business name and description (shown on public page)

   - Professional photos (uploaded per professional, shown on public page)

   - Preview button: shows live preview of public page with current settings

   - Public booking link with copy button + QR code download (PNG)

7. CONFIGURAÇÕES (Settings)

   - Business info (name, type, slug, WhatsApp, hours)

   - Subscription plan (Grátis / Pro / Business)

   - Danger zone: delete account

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PUBLIC BOOKING PAGE — klendei.com/[slug]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This page is fully themed with the business's branding (logo, cover, colors).

Mobile-first design. No login required.

SECTIONS IN ORDER:

Header bar

- Klendei logo (small, top left) with link to klendei.com

- Business name (top center)

Hero section

- Full-width cover photo (or gradient fallback)

- Business logo overlaid (bottom-left of cover)

- Business name, description, location tags, business type badge

Professionals section

- Horizontal scroll row of professional avatars

- Name and specialty below each avatar

- Clicking a professional filters the service list to show only their services

Services section

- Card list: service name, duration, price

- "Agendar" button on each card → opens booking flow

DIFFERENTIALS on public page:

- "Próximos horários disponíveis" chip on each service card showing the next 2 available slots today (e.g. "Hoje 14h · 16h30") — so clients see availability before even clicking

- Business rating display (simple 1-5 star average collected after each appointment via optional WhatsApp follow-up message)

- "Profissionais online agora" indicator if a professional is currently attending (toggled from dashboard)

- Estimated wait time for walk-in clients (shown as a badge: "Espera aprox. 20 min")

Footer

- WhatsApp contact button (opens wa.me/55[phone])

- Business address if provided

- "Agendado com Klendei" branding link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOOKING FLOW (CLIENT SIDE — 3 steps)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Progress bar with 3 dots at top.

STEP 1 — Choose professional + date + time

- Professional selector (chip row): "Qualquer disponível" or specific person

- Calendar showing current month

  * Past dates grayed out

  * Days with availability shown with subtle background

  * Selected date highlighted in brand color

- Time slot grid for selected date

  * Available: white card, selectable

  * Taken: gray, disabled

  * Selected: brand color fill

- Show slot duration hint: "Este horário termina às 12h00"

STEP 2 — Client info

- Summary card showing: service, professional, date, time, price

- Name field (required)

- Phone/WhatsApp field (required, Brazilian format mask)

- Optional: "Alguma observação?" text area

- Privacy note: "Seus dados são usados só para este agendamento"

STEP 3 — Confirmation screen

- Animated checkmark

- "Tudo certo, [name]!" heading

- Appointment summary card

- "Adicionar lembrete no WhatsApp" button → opens wa.me with pre-filled message:

  "Olá! Confirmando meu agendamento: [service] com [professional] em [date] às [time] no [business name]."

- "Voltar ao início" button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY DIFFERENTIATORS (build these well)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. SMART AVAILABILITY PREVIEW

   Show next available slots directly on service cards before the client starts booking. Reduces drop-off significantly.

2. CLIENT HISTORY & INTELLIGENCE

   Every client has a full visit history. Business can see which services they prefer, how often they come, total spent. "Agendar novamente" pre-fills everything from their last visit.

3. QR CODE GENERATION

   Each business gets a downloadable QR code pointing to their booking page. Designed to be printed and placed at the reception desk or on business cards.

4. INDIVIDUAL PROFESSIONAL LINKS

   Each professional gets their own booking URL. Ana can share klendei.com/salao-da-ana/ana on her Instagram and clients book directly with her.

5. "POWERED BY KLENDEI" FOOTER

   Every public page shows a subtle "Agendado com Klendei" link. This drives organic growth — every client who books sees Klendei and can sign up their own business.

6. SETUP CHECKLIST ON FIRST LOGIN

   Guided onboarding so the business is fully set up in under 10 minutes.

7. WALK-IN MODE

   Receptionist can toggle "Modo recepção" in the dashboard to quickly create a manual appointment for a walk-in client in 2 taps without navigating through menus.

8. INACTIVE CLIENT ALERTS

   Dashboard surfaces clients who haven't returned in 60+ days with a "Reconquistar" tag, and shows a WhatsApp message template the business can send to bring them back.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATABASE SCHEMA (Supabase)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

businesses

  id, owner_id (auth.users), name, type (salon|clinic), slug,

  whatsapp, description, address, logo_url, banner_url,

  theme_color, hours (jsonb), rating_avg, created_at

professionals

  id, business_id, name, specialty, photo_url,

  schedule (jsonb), active, booking_slug, created_at

services

  id, business_id, name, price, duration_minutes, active

professional_services

  professional_id, service_id

appointments

  id, business_id, professional_id, service_id,

  client_id, datetime, status (pending|confirmed|completed|cancelled),

  notes, created_at

clients

  id, business_id, name, phone, notes,

  first_visit, last_visit, total_visits, total_spent

ratings

  id, appointment_id, business_id, score (1-5), created_at

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECH REQUIREMENTS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- React + Vite

- Supabase (auth, database, storage for image uploads)

- Tailwind CSS

- React Router for routing (dashboard routes + public /[slug] route)

- date-fns for date handling (Brazilian locale pt-BR)

- All text, labels, buttons, and messages in Brazilian Portuguese

- Mobile-first responsive design

- Brazilian phone number input mask: (XX) XXXXX-XXXX

- Currency display: R$ X.XXX,XX format

- Dates in Brazilian format: DD/MM/YYYY, "Qui, 16 abr"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

START WITH

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Supabase schema and RLS policies

2. Auth flow: signup → onboarding → dashboard

3. Public booking page at /[slug] with full booking flow

4. Dashboard home with today's appointments

5. Clients section with history view

Build the public booking page and client history as the highest priority — these are the two features that will be shown to potential customers first.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://klendei.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b0d17785-cf6f-44cb-b878-0cf3b2a8e80e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

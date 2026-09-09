# LedgerCraft MVP: Product And Architecture Guide

## Document Purpose

This document would represent the following:

1. Product rules in plain english.
2. Data that must be stored to enforce the rules.
3. API and Auth checks that protects the system using these rules.
4. Test for both concepts and logic to ensure everything works properly.

## Product Definition

LedgerCraft is an expense tracking and budgeting application for individuals and organizations. Meaning a person has a personal workspace by default and may create or join organization workspaces.

### Product Users / Primary Users (This comes from the PRD)

## Scope and what we need to build in the MVP (i.e V1)

- Email/password authentication (Custom Auth), account recovery, and a custom LedgerCraft user interface backed by Supabase Auth (O-Auth).
- Personal workspaces created automatically at sign-up.
- Organization workspaces with Admin and Member roles. (Role-Based-Access-Control (RBAC)).
- NGN and USD expenses, dashboards and budgets.
- A daily external exchange-rate reference fetch.
- Expense categories and single monthly overall budget per workspace.
- Reciept Attachments for organization workspace.
- Organization expense submission, approval, rejection, admin edits, voiding, and audit history.
- Admin-controlled sharing of selected approved expenses nd of the overall budget summary
- Bank/Card connections, payment initiaitions, card controls and bank reconciliations
- AI forecasts, automated budget freezes, and predictive burn curves.
- Share budget with someone both personal and organization

## Explicitly out of Scope (to be moved to V2)

- person-person debt settlement or Splitwise-style shared-expenses splitter
- Reciept OCR
- Tax accounting, double-entry accounting, and formal account-period close workflows.
- More currencies than NGN and USD
- A read-only viewer role or per-member visibility exceptions

# Stack

- HTTP framework: Fastify, express, Node JS
- DB: Supabase - OAuth and DB (Tables) / Query system
- EMAIL: Resend - otp. register otp and reset/forgot flow
- RENDER: Deployment of business logic
- FX rates: Exchange Rate API
- Validation: zod / joi
- CORs: rate limit set at 499
- www.ledgercraft.com/dashboard | www.ledgercraft.com/backend/auth/me

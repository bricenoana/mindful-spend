# Mindful Spend

A mobile-first personal budgeting app for quickly logging daily expenses, understanding food spending, and building better saving habits.

## Product goals

- Log an expense in a few taps.
- Make food spending visible by day, week, and month.
- Set monthly budgets and savings targets.
- Show simple, useful trends without turning budgeting into a chore.
- Keep the first version private and usable on a personal phone.

## Suggested MVP

1. Add, edit, and delete expenses.
2. Categorize spending, with useful food subcategories such as groceries, restaurants, delivery, coffee, and snacks.
3. Show today's spending and the current month's remaining budget.
4. Show weekly and monthly food-spending summaries.
5. Store data locally on the device, with optional cloud backup added later.

## Tech stack

- Expo and React Native
- TypeScript
- Expo Router for navigation
- Local-first storage for the initial personal version
- EAS Build when a standalone install is needed

## Run on a phone

Use a supported Node.js LTS release (the repo defaults to Node 22 with nvm), install Expo Go on the phone, then run:

```bash
npm install
npx expo start
```

Scan the displayed QR code. For a standalone app with its own icon and name, switch to an Expo development or production build through EAS.

## Web app

The static web build is deployed to GitHub Pages at:

<https://bricenoana.github.io/mindful-spend/>

Create the same production build locally with:

```bash
npm run export:web
```

Pushes to `main` automatically build and deploy the contents of `dist` through GitHub Actions.

## Development

```bash
npm run lint
npx tsc --noEmit
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # browser
```

App routes live in `src/app`.

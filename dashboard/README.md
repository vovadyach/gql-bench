# GraphQL Bench — Dashboard
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Nova-000?logo=shadcnui)

Interactive benchmark dashboard for the GraphQL Bench Suite.

## Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- shadcn/ui
- Recharts + D3 (hybrid)
- TypeScript

## Development
```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project Structure
```
src/
├── app/              — pages and layout
├── components/
│   ├── ui/           — shadcn components
│   ├── layout/       — Header, Footer
│   ├── controls/     — ServerToggles, ScenarioPicker
│   ├── charts/       — Recharts components
│   ├── d3/           — D3 custom visualizations
│   ├── sections/     — KeyFindings, RawDataTable, ComingSoon
│   └── shared/       — AnimatedNumber, ChartTooltip
├── hooks/            — useBenchmarkData, useTheme, useVisibleServers
└── lib/              — types, constants, utils, data
```
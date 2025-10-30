# ചിലവ് (Chilavu) - Expense Tracker for Students

ചിലവ് (Chilavu) is a minimalist finance tracker application specifically designed for college students to manage their expenses and income effectively. Built with modern web technologies, it offers a clean interface and insightful visualizations to help students stay on top of their finances.

## Features

* **Authentication**: Secure user sign-up and sign-in functionality.
* **Transaction Management**: Add, edit, and delete income and expense transactions.
* **Categorization**: Organize transactions into custom categories. Includes default student-friendly categories and AI-powered category suggestions based on transaction titles.
* **Budgeting**:
    * Set overall monthly spending goals.
    * Define budgets for specific categories.
    * Track progress against category budgets.
* **Impulse Purchase Tracking**: Mark expenses as impulse buys and visualize the impact.
* **Recurring Transactions**: Set up recurring income or expenses (weekly/monthly).
* **Dashboard Overview**:
    * View key metrics like total spent, total income, net balance, average daily spend, and impulse spending totals.
    * Track monthly budget goal progress.
    * Filter data by daily, weekly, or monthly periods.
* **Data Visualization**: Interactive charts powered by Recharts:
    * Income vs Expense Trend
    * Net Balance Trend
    * Impulse vs Planned Spending
    * Category Budget Progress
    * Spending Breakdown by Category
    * Spending Trend (Bar Chart)
* **Reporting**: View reports like Top 5 Spending Categories for selected periods.
* **Settings**: Manage monthly budget goals, category budgets, and add default categories.
* **Data Export**: Export transaction data to CSV.
* **Security**: Includes a check for leaked passwords during sign-up using the Pwned Passwords API via a Supabase Edge Function.
* **Theme**: Supports Light and Dark modes.
* **Responsive Design**: User interface adapted for desktop and mobile devices.

## Tech Stack

* **Frontend**: React, TypeScript, Vite
* **UI Library**: shadcn/ui
* **Styling**: Tailwind CSS
* **State Management**: React Context API, TanStack Query (for server state)
* **Routing**: React Router
* **Charts**: Recharts
* **Backend**: Supabase
    * Authentication
    * PostgreSQL Database
    * Edge Functions (Deno)
* **UI Components**: Built using Radix UI primitives via shadcn/ui
* **Form Handling**: React Hook Form
* **Notifications**: Sonner

## Getting Started

### Prerequisites

* Node.js (>=18.0.0 recommended)
* npm or yarn or pnpm

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <YOUR_REPOSITORY_URL>
    cd chilavu
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Set up Supabase:**
    * Create a Supabase project at [supabase.com](https://supabase.com/).
    * In your Supabase project dashboard, go to the SQL Editor and run the SQL scripts found in the `supabase/migrations/` directory to set up the necessary tables and functions.
    * Get your Supabase Project URL and Anon Key from Project Settings > API.
    * Create a `.env` file in the root of the project and add your Supabase credentials:
        ```env
        VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
        VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_KEY"
        ```
    * (Optional but Recommended) Deploy the Supabase Edge Functions located in `supabase/functions/` using the Supabase CLI. You might need to set environment variables like `LOVABLE_API_KEY` for the `suggest-category` function and `SUPABASE_SERVICE_ROLE_KEY` for the recurring transaction functions within your Supabase project settings. Update `supabase/config.toml` if necessary.

### Running Locally

```bash
npm run dev

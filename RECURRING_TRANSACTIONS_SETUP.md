# Recurring Transactions - Automated Setup

Your recurring transactions feature is now fully implemented! To activate automatic generation of recurring transactions, you need to set up a scheduled job in your Supabase database.

## What This Does

The `generate-recurring-transactions` edge function automatically:
- Checks all transactions marked as "recurring" (weekly or monthly)
- Generates new transaction entries when they're due
- Updates the `last_generated_date` to prevent duplicates

## Setup Instructions

### Step 1: Access Supabase SQL Editor

1. Go to [supabase.com](https://supabase.com)
2. Open your project: `exqhblzphtfpoutilali`
3. Navigate to **SQL Editor** in the sidebar

### Step 2: Enable Required Extensions

Run this SQL first to enable the necessary extensions:

```sql
-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Step 3: Create the Scheduled Job

Copy and paste this SQL to create a daily cron job:

```sql
-- Schedule the recurring transactions job to run daily at midnight
SELECT cron.schedule(
  'generate-recurring-transactions-daily',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
        url := 'https://exqhblzphtfpoutilali.supabase.co/functions/v1/generate-recurring-transactions',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cWhibHpwaHRmcG91dGlsYWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODIwNjUsImV4cCI6MjA3NzI1ODA2NX0.CtJUfRTQrLZ98PucAqvdJr4IqCL8jYqu47bGU4sx07s"}'::jsonb,
        body := '{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);
```

### Step 4: Verify the Schedule

Check if the job was created successfully:

```sql
SELECT * FROM cron.job;
```

You should see your `generate-recurring-transactions-daily` job listed.

## Manual Testing (Optional)

To test the function immediately without waiting for the schedule:

```sql
SELECT
  net.http_post(
      url := 'https://exqhblzphtfpoutilali.supabase.co/functions/v1/generate-recurring-transactions',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cWhibHpwaHRmcG91dGlsYWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODIwNjUsImV4cCI6MjA3NzI1ODA2NX0.CtJUfRTQrLZ98PucAqvdJr4IqCL8jYqu47bGU4sx07s"}'::jsonb,
      body := '{"manual_test": true}'::jsonb
  ) as request_id;
```

## How It Works

1. **Daily Check**: Every day at midnight (00:00), the cron job triggers
2. **Evaluation**: The function checks each recurring transaction template
3. **Generation**: 
   - **Weekly**: Creates a new entry if 7+ days have passed
   - **Monthly**: Creates a new entry if 30+ days have passed
4. **Update**: Updates `last_generated_date` to prevent duplicates

## Managing the Schedule

### To view job history:
```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### To disable the job temporarily:
```sql
UPDATE cron.job SET active = false WHERE jobname = 'generate-recurring-transactions-daily';
```

### To re-enable the job:
```sql
UPDATE cron.job SET active = true WHERE jobname = 'generate-recurring-transactions-daily';
```

### To delete the job:
```sql
SELECT cron.unschedule('generate-recurring-transactions-daily');
```

## Troubleshooting

### Job not running?
- Check if extensions are enabled: `SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');`
- Verify the job exists: `SELECT * FROM cron.job;`
- Check job run history for errors: `SELECT * FROM cron.job_run_details WHERE jobname = 'generate-recurring-transactions-daily';`

### Edge function errors?
- Check Edge Function logs in Supabase Dashboard → Edge Functions
- Ensure the function URL matches your project ID
- Verify the authorization token is correct

## Notes

- The cron expression `0 0 * * *` means "at 00:00 (midnight) every day"
- You can modify the schedule to run more/less frequently if needed
- The function is idempotent - it won't create duplicates even if run multiple times in a day
- All generated transactions will have `is_recurring: false` and `recurrence_type: null` (they're actual transactions, not templates)

---

Once set up, your recurring transactions will be generated automatically every day! 🎉

# Database Reset Scripts

These scripts help you reset/remove test data from the database when you need to clean up wrong or test data.

## Prerequisites

- PostgreSQL client (`psql`) must be installed
- Database credentials are configured in the scripts
- Scripts must be executable (`chmod +x script-name.sh`)

## Available Scripts

### 0. Full Database Reset (`full-database-reset.sh`) ⚠️ DANGER

**⚠️ WARNING: This will DELETE ALL DATA and recreate the entire database!**

Drops all tables and runs all migrations from scratch to ensure a clean database state.

**Usage:**
```bash
./full-database-reset.sh
```

**What it does:**
- Drops ALL tables (goals, users, sessions, sub-tasks, chat, etc.)
- Runs all 10+ migrations in correct order
- Creates cron_config table
- Verifies all tables and critical columns exist
- Shows database summary

**When to use:**
- Database schema is corrupted or inconsistent
- Missing tables or columns after updates
- Need a completely fresh start
- Testing full database initialization

**Safety:**
- Requires typing "RESET" to confirm (not just "yes")
- Shows detailed progress for each migration
- Verifies schema after completion
- Fails fast if any migration has errors

---

### 1. Reset Single Date (`reset-date.sh`)

Removes all session data for a specific date.

**Usage:**
```bash
./reset-date.sh [YYYY-MM-DD]
```

**Example:**
```bash
./reset-date.sh 2026-01-02
```

**What it does:**
- Shows all sessions for the specified date
- Asks for confirmation before deleting
- Deletes all sessions for that date (all users)

---

### 2. Reset Date Range (`reset-date-range.sh`)

Removes all session data for a date range.

**Usage:**
```bash
./reset-date-range.sh [START_DATE] [END_DATE]
```

**Example:**
```bash
./reset-date-range.sh 2026-01-01 2026-01-05
```

**What it does:**
- Shows all sessions in the date range
- Asks for confirmation before deleting
- Deletes all sessions between start and end dates (inclusive)

---

### 3. Reset User Date (`reset-user-date.sh`)

Removes session data for a specific user on a specific date.

**Usage:**
```bash
./reset-user-date.sh [USER_ID] [YYYY-MM-DD]
```

**Example:**
```bash
./reset-user-date.sh 1 2026-01-02
```

**To see available users:**
```bash
./reset-user-date.sh
```

**What it does:**
- Shows sessions for the specified user and date
- Asks for confirmation before deleting
- Deletes only that user's sessions for that date

---

## User IDs Reference

| User ID | Name | Email |
|---------|------|-------|
| 1 | Thảo Nhi | thaonhi241202@example.com |
| 2 | Văn Hoá | vanhoa.bui@example.com |

---

## Safety Features

All scripts include:
- ✅ Date format validation
- ✅ Preview of data before deletion
- ✅ Confirmation prompt (must type "yes")
- ✅ Colored output for better visibility
- ✅ Error handling

---

## Common Use Cases

### Remove today's test data
```bash
./reset-date.sh 2026-01-02
```

### Remove this week's test data
```bash
./reset-date-range.sh 2026-01-01 2026-01-07
```

### Remove only your test data for today
```bash
./reset-user-date.sh 2 2026-01-02
```

### Remove test data for January
```bash
./reset-date-range.sh 2026-01-01 2026-01-31
```

---

## Output Colors

- 🟡 **Yellow**: Information and prompts
- 🟢 **Green**: Success messages
- 🔴 **Red**: Errors and warnings
- 🔵 **Blue**: Additional information

---

## Important Notes

⚠️ **Warning**: These scripts permanently delete data from the database. Always review the preview before confirming deletion.

💡 **Tip**: If you're not sure, type "no" when prompted and the operation will be cancelled.

🔒 **Security**: Database credentials are stored in the scripts. Keep these files secure and don't commit them to public repositories.

---

## Troubleshooting

### Script not executable
```bash
chmod +x reset-date.sh
chmod +x reset-date-range.sh
chmod +x reset-user-date.sh
```

### psql command not found
Install PostgreSQL client:
- **macOS**: `brew install postgresql`
- **Ubuntu/Debian**: `sudo apt-get install postgresql-client`
- **Windows**: Download from postgresql.org

### Connection refused
Check that:
1. Database server is running
2. Host and port are correct in the script
3. Firewall allows connection to port 5432

---

## Examples with Output

### Example 1: Reset single date
```bash
$ ./reset-date.sh 2026-01-02

========================================
Reset Date Data Script
========================================

Date to reset: 2026-01-02
Database: personal_tracker@13.210.111.152

Checking sessions for date 2026-01-02...
 id | user_name | goal_title | status | started_at | finished_at | duration_completed_minutes
----+-----------+------------+--------+------------+-------------+---------------------------
  1 | Thảo Nhi  | Learn Code | DONE   | 2026-01-02 | 2026-01-02  | 120
  2 | Văn Hoá   | Learn Code | MISSED | 2026-01-02 | 2026-01-02  | 30

Found 2 session(s) for date 2026-01-02

Do you want to DELETE these sessions? (yes/no): yes

Deleting sessions for date 2026-01-02...
✓ Successfully deleted 2 session(s) for date 2026-01-02

Database has been reset for 2026-01-02

========================================
Reset completed successfully!
========================================
```

---

## Support

If you encounter any issues, check:
1. Database connection details in the script
2. PostgreSQL client is installed
3. You have permission to delete from the database

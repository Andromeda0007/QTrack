# Create Database - Step by Step

## Method 1: Find PostgreSQL and Create Database

**Step 1: Find PostgreSQL Installation**

Open PowerShell and run:

```powershell
# Find PostgreSQL bin directory
Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter "psql.exe" | Select-Object FullName
```

This will show you the path to psql.exe (example: `C:\Program Files\PostgreSQL\15\bin\psql.exe`)

**Step 2: Create Database**

Once you have the path, run:

```powershell
# Replace "15" with your PostgreSQL version number
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "CREATE DATABASE qtrack;"
```

You'll be prompted for the PostgreSQL password.

**Step 3: Verify Database Created**

```powershell
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -c "\l"
```

Look for `qtrack` in the list.

---

## Method 2: Using pgAdmin (Easier)

1. Open pgAdmin from Start menu
2. Connect to PostgreSQL server (enter password)
3. Right-click "Databases" → Create → Database
4. Name: `qtrack`
5. Click Save

---

## Method 3: Add PostgreSQL to PATH (One-time setup)

If you want to use `psql` directly:

1. Find your PostgreSQL bin folder (usually `C:\Program Files\PostgreSQL\15\bin`)
2. Add it to Windows PATH:
   - Right-click "This PC" → Properties
   - Advanced System Settings → Environment Variables
   - Edit "Path" → Add PostgreSQL bin folder
   - Restart PowerShell

Then you can use:
```powershell
psql -U postgres -c "CREATE DATABASE qtrack;"
```

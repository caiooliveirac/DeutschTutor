# Database dump: `deutschtutor`

Generated on 2026-05-28T14:12:18Z before archiving this application.

## Contents
- `deutschtutor.sql.gz` — full pg_dump (gzipped), generated with:
  ```bash
  pg_dump -p 5432 -d deutschtutor --clean --if-exists --no-owner --no-privileges | gzip -9
  ```

## Tables
- vocabulary, sessions, errors, daily_stats, goals, review_queue, schreiben_submissions


## Restore
```bash
createdb deutschtutor
gunzip -c deutschtutor.sql.gz | psql -d deutschtutor
```

Or in one shot (PostgreSQL must already have the target user/db):
```bash
gunzip -c deutschtutor.sql.gz | psql -d deutschtutor
```

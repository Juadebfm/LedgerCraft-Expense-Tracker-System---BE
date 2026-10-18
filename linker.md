```bash
./node_modules/.bin/supabase login
./node_modules/.bin/supabase link --project-ref <project-id>
./node_modules/.bin/supabase migration list
# Run migration
./node_modules/.bin/supabase db push --linked
```

`Find <project-id> in your Dashboard URL: supabase.com/dashboard/project/<project-id>. Linking may prompt for your database password; the API key in .env is not that password. Check the project and preview before running npm run db:migrate. Don’t paste the password or keys here. I have not run a migration.`

_66fdc469_

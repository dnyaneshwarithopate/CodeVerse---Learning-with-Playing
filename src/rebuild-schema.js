
require('dotenv').config({ path: './.env' });
const { execSync } = require('child_process');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set in your .env file.');
  process.exit(1);
}

const PROJECT_ID_MATCH = SUPABASE_URL.match(/https?:\/\/([a-zA-Z0-9]+)\.supabase\.co/);
if (!PROJECT_ID_MATCH || !PROJECT_ID_MATCH[1]) {
    console.error('Could not extract project ID from SUPABASE_URL.');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL is in the format https://<project-id>.supabase.co');
    process.exit(1);
}
const PROJECT_ID = PROJECT_ID_MATCH[1];


console.log(`Attempting to rebuild schema for Supabase project: ${PROJECT_ID}`);

try {
  // Check if Supabase CLI is installed
  console.log('Checking for Supabase CLI...');
  execSync('supabase --version', { stdio: 'pipe' });
  console.log('Supabase CLI found.');

  // Link the project (requires login if not already linked)
  console.log('Linking Supabase project... You may be prompted to log in or provide an access token.');
  execSync(`supabase link --project-ref ${PROJECT_ID}`, { stdio: 'inherit' });
  console.log('Project linked successfully.');

  // Generate types to force schema refresh
  console.log('Generating types to force schema refresh...');
  execSync(`supabase gen types typescript --linked > src/lib/supabase/database.types.ts`, { stdio: 'inherit' });

  console.log('\n✅ Schema rebuild complete!');
  console.log('The Supabase API schema cache has been updated.');
  console.log('Please restart your Next.js development server for the changes to take effect.');

} catch (error) {
  console.error('\n❌ An error occurred during the schema rebuild process.');
  if (error.message.includes('command not found')) {
      console.error('Error: The Supabase CLI is not installed or not in your PATH.');
      console.error('Please install it by running: npm install -g supabase');
  } else {
      console.error('Error details:', error.message);
  }
  process.exit(1);
}

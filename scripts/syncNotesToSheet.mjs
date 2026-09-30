import { saveAllNotesToSheet, fetchNotesFromSheet } from '../server/sheetsService.mjs';
import { MOCK_NOTES } from '../src/data/notes.ts';

async function main() {
  console.log(`Starting sync of ${MOCK_NOTES.length} notes to Google Sheets tab "GhiChu"...`);
  
  const saveResult = await saveAllNotesToSheet(MOCK_NOTES);
  console.log('Save result:', saveResult);

  console.log('Verifying by fetching notes back from Google Sheets...');
  const fetchedNotes = await fetchNotesFromSheet();
  console.log(`Successfully fetched ${fetchedNotes.length} notes from Google Sheets!`);
  
  if (fetchedNotes.length >= 40) {
    console.log('SUCCESS: All 40 notes are now live in Google Sheets tab "GhiChu"!');
  } else {
    console.warn(`WARNING: Fetched ${fetchedNotes.length} notes, expected 40.`);
  }
}

main().catch((err) => {
  console.error('Sync failed with error:', err);
  process.exit(1);
});

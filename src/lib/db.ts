import { openDB } from 'idb'
import { APP_ID } from './backup'
import { initialState, migrateState, type StudyState } from './study'

export const DB_NAME = APP_ID
let writes: Promise<void> = Promise.resolve()
const open = () => openDB(DB_NAME, 1, {
  upgrade(database) { database.createObjectStore('state') }
})
export async function loadState() {
  await writes
  const database = await open()
  try {
    const saved = await database.get('state', 'current')
    return saved ? migrateState(saved) : structuredClone(initialState)
  } finally { database.close() }
}
export function saveState(state: StudyState) {
  const next = writes.then(async () => {
    const database = await open()
    try { await database.put('state', state, 'current') } finally { database.close() }
  })
  writes = next.catch(() => {})
  return next
}

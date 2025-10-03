import * as Updates from 'expo-updates';

let inFlight = false;

export async function checkUpdatesOnce(reloadOnNew = true) {
  if (__DEV__) return;
  if (inFlight) return;
  inFlight = true;
  try {
    const res = await Updates.checkForUpdateAsync();
    if (res.isAvailable) {
      const fetched = await Updates.fetchUpdateAsync();
      if (fetched.isNew && reloadOnNew) {
        await Updates.reloadAsync();
      }
    }
  } catch (e) {
    console.log('updates error', e);
  } finally {
    inFlight = false;
  }
}
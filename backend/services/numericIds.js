export async function nextNumericId(db, collectionName, userId) {
  const rows = await db.collection(collectionName).find({ userId }).toArray();
  let highest = 0;
  for (const row of rows) highest = Math.max(highest, Number(row.id) || 0);
  if (collectionName === 'rss_feedovi') {
    for (const name of ['grupe', 'ai_grupa']) {
      const references = await db.collection(name).find({ userId }).toArray();
      for (const row of references) {
        for (const id of row.feedIds || []) highest = Math.max(highest, Number(id) || 0);
      }
    }
  }
  const counters = db.collection('id_counters');
  const key = `${collectionName}:${userId}`;
  try {
    await counters.updateOne({ _id: key }, { $max: { value: highest } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
  const counter = await counters.findOneAndUpdate({ _id: key }, { $inc: { value: 1 } }, { returnDocument: 'after' });
  return counter.value;
}

export async function removeFeedReferences(db, userId, feedId) {
  for (const name of ['grupe', 'ai_grupa']) {
    await db.collection(name).updateMany({ userId }, { $pull: { feedIds: { $in: [feedId, String(feedId)] } } });
  }
}

import { v4 as uuidv4 } from 'uuid';

const LOOKBACK_DAYS = 2; // today + yesterday
const JOB_INTERVAL_MS = 5 * 60 * 1000;
const MISSED_DELAY_MS = 30 * 60 * 1000;

const dateStr = (date) => date.toISOString().slice(0, 10);

const buildScheduledIso = (day, time) => {
  const safeTime = `${time}`.length === 5 ? `${time}:00` : time;
  return new Date(`${day}T${safeTime}`).toISOString();
};

export function startMissedDoseJob(db) {
  const run = async () => {
    await db.read();
    const now = Date.now();
    const medicines = (db.data.medicines || []).filter((m) => m.active);
    let added = 0;

    for (const medicine of medicines) {
      const times = Array.isArray(medicine.times) ? medicine.times : [];
      if (!times.length) continue;

      for (let i = 0; i < LOOKBACK_DAYS; i += 1) {
        const dayDate = new Date();
        dayDate.setDate(dayDate.getDate() - i);
        const day = dateStr(dayDate);

        if (medicine.startDate && day < medicine.startDate) continue;
        if (medicine.endDate && day > medicine.endDate) continue;

        for (const time of times) {
          const scheduledTime = buildScheduledIso(day, time);
          const scheduledTs = new Date(scheduledTime).getTime();
          if (now - scheduledTs <= MISSED_DELAY_MS) continue;

          const exists = (db.data.logs || []).some(
            (log) =>
              log.medicineId === medicine.id &&
              log.scheduledTime === scheduledTime &&
              ['taken', 'snoozed', 'missed'].includes(log.status),
          );

          if (!exists) {
            db.data.logs.push({
              id: uuidv4(),
              medicineId: medicine.id,
              userId: medicine.userId,
              scheduledTime,
              actualTime: new Date().toISOString(),
              status: 'missed',
            });
            added += 1;
          }
        }
      }
    }

    if (added > 0) {
      await db.write();
    }
  };

  run().catch(() => {});
  setInterval(() => {
    run().catch(() => {});
  }, JOB_INTERVAL_MS);
}

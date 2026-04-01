import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { startMissedDoseJob } from './jobs/missedDoses.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.join(__dirname, 'data', 'db.json');

const adapter = new JSONFile(dbFile);
const db = new Low(adapter, {
  users: [],
  sessions: [],
  medicines: [],
  logs: [],
  healthRecords: [],
  profiles: [],
  appointments: [],
});

await db.read();
db.data.users ||= [];
db.data.sessions ||= [];
db.data.medicines ||= [];
db.data.logs ||= [];
db.data.healthRecords ||= [];
db.data.profiles ||= [];
db.data.appointments ||= [];
await db.write();

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ message: 'Missing auth token' });
  }

  await db.read();
  const session = db.data.sessions.find((item) => item.token === token);

  if (!session) {
    return res.status(401).json({ message: 'Invalid session token' });
  }

  req.userId = session.userId;
  next();
};

const getUserProfile = (userId) => {
  const existing = db.data.profiles.find((p) => p.userId === userId);
  if (existing) return existing;
  const fallback = {
    id: uuidv4(),
    userId,
    name: '',
    age: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: '',
  };
  db.data.profiles.push(fallback);
  return fallback;
};

app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  await db.read();
  const existing = db.data.users.find((u) => u.username === username);
  if (existing) {
    return res.status(409).json({ message: 'Username already exists' });
  }

  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: userId,
    username,
    password: hashedPassword,
    name: '',
    age: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: '',
  };

  db.data.users.push(user);
  getUserProfile(userId);
  await db.write();

  return res.status(201).json({ message: 'Registered successfully' });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  await db.read();
  const user = db.data.users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = uuidv4();
  db.data.sessions = db.data.sessions.filter((session) => session.userId !== user.id);
  db.data.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  await db.write();

  res.json({
    token,
    user: { id: user.id, username: user.username },
  });
});

app.post('/api/auth/demo', async (req, res) => {
  await db.read();
  let demoUser = db.data.users.find((u) => u.username === 'demo_user');
  let created = false;
  if (!demoUser) {
    created = true;
    demoUser = {
      id: uuidv4(),
      username: 'demo_user',
      password: await bcrypt.hash('demo1234', 10),
      name: 'Alex Demo',
      age: 28,
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyContact: '555-0100',
    };
    db.data.users.push(demoUser);
    db.data.profiles.push({
      id: uuidv4(),
      userId: demoUser.id,
      name: 'Alex Demo',
      age: 28,
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyContact: '555-0100',
    });
  }

  if (created) {
    const meds = [
      { name: 'Metformin 500mg', dosage: '500mg', frequency: 'Twice daily', times: ['08:00', '20:00'] },
      { name: 'Vitamin D3 1000IU', dosage: '1000IU', frequency: 'Once daily', times: ['09:00'] },
      { name: 'Lisinopril 10mg', dosage: '10mg', frequency: 'Once daily', times: ['07:00'] },
    ].map((m) => ({
      id: uuidv4(),
      userId: demoUser.id,
      ...m,
      startDate: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      notes: '',
      reminderEnabled: true,
      active: true,
      totalStock: 60,
      currentStock: 28,
      refillThreshold: 7,
      refillReminderEnabled: true,
    }));
    db.data.medicines.push(...meds);

    const recTypes = ['Blood Pressure', 'Blood Sugar', 'Weight'];
    for (let i = 0; i < 10; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() - Math.floor((i * 14) / 10));
      const type = recTypes[i % recTypes.length];
      const value =
        type === 'Blood Pressure'
          ? { systolic: 115 + (i % 6) * 3, diastolic: 75 + (i % 5) * 2 }
          : type === 'Blood Sugar'
            ? 90 + (i % 7) * 7
            : (72 + (i % 5) * 0.4).toFixed(1);
      const unit = type === 'Blood Pressure' ? 'mmHg' : type === 'Blood Sugar' ? 'mg/dL' : 'kg';
      db.data.healthRecords.push({
        id: uuidv4(),
        userId: demoUser.id,
        type,
        value,
        unit,
        date: d.toISOString(),
        notes: '',
      });
    }

    for (let i = 0; i < 20; i += 1) {
      const med = meds[i % meds.length];
      const day = new Date();
      day.setDate(day.getDate() - (i % 7));
      const t = med.times[i % med.times.length];
      const scheduledTime = new Date(`${day.toISOString().slice(0, 10)}T${t}:00`).toISOString();
      db.data.logs.push({
        id: uuidv4(),
        medicineId: med.id,
        userId: demoUser.id,
        scheduledTime,
        actualTime: new Date(new Date(scheduledTime).getTime() + 20 * 60000).toISOString(),
        status: i % 4 === 0 ? 'missed' : 'taken',
      });
    }
  }

  const token = uuidv4();
  db.data.sessions = db.data.sessions.filter((session) => session.userId !== demoUser.id);
  db.data.sessions.push({ token, userId: demoUser.id, createdAt: new Date().toISOString() });
  await db.write();

  res.json({
    token,
    user: { id: demoUser.id, username: demoUser.username },
  });
});

app.use('/api', authMiddleware);

app.get('/api/medicines', async (req, res) => {
  await db.read();
  const medicines = db.data.medicines.filter((m) => m.userId === req.userId);
  res.json(medicines);
});

app.post('/api/medicines', async (req, res) => {
  const payload = req.body;
  const medicine = {
    id: uuidv4(),
    userId: req.userId,
    name: payload.name || '',
    dosage: payload.dosage || '',
    frequency: payload.frequency || 'Once daily',
    times: payload.times || [],
    startDate: payload.startDate || '',
    endDate: payload.endDate || '',
    notes: payload.notes || '',
    reminderEnabled: payload.reminderEnabled ?? true,
    active: payload.active ?? true,
    totalStock: Number(payload.totalStock || 0),
    currentStock: Number(payload.currentStock || 0),
    refillThreshold: Number(payload.refillThreshold ?? 7),
    refillReminderEnabled: payload.refillReminderEnabled ?? true,
  };
  await db.read();
  db.data.medicines.push(medicine);
  await db.write();
  res.status(201).json(medicine);
});

app.put('/api/medicines/:id', async (req, res) => {
  await db.read();
  const index = db.data.medicines.findIndex((m) => m.id === req.params.id && m.userId === req.userId);
  if (index === -1) return res.status(404).json({ message: 'Medicine not found' });
  db.data.medicines[index] = { ...db.data.medicines[index], ...req.body };
  await db.write();
  res.json(db.data.medicines[index]);
});

app.get('/api/medicines/low-stock', async (req, res) => {
  await db.read();
  const list = db.data.medicines.filter(
    (m) =>
      m.userId === req.userId &&
      Number.isFinite(Number(m.currentStock)) &&
      Number(m.currentStock) <= Number(m.refillThreshold ?? 7),
  );
  res.json(list);
});

app.delete('/api/medicines/:id', async (req, res) => {
  await db.read();
  const before = db.data.medicines.length;
  db.data.medicines = db.data.medicines.filter((m) => !(m.id === req.params.id && m.userId === req.userId));
  if (db.data.medicines.length === before) return res.status(404).json({ message: 'Medicine not found' });
  await db.write();
  res.status(204).send();
});

app.get('/api/logs', async (req, res) => {
  await db.read();
  res.json(db.data.logs.filter((l) => l.userId === req.userId));
});

app.post('/api/logs', async (req, res) => {
  const entry = {
    id: uuidv4(),
    userId: req.userId,
    medicineId: req.body.medicineId,
    scheduledTime: req.body.scheduledTime,
    actualTime: req.body.actualTime || new Date().toISOString(),
    status: req.body.status || 'taken',
  };
  await db.read();
  db.data.logs.push(entry);
  if (entry.status === 'taken') {
    const idx = db.data.medicines.findIndex((m) => m.id === entry.medicineId && m.userId === req.userId);
    if (idx >= 0 && Number.isFinite(Number(db.data.medicines[idx].currentStock))) {
      db.data.medicines[idx].currentStock = Math.max(0, Number(db.data.medicines[idx].currentStock) - 1);
    }
  }
  await db.write();
  res.status(201).json(entry);
});

app.get('/api/health-records', async (req, res) => {
  await db.read();
  res.json(db.data.healthRecords.filter((r) => r.userId === req.userId));
});

app.post('/api/health-records', async (req, res) => {
  const record = {
    id: uuidv4(),
    userId: req.userId,
    type: req.body.type,
    value: req.body.value,
    unit: req.body.unit,
    date: req.body.date,
    notes: req.body.notes || '',
  };
  await db.read();
  db.data.healthRecords.push(record);
  await db.write();
  res.status(201).json(record);
});

app.put('/api/health-records/:id', async (req, res) => {
  await db.read();
  const index = db.data.healthRecords.findIndex((r) => r.id === req.params.id && r.userId === req.userId);
  if (index === -1) return res.status(404).json({ message: 'Record not found' });
  db.data.healthRecords[index] = { ...db.data.healthRecords[index], ...req.body };
  await db.write();
  res.json(db.data.healthRecords[index]);
});

app.delete('/api/health-records/:id', async (req, res) => {
  await db.read();
  const before = db.data.healthRecords.length;
  db.data.healthRecords = db.data.healthRecords.filter((r) => !(r.id === req.params.id && r.userId === req.userId));
  if (before === db.data.healthRecords.length) return res.status(404).json({ message: 'Record not found' });
  await db.write();
  res.status(204).send();
});

app.get('/api/profile', async (req, res) => {
  await db.read();
  const profile = getUserProfile(req.userId);
  res.json(profile);
});

app.put('/api/profile', async (req, res) => {
  await db.read();
  const existing = getUserProfile(req.userId);
  const next = { ...existing, ...req.body, userId: req.userId };
  db.data.profiles = db.data.profiles.map((p) => (p.id === existing.id ? next : p));
  const userIndex = db.data.users.findIndex((u) => u.id === req.userId);
  if (userIndex >= 0) {
    db.data.users[userIndex] = { ...db.data.users[userIndex], ...next, password: db.data.users[userIndex].password };
  }
  await db.write();
  res.json(next);
});

app.get('/api/appointments', async (req, res) => {
  await db.read();
  const appointments = db.data.appointments
    .filter((a) => a.userId === req.userId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  res.json(appointments);
});

app.post('/api/appointments', async (req, res) => {
  await db.read();
  const appointment = {
    id: uuidv4(),
    userId: req.userId,
    doctorName: req.body.doctorName || '',
    specialty: req.body.specialty || 'General Physician',
    clinicName: req.body.clinicName || '',
    date: req.body.date,
    time: req.body.time,
    notes: req.body.notes || '',
    status: req.body.status || 'upcoming',
    reminderEnabled: req.body.reminderEnabled ?? true,
  };
  db.data.appointments.push(appointment);
  await db.write();
  res.status(201).json(appointment);
});

app.put('/api/appointments/:id', async (req, res) => {
  await db.read();
  const idx = db.data.appointments.findIndex((a) => a.id === req.params.id && a.userId === req.userId);
  if (idx < 0) return res.status(404).json({ message: 'Appointment not found' });
  db.data.appointments[idx] = { ...db.data.appointments[idx], ...req.body };
  await db.write();
  res.json(db.data.appointments[idx]);
});

app.delete('/api/appointments/:id', async (req, res) => {
  await db.read();
  const before = db.data.appointments.length;
  db.data.appointments = db.data.appointments.filter((a) => !(a.id === req.params.id && a.userId === req.userId));
  if (before === db.data.appointments.length) return res.status(404).json({ message: 'Appointment not found' });
  await db.write();
  res.status(204).send();
});

startMissedDoseJob(db);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

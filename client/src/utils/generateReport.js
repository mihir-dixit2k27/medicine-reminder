import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const TEAL = [13, 148, 136];

const fmtDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
};

const safe = (value) => (value === null || value === undefined || value === '' ? '-' : String(value));

async function captureChart(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  try {
    const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 });
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export async function generateHealthReport(user, medicines, logs, healthRecords, appointments) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pages = { total: 0 };
  const now = new Date();

  // Page 1 - Cover
  doc.setFontSize(24);
  doc.setTextColor(...TEAL);
  doc.text('MediCare - Personal Health Report', 56, 90);
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.text(`Patient: ${safe(user?.name || user?.username)}`, 56, 140);
  doc.text(`Age: ${safe(user?.age)}    Gender: ${safe(user?.gender)}    Blood Group: ${safe(user?.bloodGroup)}`, 56, 165);
  doc.text(`Report generated: ${now.toLocaleString()}`, 56, 190);
  doc.setDrawColor(...TEAL);
  doc.line(56, 210, 540, 210);
  pages.total += 1;

  // Page 2 - Medication summary
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(...TEAL);
  doc.text('Active Medications', 56, 60);

  const medicationRows = (medicines || []).map((m) => [
    safe(m.name),
    safe(m.dosage),
    safe(m.frequency),
    fmtDate(m.startDate),
    fmtDate(m.endDate),
    m.active ? 'Active' : 'Inactive',
  ]);

  if (medicationRows.length) {
    autoTable(doc, {
      startY: 76,
      head: [['Medicine Name', 'Dosage', 'Frequency', 'Start Date', 'End Date', 'Status']],
      body: medicationRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: TEAL },
    });
  } else {
    doc.setTextColor(80, 80, 80);
    doc.text('No medications on file', 56, 92);
  }

  const yAfterMeds = Math.max(doc.lastAutoTable?.finalY || 92, 120) + 28;
  doc.setFontSize(16);
  doc.setTextColor(...TEAL);
  doc.text('Medication Adherence (Last 30 Days)', 56, yAfterMeds);

  const start30 = new Date();
  start30.setDate(start30.getDate() - 30);
  const adherenceRows = (medicines || []).map((m) => {
    const relevantLogs = (logs || []).filter(
      (l) => l.medicineId === m.id && new Date(l.scheduledTime || l.actualTime).getTime() >= start30.getTime(),
    );
    const taken = relevantLogs.filter((l) => l.status === 'taken').length;
    const missed = relevantLogs.filter((l) => l.status === 'missed').length;
    const scheduled = relevantLogs.length;
    const adherence = scheduled ? `${Math.round((taken / scheduled) * 100)}%` : '0%';
    return [safe(m.name), `${scheduled}`, `${taken}`, `${missed}`, adherence];
  });

  if (adherenceRows.length) {
    autoTable(doc, {
      startY: yAfterMeds + 12,
      head: [['Medicine Name', 'Doses Scheduled', 'Taken', 'Missed', 'Adherence %']],
      body: adherenceRows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: TEAL },
    });
  } else {
    doc.setTextColor(80, 80, 80);
    doc.text('No medications on file', 56, yAfterMeds + 24);
  }
  pages.total += 1;

  // Page 3 - Health records
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(...TEAL);
  doc.text('Health Vitals Log', 56, 60);

  const sortedRecords = [...(healthRecords || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latest50 = sortedRecords.slice(0, 50);

  if (latest50.length) {
    autoTable(doc, {
      startY: 76,
      head: [['Date', 'Type', 'Value', 'Unit', 'Notes']],
      body: latest50.map((r) => [
        fmtDate(r.date),
        safe(r.type),
        typeof r.value === 'object' ? `${safe(r.value?.systolic)}/${safe(r.value?.diastolic)}` : safe(r.value),
        safe(r.unit),
        safe(r.notes),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: TEAL },
    });
    if (sortedRecords.length > 50) {
      doc.setTextColor(90, 90, 90);
      doc.text('Showing latest 50 records', 56, (doc.lastAutoTable?.finalY || 90) + 18);
    }
  } else {
    doc.setTextColor(80, 80, 80);
    doc.text('No health records logged yet', 56, 90);
  }
  pages.total += 1;

  // Page 4 - Appointments
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(...TEAL);
  doc.text('Doctor Appointments', 56, 60);
  const apptRows = (appointments || []).map((a) => [
    safe(a.doctorName),
    safe(a.specialty),
    safe(a.clinicName),
    fmtDate(a.date),
    safe(a.time),
    safe(a.status),
    safe(a.notes),
  ]);
  if (apptRows.length) {
    autoTable(doc, {
      startY: 76,
      head: [['Doctor', 'Specialty', 'Clinic', 'Date', 'Time', 'Status', 'Notes']],
      body: apptRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: TEAL },
    });
  } else {
    doc.setTextColor(80, 80, 80);
    doc.text('No appointments on file', 56, 90);
  }
  pages.total += 1;

  // Page 5 - Charts
  doc.addPage();
  doc.setFontSize(16);
  doc.setTextColor(...TEAL);
  doc.text('Charts Snapshot', 56, 60);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Charts captured at time of export', 56, 78);

  const adherenceChart = await captureChart('#weekly-adherence-chart');
  const trendsChart = await captureChart('#health-trends-chart');

  let y = 96;
  if (adherenceChart) {
    doc.addImage(adherenceChart, 'PNG', 56, y, 480, 170);
    y += 190;
  }
  if (trendsChart) {
    doc.addImage(trendsChart, 'PNG', 56, y, 480, 170);
    y += 190;
  }
  if (!adherenceChart && !trendsChart) {
    doc.setTextColor(80, 80, 80);
    doc.text('Charts are not available in the current view. Section skipped gracefully.', 56, y + 12);
  }
  pages.total += 1;

  // Footer on every page
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${i} of ${total}`, 56, 820);
    doc.text('Generated by MediCare App - Confidential', 380, 820);
  }

  const name = safe(user?.name || user?.username).replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const datePart = now.toISOString().slice(0, 10);
  doc.save(`HealthReport_${name || 'User'}_${datePart}.pdf`);
}

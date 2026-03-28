// localStorage-based patient and sample storage for reliable cross-page data sharing

export const PATIENTS_KEY = "pathlab_patients_v3";
export const SAMPLES_KEY = "pathlab_samples_v3";
export const RESULTS_KEY = "pathlab_results_v3";

export interface StoredPatient {
  labId: string;
  name: string;
  age: string;
  gender: string;
  phone: string;
  address: string;
  doctorName: string;
  assignedTests: string[]; // test codes
  registeredAt: number;
}

export interface StoredSample {
  id: string;
  orderId: string;
  patientLabId: string;
  patientName: string;
  tests: string[];
  sampleType: string;
  barcode: string;
  timestamp: string;
  status: "Pending" | "Collected" | "In-Process" | "Completed";
}

export interface StoredResult {
  sampleId: string;
  testName: string;
  unit: string;
  referenceRange: string;
  value: string;
}

export function getStoredPatients(): StoredPatient[] {
  try {
    const raw = localStorage.getItem(PATIENTS_KEY);
    return raw ? (JSON.parse(raw) as StoredPatient[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredPatient(patient: StoredPatient): void {
  const existing = getStoredPatients();
  // Avoid duplicates by phone
  const filtered = existing.filter((p) => p.phone !== patient.phone);
  localStorage.setItem(PATIENTS_KEY, JSON.stringify([patient, ...filtered]));
}

export function getStoredSamples(): StoredSample[] {
  try {
    const raw = localStorage.getItem(SAMPLES_KEY);
    return raw ? (JSON.parse(raw) as StoredSample[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredSample(sample: StoredSample): void {
  const existing = getStoredSamples();
  localStorage.setItem(SAMPLES_KEY, JSON.stringify([...existing, sample]));
}

export function updateSampleStatus(
  id: string,
  status: StoredSample["status"],
): void {
  const samples = getStoredSamples();
  const updated = samples.map((s) => (s.id === id ? { ...s, status } : s));
  localStorage.setItem(SAMPLES_KEY, JSON.stringify(updated));
}

export function getStoredResults(): StoredResult[] {
  try {
    const raw = localStorage.getItem(RESULTS_KEY);
    return raw ? (JSON.parse(raw) as StoredResult[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredResults(results: StoredResult[]): void {
  const existing = getStoredResults();
  const ids = results.map((r) => `${r.sampleId}-${r.testName}`);
  const filtered = existing.filter(
    (r) => !ids.includes(`${r.sampleId}-${r.testName}`),
  );
  localStorage.setItem(RESULTS_KEY, JSON.stringify([...filtered, ...results]));
}

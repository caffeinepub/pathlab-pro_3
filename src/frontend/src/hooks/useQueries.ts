import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob, type Gender, type TestStatus } from "../backend";
import type {
  BillId,
  BillLineItem,
  PatientId,
  PatientInput,
  PaymentStatus,
  ReportId,
  TestCatalogInput,
  TestCode,
  TestReportInput,
  TestResult,
} from "../backend.d";
import { SAMPLE_TEST_CATALOG } from "../lib/constants";
import { useActor } from "./useActor";

// ─── LocalDB ─────────────────────────────────────────────────────────────────
// All patient/report/bill data lives here first; ICP backend is best-effort.

type LocalPatientRec = {
  id: number;
  patient: {
    name: string;
    age: number;
    gender: string;
    phone: string;
    address: string;
  };
  createdAt: number;
  updatedAt: number;
};

type LocalReport = {
  id: number;
  patientId: number;
  status: string;
  tests: string[];
  results: TestResult[];
  notes: string;
  doctorName: string;
  createdAt: number;
  completedAt?: number;
};

type LocalBill = {
  id: number;
  reportId: number;
  lineItems: BillLineItem[];
  paymentStatus: string;
  gstAmount: number;
  totalAmount: number;
  timestamp: number;
};

const LocalDB = {
  // Patients
  getPatients: (): LocalPatientRec[] => {
    try {
      return JSON.parse(localStorage.getItem("pathlab_patients") || "[]");
    } catch {
      return [];
    }
  },
  savePatients: (p: LocalPatientRec[]) =>
    localStorage.setItem("pathlab_patients", JSON.stringify(p)),

  // Reports
  getReports: (): LocalReport[] => {
    try {
      return JSON.parse(localStorage.getItem("pathlab_reports") || "[]");
    } catch {
      return [];
    }
  },
  saveReports: (r: LocalReport[]) =>
    localStorage.setItem("pathlab_reports", JSON.stringify(r)),

  // Bills
  getBills: (): LocalBill[] => {
    try {
      return JSON.parse(localStorage.getItem("pathlab_bills") || "[]");
    } catch {
      return [];
    }
  },
  saveBills: (b: LocalBill[]) =>
    localStorage.setItem("pathlab_bills", JSON.stringify(b)),

  // Sequential counters
  nextId: (key: string): number => {
    const n = Number.parseInt(localStorage.getItem(key) || "0") + 1;
    localStorage.setItem(key, String(n));
    return n;
  },
};

// Convert local patient record to the shape Patients.tsx expects (bigints)
function toPatientRecord(r: LocalPatientRec) {
  return {
    patient: {
      name: r.patient.name,
      age: BigInt(r.patient.age),
      gender: r.patient.gender as Gender,
      phone: r.patient.phone,
      address: r.patient.address,
    },
    createdAt: BigInt(r.createdAt),
    updatedAt: BigInt(r.updatedAt),
  };
}

// Convert local report to the shape ResultEntry/Reports expects (bigints)
function toTestReport(r: LocalReport) {
  return {
    status: r.status as TestStatus,
    tests: r.tests,
    patientId: BigInt(r.patientId) as PatientId,
    createdAt: BigInt(r.createdAt),
    completedAt: r.completedAt ? BigInt(r.completedAt) : undefined,
    results: r.results,
    notes: r.notes,
    doctorName: r.doctorName,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) {
        // Compute from localStorage
        const patients = LocalDB.getPatients();
        const reports = LocalDB.getReports();
        const today = new Date().toDateString();
        const reportsToday = reports.filter(
          (r) => new Date(r.createdAt).toDateString() === today,
        ).length;
        return {
          totalPatients: BigInt(patients.length),
          pendingReports: BigInt(
            reports.filter((r) => r.status === "pending").length,
          ),
          reportsToday: BigInt(reportsToday),
          totalRevenue: BigInt(0),
        };
      }
      try {
        return await actor.getDashboardStats();
      } catch {
        return null;
      }
    },
    enabled: !isFetching,
    staleTime: 30000,
  });
}

export function usePatients() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      // Always return localStorage data immediately
      const local = LocalDB.getPatients();
      const localRecords = local.map(toPatientRecord);

      // Best-effort: try to sync from backend (non-blocking)
      if (actor && !isFetching) {
        try {
          const backendRecords = await actor.getAllPatientsByCreatedAt();
          if (backendRecords.length > 0) {
            // Backend has data; merge with local (local takes precedence for newly added)
            // For simplicity just return local if local has data, else backend
            if (local.length > 0) return localRecords;
            return backendRecords;
          }
        } catch {
          // ignore
        }
      }
      return localRecords;
    },
    enabled: true,
    staleTime: 0,
  });
}

export function useTestCatalog() {
  const { actor } = useActor();
  return useQuery({
    queryKey: ["testCatalog"],
    initialData: SAMPLE_TEST_CATALOG,
    queryFn: async () => {
      if (!actor) return SAMPLE_TEST_CATALOG;
      try {
        const backendTests = await actor.getAllTestCatalog();
        return backendTests.length > 0 ? backendTests : SAMPLE_TEST_CATALOG;
      } catch {
        return SAMPLE_TEST_CATALOG;
      }
    },
    enabled: true,
    staleTime: 60000,
  });
}

export function useTestReport(reportId: ReportId | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["report", reportId?.toString()],
    queryFn: async () => {
      if (reportId === null) return null;
      // Try localStorage first
      const reports = LocalDB.getReports();
      const local = reports.find((r) => r.id === Number(reportId));
      if (local) return toTestReport(local);
      // Fallback to backend
      if (!actor) return null;
      try {
        return await actor.getTestReport(reportId);
      } catch {
        return null;
      }
    },
    enabled: !isFetching && reportId !== null,
  });
}

export function usePatientReports(patientId: PatientId | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["patientReports", patientId?.toString()],
    queryFn: async () => {
      if (patientId === null) return [];
      // Try localStorage first
      const reports = LocalDB.getReports();
      const local = reports.filter((r) => r.patientId === Number(patientId));
      if (local.length > 0) return local.map(toTestReport);
      // Fallback to backend
      if (!actor) return [];
      try {
        return await actor.getPatientReportsByCreatedAt(patientId);
      } catch {
        return [];
      }
    },
    enabled: !isFetching && patientId !== null,
  });
}

export function useBills() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      // Try localStorage first
      const local = LocalDB.getBills();
      if (local.length > 0) {
        return local.map((b) => ({
          lineItems: b.lineItems,
          paymentStatus: b.paymentStatus as PaymentStatus,
          gstAmount: BigInt(b.gstAmount),
          totalAmount: BigInt(b.totalAmount),
          timestamp: BigInt(b.timestamp),
          reportId: BigInt(b.reportId) as ReportId,
        }));
      }
      if (!actor) return [];
      try {
        return await actor.getAllBillsByTimestamp();
      } catch {
        return [];
      }
    },
    enabled: !isFetching,
  });
}

export function useSignature(reportId: ReportId | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["signature", reportId?.toString()],
    queryFn: async () => {
      if (!actor || reportId === null) return null;
      try {
        const blob = await actor.getSignature(reportId);
        const url = blob.getDirectURL();
        return url;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && reportId !== null,
  });
}

export function useAddPatient() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: PatientInput): Promise<PatientId> => {
      const id = LocalDB.nextId("pathlab_patient_counter");
      const now = Date.now();
      const rec: LocalPatientRec = {
        id,
        patient: {
          name: data.name,
          age: data.age ? Number(data.age) : 0,
          gender: data.gender ?? "male",
          phone: data.phone,
          address: data.address,
        },
        createdAt: now,
        updatedAt: now,
      };
      const existing = LocalDB.getPatients();
      LocalDB.savePatients([...existing, rec]);

      // Best-effort ICP save (non-fatal)
      if (actor) {
        try {
          await actor.addPatient(data);
        } catch {
          // ignore
        }
      }

      return BigInt(id) as PatientId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useAddTestCatalog() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: TestCatalogInput) => {
      if (!actor) throw new Error("No actor");
      return actor.addTestCatalog(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["testCatalog"] });
    },
  });
}

export function useUpdateTestPrice() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ code, price }: { code: TestCode; price: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateTestPrice(code, price);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["testCatalog"] });
    },
  });
}

export function useUpdateTestRange() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      test,
      referenceRange,
    }: {
      test: {
        code: string;
        name: string;
        unit: string;
        referenceRange: string;
        price: bigint;
        sampleType: string;
      };
      referenceRange: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.addTestCatalog({
        code: test.code,
        name: test.name,
        unit: test.unit,
        referenceRange,
        price: test.price,
        sampleType: test.sampleType,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["testCatalog"] });
    },
  });
}

export function useCreateTestReport() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: TestReportInput): Promise<ReportId> => {
      const id = LocalDB.nextId("pathlab_report_counter");
      const now = Date.now();
      const rep: LocalReport = {
        id,
        patientId: Number(data.patientId),
        status: "pending",
        tests: data.tests,
        results: [],
        notes: data.notes,
        doctorName: data.doctorName,
        createdAt: now,
      };
      const existing = LocalDB.getReports();
      LocalDB.saveReports([...existing, rep]);

      // Best-effort ICP save (non-fatal)
      if (actor) {
        try {
          await actor.createTestReport(data);
        } catch {
          // ignore
        }
      }

      return BigInt(id) as ReportId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patientReports"] });
    },
  });
}

export function useUpdateReportResults() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      results,
    }: { reportId: ReportId; results: TestResult[] }) => {
      // Update localStorage
      const reports = LocalDB.getReports();
      const updated = reports.map((r) =>
        r.id === Number(reportId)
          ? { ...r, results, status: "completed", completedAt: Date.now() }
          : r,
      );
      LocalDB.saveReports(updated);

      // Best-effort ICP save
      if (actor) {
        try {
          await actor.updateTestReportResult(reportId, results);
        } catch {
          // ignore
        }
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["report", vars.reportId.toString()] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useStoreSignature() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({
      reportId,
      dataUrl,
    }: { reportId: ReportId; dataUrl: string }) => {
      if (!actor) throw new Error("No actor");
      // Convert dataUrl to bytes
      const res = await fetch(dataUrl);
      const arrayBuf = await res.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      const blob = ExternalBlob.fromBytes(bytes);
      return actor.storeSignature(reportId, blob);
    },
  });
}

export function useCreateBill() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      lineItems,
    }: { reportId: ReportId; lineItems: BillLineItem[] }): Promise<BillId> => {
      const id = LocalDB.nextId("pathlab_bill_counter");
      const totalAmount = lineItems.reduce(
        (sum, li) => sum + Number(li.price),
        0,
      );
      const gstAmount = Math.round(totalAmount * 0.18);
      const bill: LocalBill = {
        id,
        reportId: Number(reportId),
        lineItems,
        paymentStatus: "unpaid",
        gstAmount,
        totalAmount: totalAmount + gstAmount,
        timestamp: Date.now(),
      };
      const existing = LocalDB.getBills();
      LocalDB.saveBills([...existing, bill]);

      // Best-effort ICP
      if (actor) {
        try {
          await actor.createBill(reportId, lineItems);
        } catch {
          // ignore
        }
      }

      return BigInt(id) as BillId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      billId,
      status,
    }: { billId: BillId; status: PaymentStatus }) => {
      // Update localStorage
      const bills = LocalDB.getBills();
      const updated = bills.map((b) =>
        b.id === Number(billId) ? { ...b, paymentStatus: status } : b,
      );
      LocalDB.saveBills(updated);

      // Best-effort ICP
      if (actor) {
        try {
          await actor.updatePaymentStatus(billId, status);
        } catch {
          // ignore
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useSeedTestCatalog() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tests: TestCatalogInput[]) => {
      if (!actor) throw new Error("No actor");
      // Seed in batches of 5 to avoid overwhelming ICP
      const batchSize = 5;
      for (let i = 0; i < tests.length; i += batchSize) {
        const batch = tests.slice(i, i + batchSize);
        await Promise.all(batch.map((t) => actor.addTestCatalog(t)));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["testCatalog"] });
    },
  });
}

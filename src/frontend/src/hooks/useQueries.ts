import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
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
import { useActor } from "./useActor";

export function useDashboardStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getDashboardStats();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePatients() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllPatientsByCreatedAt();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTestCatalog() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["testCatalog"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllTestCatalog();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTestReport(reportId: ReportId | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["report", reportId?.toString()],
    queryFn: async () => {
      if (!actor || reportId === null) return null;
      try {
        return await actor.getTestReport(reportId);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && reportId !== null,
  });
}

export function usePatientReports(patientId: PatientId | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["patientReports", patientId?.toString()],
    queryFn: async () => {
      if (!actor || patientId === null) return [];
      try {
        return await actor.getPatientReportsByCreatedAt(patientId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching && patientId !== null,
  });
}

export function useBills() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["bills"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllBillsByTimestamp();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !isFetching,
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
    mutationFn: async (data: PatientInput) => {
      if (!actor) throw new Error("No actor");
      return actor.addPatient(data);
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
    mutationFn: async (data: TestReportInput) => {
      if (!actor) throw new Error("No actor");
      return actor.createTestReport(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboardStats"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
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
      if (!actor) throw new Error("No actor");
      return actor.updateTestReportResult(reportId, results);
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
    }: { reportId: ReportId; lineItems: BillLineItem[] }) => {
      if (!actor) throw new Error("No actor");
      return actor.createBill(reportId, lineItems);
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
      if (!actor) throw new Error("No actor");
      return actor.updatePaymentStatus(billId, status);
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
      await Promise.all(tests.map((t) => actor.addTestCatalog(t)));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["testCatalog"] });
    },
  });
}

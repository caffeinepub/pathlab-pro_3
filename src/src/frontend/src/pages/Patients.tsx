import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  History,
  LogIn,
  Plus,
  Search,
  User,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Gender } from "../backend";
import type { PatientId } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddPatient,
  useCreateTestReport,
  usePatientReports,
  usePatients,
  useTestCatalog,
} from "../hooks/useQueries";
import { saveStoredPatient } from "../lib/patientStorage";

// ─── Patient History Dialog ───────────────────────────────────────────────────

type PatientRecord = {
  patient: {
    name: string;
    age: bigint;
    gender: string;
    phone: string;
    address: string;
  };
  createdAt: bigint;
};

function PatientHistoryDialog({
  patient,
  patientId,
  open,
  onOpenChange,
}: {
  patient: PatientRecord;
  patientId: PatientId;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: reports, isLoading } = usePatientReports(
    open ? patientId : null,
  );

  const formatDate = (ns: bigint) =>
    new Date(Number(ns) / 1_000_000).toLocaleDateString("hi-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const flagColor = (result: string, ref: string) => {
    const num = Number.parseFloat(result);
    if (Number.isNaN(num) || !ref) return "normal";
    const rangeParts = ref.match(/([\d.]+)\s*[-\u2013]\s*([\d.]+)/);
    if (!rangeParts) return "normal";
    const lo = Number.parseFloat(rangeParts[1]);
    const hi = Number.parseFloat(rangeParts[2]);
    if (num < lo) return "low";
    if (num > hi) return "high";
    return "normal";
  };

  const flagBadge = (flag: string) => {
    if (flag === "high")
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
          High ↑
        </Badge>
      );
    if (flag === "low")
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
          Low ↓
        </Badge>
      );
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
        Normal
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] flex flex-col"
        data-ocid="history.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-primary" />
            Test History — {patient.patient.name}
          </DialogTitle>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground pt-1">
            <span>
              Age:{" "}
              <strong className="text-foreground">
                {Number(patient.patient.age)}
              </strong>
            </span>
            <span>
              Gender:{" "}
              <strong className="text-foreground capitalize">
                {patient.patient.gender}
              </strong>
            </span>
            <span>
              Phone:{" "}
              <strong className="text-foreground">
                {patient.patient.phone}
              </strong>
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-1">
          {isLoading ? (
            <div className="space-y-3 py-2" data-ocid="history.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : !reports || reports.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-2"
              data-ocid="history.empty_state"
            >
              <Clock className="h-10 w-10 opacity-30" />
              <p className="text-sm">Koi test history nahi mili</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {[...reports]
                .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
                .map((report, idx) => {
                  const isCompleted = report.status === "completed";
                  return (
                    <Card
                      key={`report-${report.createdAt}`}
                      className="border border-border/70"
                      data-ocid={`history.item.${idx + 1}`}
                    >
                      <CardHeader className="pb-2 pt-3 px-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">
                              {formatDate(report.createdAt)}
                            </span>
                            {report.doctorName && (
                              <span className="text-xs text-muted-foreground">
                                • Dr. {report.doctorName}
                              </span>
                            )}
                          </div>
                          {isCompleted ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{report.status}</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        {report.results && report.results.length > 0 ? (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border/50">
                                <th className="text-left py-1 text-muted-foreground font-medium">
                                  Test
                                </th>
                                <th className="text-left py-1 text-muted-foreground font-medium">
                                  Result
                                </th>
                                <th className="text-left py-1 text-muted-foreground font-medium">
                                  Range
                                </th>
                                <th className="text-left py-1 text-muted-foreground font-medium">
                                  Flag
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.results.map((r) => (
                                <tr
                                  key={r.code}
                                  className="border-b border-border/30"
                                >
                                  <td className="py-1 pr-3 font-medium">
                                    {r.code}
                                  </td>
                                  <td className="py-1 pr-3">
                                    {r.result} {r.unit}
                                  </td>
                                  <td className="py-1 pr-3 text-muted-foreground">
                                    {r.referenceRange}
                                  </td>
                                  <td className="py-1">
                                    {flagBadge(
                                      flagColor(r.result, r.referenceRange),
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Tests: {report.tests?.join(", ") || "None"}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Patients() {
  const { data: patientRecords, isLoading } = usePatients();
  const { data: testCatalog } = useTestCatalog();
  const addPatient = useAddPatient();
  const createReport = useCreateTestReport();
  const { actor, isFetching: isActorLoading } = useActor();
  const { login, identity } = useInternetIdentity();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPatientIdx, setSelectedPatientIdx] = useState<number | null>(
    null,
  );
  const [savedLabId, setSavedLabId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: Gender.male as Gender,
    phone: "",
    address: "",
    doctorName: "",
    selectedTests: [] as string[],
  });

  const isLoggedIn = !!identity;

  const filtered = (patientRecords ?? []).filter(
    (r) =>
      r.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      r.patient.phone.includes(search),
  );

  const toggleTest = (code: string) => {
    setForm((p) => ({
      ...p,
      selectedTests: p.selectedTests.includes(code)
        ? p.selectedTests.filter((c) => c !== code)
        : [...p.selectedTests, code],
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      age: "",
      gender: Gender.male,
      phone: "",
      address: "",
      doctorName: "",
      selectedTests: [],
    });
    setSavedLabId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Pehle Sign In karein patient add karne ke liye.");
      return;
    }
    try {
      const patientId = await addPatient.mutateAsync({
        name: form.name,
        age: form.age ? BigInt(form.age) : undefined,
        gender: form.gender,
        phone: form.phone,
        address: form.address,
      });

      const labId = `LAB-${String(patientId).padStart(4, "0")}`;
      setSavedLabId(labId);

      // Save to localStorage for reliable cross-page access
      saveStoredPatient({
        labId,
        name: form.name,
        age: form.age,
        gender: String(form.gender),
        phone: form.phone,
        address: form.address,
        doctorName: form.doctorName ?? "",
        assignedTests: form.selectedTests,
        registeredAt: Date.now(),
      });

      // If tests were selected, create a report automatically
      if (form.selectedTests.length > 0) {
        try {
          await createReport.mutateAsync({
            patientId,
            tests: form.selectedTests,
            notes: "",
            doctorName: form.doctorName,
          });
          toast.success(
            `Patient registered! Lab ID: ${labId} — ${form.selectedTests.length} test(s) assigned.`,
          );
        } catch {
          toast.success(`Patient registered! Lab ID: ${labId}`);
          toast.warning(
            "Tests could not be assigned. Please add them from the Reports page.",
          );
        }
      } else {
        toast.success(`Patient registered! Lab ID: ${labId}`);
      }
    } catch {
      toast.error("Failed to add patient. Please try again.");
    }
  };

  const selectedRecord =
    selectedPatientIdx !== null ? (filtered[selectedPatientIdx] ?? null) : null;
  const selectedOriginalIdx =
    selectedRecord !== null && patientRecords
      ? patientRecords.findIndex(
          (r) =>
            r.createdAt === selectedRecord.createdAt &&
            r.patient.phone === selectedRecord.patient.phone,
        )
      : -1;
  const selectedPatientId =
    selectedOriginalIdx >= 0 ? BigInt(selectedOriginalIdx + 1) : null;

  return (
    <div className="space-y-6" data-ocid="patients.page">
      {/* Login Alert */}
      {!isLoggedIn && (
        <Alert
          variant="destructive"
          className="border-amber-400 bg-amber-50 text-amber-900"
          data-ocid="patients.error_state"
        >
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 font-semibold">
            Sign In Zaroori Hai
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>Patient data save karne ke liye pehle Sign In karein.</span>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-600 text-amber-800 hover:bg-amber-100"
              onClick={login}
              data-ocid="patients.primary_button"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In Karein
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Patients</h2>
          <p className="text-muted-foreground text-sm">
            Manage patient records
          </p>
        </div>
        {isLoggedIn ? (
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button data-ocid="patients.open_modal_button">
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-2xl max-h-[90vh] flex flex-col"
              data-ocid="patients.dialog"
            >
              <DialogHeader>
                <DialogTitle>New Patient Registration</DialogTitle>
              </DialogHeader>

              {savedLabId ? (
                /* ── Success State ── */
                <div
                  className="flex flex-col items-center gap-4 py-6"
                  data-ocid="patients.success_state"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">
                      Patient Registered!
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Lab ID generated successfully
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border-2 border-primary/30 bg-primary/5 px-6 py-3">
                    <span className="text-2xl font-bold tracking-widest text-primary">
                      {savedLabId}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        void navigator.clipboard.writeText(savedLabId);
                        toast.success("Lab ID copied!");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSavedLabId(null);
                        resetForm();
                      }}
                    >
                      Add Another Patient
                    </Button>
                    <Button
                      onClick={() => {
                        setOpen(false);
                        resetForm();
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Registration Form ── */
                <ScrollArea className="flex-1">
                  <form onSubmit={handleSubmit} className="space-y-5 px-1 pb-4">
                    {/* Patient Details */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Patient Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="pat-name">Full Name *</Label>
                          <Input
                            id="pat-name"
                            value={form.name}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, name: e.target.value }))
                            }
                            placeholder="e.g. Rajesh Kumar Sharma"
                            required
                            data-ocid="patients.input"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="pat-age">Age *</Label>
                          <Input
                            id="pat-age"
                            type="number"
                            min={0}
                            max={150}
                            value={form.age}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, age: e.target.value }))
                            }
                            placeholder="35"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="pat-gender">Gender *</Label>
                          <Select
                            value={form.gender}
                            onValueChange={(v) =>
                              setForm((p) => ({ ...p, gender: v as Gender }))
                            }
                          >
                            <SelectTrigger
                              id="pat-gender"
                              data-ocid="patients.select"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={Gender.male}>Male</SelectItem>
                              <SelectItem value={Gender.female}>
                                Female
                              </SelectItem>
                              <SelectItem value={Gender.other}>
                                Other
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="pat-phone">Phone *</Label>
                          <Input
                            id="pat-phone"
                            value={form.phone}
                            onChange={(e) =>
                              setForm((p) => ({ ...p, phone: e.target.value }))
                            }
                            placeholder="+91 98765 43210"
                            required
                          />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="pat-address">Address</Label>
                          <Input
                            id="pat-address"
                            value={form.address}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                address: e.target.value,
                              }))
                            }
                            placeholder="Mumbai, Maharashtra"
                          />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label htmlFor="pat-doctor">Referring Doctor</Label>
                          <Input
                            id="pat-doctor"
                            value={form.doctorName}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                doctorName: e.target.value,
                              }))
                            }
                            placeholder="Dr. Suresh Patel"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Test Selection */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Assign Tests
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {form.selectedTests.length === 0
                          ? "No tests selected (you can add tests later from Reports)"
                          : `${form.selectedTests.length} test(s) selected`}
                      </p>
                      {!testCatalog || testCatalog.length === 0 ? (
                        <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                          Test catalog empty. Go to{" "}
                          <strong>Test Catalog</strong> and click "Reload
                          Standard Tests" first.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto rounded-md border border-border p-2">
                          {testCatalog.map((test) => {
                            const isSelected = form.selectedTests.includes(
                              test.code,
                            );
                            return (
                              <button
                                key={test.code}
                                type="button"
                                onClick={() => toggleTest(test.code)}
                                className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:bg-muted/50"
                                }`}
                              >
                                <span
                                  className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${
                                    isSelected
                                      ? "border-primary bg-primary"
                                      : "border-muted-foreground/40"
                                  }`}
                                >
                                  {isSelected && (
                                    <svg
                                      aria-hidden="true"
                                      className="h-2.5 w-2.5 text-primary-foreground"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </span>
                                <span className="leading-tight">
                                  <span className="font-medium">
                                    {test.name}
                                  </span>
                                  <span className="block text-muted-foreground">
                                    ₹{Number(test.price)}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setOpen(false);
                          resetForm();
                        }}
                        data-ocid="patients.cancel_button"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          addPatient.isPending ||
                          createReport.isPending ||
                          isActorLoading ||
                          !actor
                        }
                        data-ocid="patients.submit_button"
                      >
                        {(addPatient.isPending || createReport.isPending) && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Register Patient
                      </Button>
                    </div>
                  </form>
                </ScrollArea>
              )}
            </DialogContent>
          </Dialog>
        ) : (
          <Button
            disabled
            variant="outline"
            className="opacity-60 cursor-not-allowed"
            data-ocid="patients.open_modal_button"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Patient (Sign In Required)
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-ocid="patients.search_input"
        />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4" />
            Patient List
            <Badge variant="secondary">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" data-ocid="patients.loading_state">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-ocid="patients.table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      #
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Lab ID
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Name
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Age
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Gender
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Phone
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      Address
                    </th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                      History
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record, idx) => {
                    const origIdx = patientRecords
                      ? patientRecords.findIndex(
                          (r) =>
                            r.createdAt === record.createdAt &&
                            r.patient.phone === record.patient.phone,
                        )
                      : -1;
                    const labId =
                      origIdx >= 0
                        ? `LAB-${String(origIdx + 1).padStart(4, "0")}`
                        : "—";
                    return (
                      <tr
                        key={`${record.patient.phone}-${record.createdAt}`}
                        className="border-b border-border/50 hover:bg-muted/30"
                        data-ocid={`patients.item.${idx + 1}`}
                      >
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {labId}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 font-medium">
                          {record.patient.name}
                        </td>
                        <td className="py-2.5 px-3">
                          {Number(record.patient.age)}
                        </td>
                        <td className="py-2.5 px-3 capitalize">
                          {record.patient.gender}
                        </td>
                        <td className="py-2.5 px-3">{record.patient.phone}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {record.patient.address || "—"}
                        </td>
                        <td className="py-2.5 px-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 gap-1 text-xs"
                            onClick={() => setSelectedPatientIdx(idx)}
                            data-ocid={`patients.edit_button.${idx + 1}`}
                          >
                            <History className="h-3.5 w-3.5" />
                            History
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-10 text-center text-muted-foreground"
                        data-ocid="patients.empty_state"
                      >
                        No patients found. Add your first patient.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Patient History Dialog */}
      {selectedRecord && selectedPatientId !== null && (
        <PatientHistoryDialog
          patient={selectedRecord}
          patientId={selectedPatientId}
          open={selectedPatientIdx !== null}
          onOpenChange={(v) => {
            if (!v) setSelectedPatientIdx(null);
          }}
        />
      )}
    </div>
  );
}

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
  usePatientReports,
  usePatients,
} from "../hooks/useQueries";

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
    // Try to parse numeric value and compare against range like "4.5 - 11.0"
    const num = Number.parseFloat(result);
    if (Number.isNaN(num) || !ref) return "normal";
    const rangeParts = ref.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
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
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        {report.results && report.results.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border/50">
                                  <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">
                                    Test
                                  </th>
                                  <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">
                                    Result
                                  </th>
                                  <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">
                                    Unit
                                  </th>
                                  <th className="text-left py-1.5 pr-3 text-muted-foreground font-medium">
                                    Reference Range
                                  </th>
                                  <th className="text-left py-1.5 text-muted-foreground font-medium">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {report.results.map((r) => {
                                  const flag = flagColor(
                                    r.result,
                                    r.referenceRange,
                                  );
                                  return (
                                    <tr
                                      key={`result-${r.code}`}
                                      className="border-b border-border/30 last:border-0"
                                    >
                                      <td className="py-1.5 pr-3 font-medium">
                                        {r.code}
                                      </td>
                                      <td
                                        className={`py-1.5 pr-3 font-semibold ${
                                          flag === "high"
                                            ? "text-red-600"
                                            : flag === "low"
                                              ? "text-blue-600"
                                              : "text-green-700"
                                        }`}
                                      >
                                        {r.result || "—"}
                                      </td>
                                      <td className="py-1.5 pr-3 text-muted-foreground">
                                        {r.unit || "—"}
                                      </td>
                                      <td className="py-1.5 pr-3 text-muted-foreground">
                                        {r.referenceRange || "—"}
                                      </td>
                                      <td className="py-1.5">
                                        {flagBadge(flag)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Tests: {report.tests.join(", ") || "—"} — Results
                            pending
                          </p>
                        )}
                        {report.notes && (
                          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
                            Notes: {report.notes}
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

// ─── Main Patients Page ───────────────────────────────────────────────────────

export default function Patients() {
  const { data: patientRecords, isLoading } = usePatients();
  const addPatient = useAddPatient();
  const { actor, isFetching: isActorLoading } = useActor();
  const { login, identity } = useInternetIdentity();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPatientIdx, setSelectedPatientIdx] = useState<number | null>(
    null,
  );
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: Gender.male as Gender,
    phone: "",
    address: "",
  });

  const isLoggedIn = !!identity;

  const filtered = (patientRecords ?? []).filter(
    (r) =>
      r.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      r.patient.phone.includes(search),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Pehle Sign In karein patient add karne ke liye.");
      return;
    }
    try {
      await addPatient.mutateAsync({
        name: form.name,
        age: form.age ? BigInt(form.age) : undefined,
        gender: form.gender,
        phone: form.phone,
        address: form.address,
      });
      toast.success("Patient added successfully!");
      setOpen(false);
      setForm({
        name: "",
        age: "",
        gender: Gender.male,
        phone: "",
        address: "",
      });
    } catch {
      toast.error("Failed to add patient.");
    }
  };

  const selectedRecord =
    selectedPatientIdx !== null ? (filtered[selectedPatientIdx] ?? null) : null;
  // IDs are 1-based sequential sorted by createdAt; find original index in full list
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
            <span>
              Patient data save karne ke liye pehle Sign In karein. Bina login
              ke patient add nahi hoga.
            </span>
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-ocid="patients.open_modal_button">
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" data-ocid="patients.dialog">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
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
                        <SelectItem value={Gender.female}>Female</SelectItem>
                        <SelectItem value={Gender.other}>Other</SelectItem>
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
                        setForm((p) => ({ ...p, address: e.target.value }))
                      }
                      placeholder="Mumbai, Maharashtra"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    data-ocid="patients.cancel_button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addPatient.isPending || isActorLoading || !actor}
                    data-ocid="patients.submit_button"
                  >
                    {addPatient.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save Patient
                  </Button>
                </div>
              </form>
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
                  {filtered.map((record, idx) => (
                    <tr
                      key={`${record.patient.phone}-${record.createdAt}`}
                      className="border-b border-border/50 hover:bg-muted/30"
                      data-ocid={`patients.item.${idx + 1}`}
                    >
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {idx + 1}
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
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
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

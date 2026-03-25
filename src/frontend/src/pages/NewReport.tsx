import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { TestResult } from "../backend.d";
import { SignaturePad } from "../components/SignaturePad";
import {
  useCreateTestReport,
  usePatients,
  useStoreSignature,
  useTestCatalog,
  useUpdateReportResults,
} from "../hooks/useQueries";

export default function NewReport() {
  const { data: patients } = usePatients();
  const { data: catalog } = useTestCatalog();
  const createReport = useCreateTestReport();
  const updateResults = useUpdateReportResults();
  const storeSignature = useStoreSignature();

  const [patientId, setPatientId] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [doctorName, setDoctorName] = useState("");
  const [notes, setNotes] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggleTest = (code: string) => {
    setSelectedTests((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  const onSignatureSave = useCallback((dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
  }, []);

  const onSignatureClear = useCallback(() => {
    setSignatureDataUrl("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      toast.error("Please select a patient.");
      return;
    }
    if (selectedTests.length === 0) {
      toast.error("Please select at least one test.");
      return;
    }
    if (!doctorName.trim()) {
      toast.error("Please enter doctor name.");
      return;
    }

    try {
      const reportId = await createReport.mutateAsync({
        patientId: BigInt(patientId),
        tests: selectedTests,
        doctorName,
        notes,
      });

      const testResults: TestResult[] = selectedTests
        .filter((code) => results[code])
        .map((code) => {
          const test = catalog?.find((t) => t.code === code);
          return {
            code,
            result: results[code] || "",
            unit: test?.unit || "",
            referenceRange: test?.referenceRange || "",
          };
        });

      await Promise.all([
        testResults.length > 0
          ? updateResults.mutateAsync({ reportId, results: testResults })
          : Promise.resolve(),
        signatureDataUrl
          ? storeSignature.mutateAsync({ reportId, dataUrl: signatureDataUrl })
          : Promise.resolve(),
      ]);

      toast.success("Report created successfully!");
      setSubmitted(true);
    } catch {
      toast.error("Failed to create report.");
    }
  };

  const resetForm = () => {
    setPatientId("");
    setSelectedTests([]);
    setDoctorName("");
    setNotes("");
    setResults({});
    setSignatureDataUrl("");
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center justify-center py-20 space-y-4"
        data-ocid="newreport.success_state"
      >
        <CheckCircle2 className="h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold">Report Created!</h2>
        <p className="text-muted-foreground">
          The test report has been saved successfully.
        </p>
        <Button onClick={resetForm} data-ocid="newreport.primary_button">
          Create Another Report
        </Button>
      </div>
    );
  }

  const isPending =
    createReport.isPending ||
    updateResults.isPending ||
    storeSignature.isPending;

  return (
    <div className="space-y-6" data-ocid="newreport.page">
      <div>
        <h2 className="text-2xl font-bold text-foreground">New Test Report</h2>
        <p className="text-muted-foreground text-sm">
          Create a new diagnostic report for a patient
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient & Doctor */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="report-patient">Patient *</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger id="report-patient" data-ocid="newreport.select">
                  <SelectValue placeholder="Select patient..." />
                </SelectTrigger>
                <SelectContent>
                  {(patients ?? []).map((r) => (
                    <SelectItem
                      key={`${r.patient.phone}-${r.createdAt}`}
                      value={String(r.createdAt)}
                    >
                      {r.patient.name} — {r.patient.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-doctor">Doctor Name *</Label>
              <Input
                id="report-doctor"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Anjali Mehta"
                data-ocid="newreport.input"
              />
            </div>
            <div className="col-span-full space-y-1.5">
              <Label htmlFor="report-notes">Clinical Notes</Label>
              <Textarea
                id="report-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional clinical notes or observations..."
                rows={2}
                data-ocid="newreport.textarea"
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Selection */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              Select Tests
              {selectedTests.length > 0 && (
                <Badge variant="default" className="text-xs">
                  {selectedTests.length} selected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(catalog ?? []).map((test, idx) => {
                const checkboxId = `test-${test.code}`;
                return (
                  <div
                    key={test.code}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTests.includes(test.code)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40"
                    }`}
                    data-ocid={`newreport.checkbox.${idx + 1}`}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={selectedTests.includes(test.code)}
                      onCheckedChange={() => toggleTest(test.code)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={checkboxId}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p className="text-sm font-medium">{test.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{Number(test.price)}
                      </p>
                    </Label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Test Results Entry */}
        {selectedTests.length > 0 && (
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Enter Test Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTests.map((code) => {
                const test = catalog?.find((t) => t.code === code);
                const inputId = `result-${code}`;
                return (
                  <div
                    key={code}
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">{test?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {test?.referenceRange}
                      </p>
                    </div>
                    <div className="md:col-span-2 flex gap-2 items-center">
                      <Label htmlFor={inputId} className="sr-only">
                        {test?.name} result
                      </Label>
                      <Input
                        id={inputId}
                        value={results[code] || ""}
                        onChange={(e) =>
                          setResults((p) => ({ ...p, [code]: e.target.value }))
                        }
                        placeholder={`Result in ${test?.unit || "units"}`}
                      />
                      {test?.unit && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {test.unit}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Signature */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Electronic Signature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SignaturePad
              onSave={onSignatureSave}
              onClear={onSignatureClear}
              height={160}
            />
            {signatureDataUrl && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Signature captured
              </p>
            )}
          </CardContent>
        </Card>

        <Separator />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={resetForm}>
            Clear Form
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            data-ocid="newreport.submit_button"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isPending ? "Saving..." : "Save Report"}
          </Button>
        </div>
      </form>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePatientReports, usePatients } from "@/hooks/useQueries";
import { SAMPLE_TEST_CATALOG } from "@/lib/constants";
import { Beaker, Info, Loader2, Printer, QrCode, X } from "lucide-react";
import { useEffect, useState } from "react";

type SampleStatus = "Pending" | "Collected" | "In-Process" | "Completed";

interface Sample {
  id: string;
  orderId: string;
  patientName: string;
  tests: string[];
  sampleType: string;
  barcode: string;
  timestamp: string;
  status: SampleStatus;
}

const SAMPLE_TYPES = [
  "Blood (Serum)",
  "Blood (EDTA)",
  "Blood (Whole)",
  "Urine",
  "Stool",
  "Sputum",
  "Swab",
];

const sampleTypeColor: Record<string, string> = {
  "Blood (Serum)": "bg-red-100 text-red-700 border-red-200",
  "Blood (EDTA)": "bg-pink-100 text-pink-700 border-pink-200",
  "Blood (Whole)": "bg-rose-100 text-rose-700 border-rose-200",
  Urine: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Stool: "bg-amber-100 text-amber-700 border-amber-200",
  Sputum: "bg-orange-100 text-orange-700 border-orange-200",
  Swab: "bg-lime-100 text-lime-700 border-lime-200",
};

const statusColor: Record<SampleStatus, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Collected: "bg-blue-100 text-blue-700 border-blue-200",
  "In-Process": "bg-purple-100 text-purple-700 border-purple-200",
  Completed: "bg-green-100 text-green-700 border-green-200",
};

const STATUS_ORDER: SampleStatus[] = [
  "Pending",
  "Collected",
  "In-Process",
  "Completed",
];

const INITIAL_SAMPLES: Sample[] = [
  {
    id: "1",
    orderId: "SAM-001",
    patientName: "Rahul Sharma",
    tests: ["CBC", "LFT"],
    sampleType: "Blood (EDTA)",
    barcode: "SAM-001-2024",
    timestamp: "2026-03-28 08:15",
    status: "Pending",
  },
  {
    id: "2",
    orderId: "SAM-002",
    patientName: "Priya Patel",
    tests: ["TFT", "HBA1C"],
    sampleType: "Blood (Serum)",
    barcode: "SAM-002-2024",
    timestamp: "2026-03-28 09:00",
    status: "Collected",
  },
  {
    id: "3",
    orderId: "SAM-003",
    patientName: "Amit Kumar",
    tests: ["KFT", "LIPID"],
    sampleType: "Blood (Serum)",
    barcode: "SAM-003-2024",
    timestamp: "2026-03-28 09:30",
    status: "In-Process",
  },
  {
    id: "4",
    orderId: "SAM-004",
    patientName: "Sunita Devi",
    tests: ["URINE-R"],
    sampleType: "Urine",
    barcode: "SAM-004-2024",
    timestamp: "2026-03-28 10:00",
    status: "Completed",
  },
  {
    id: "5",
    orderId: "SAM-005",
    patientName: "Vikram Singh",
    tests: ["DENGUE-NS1", "CBC"],
    sampleType: "Blood (EDTA)",
    barcode: "SAM-005-2024",
    timestamp: "2026-03-28 10:30",
    status: "Pending",
  },
];

/** Generates QR code using a free public API — no package needed */
function qrUrl(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}

function getTestLabel(code: string) {
  const found = SAMPLE_TEST_CATALOG.find((c) => c.code === code);
  if (!found) return code;
  const parenMatch = found.name.match(/\(([^)]+)\)/);
  const suffix = parenMatch ? ` ${parenMatch[1]}` : "";
  return `${found.name.split(" ")[0]}${suffix}`;
}

function SampleCard({
  sample,
  onStatusChange,
  onShowQR,
}: {
  sample: Sample;
  onStatusChange: (id: string, status: SampleStatus) => void;
  onShowQR: (sample: Sample) => void;
}) {
  const nextStatus = STATUS_ORDER[STATUS_ORDER.indexOf(sample.status) + 1];
  return (
    <Card
      className="rounded-xl border border-border shadow-sm"
      data-ocid={`sample.card.${sample.id}`}
    >
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-semibold text-foreground text-sm">
              {sample.patientName}
            </p>
            <p className="text-muted-foreground text-xs">{sample.orderId}</p>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[sample.status]}`}
          >
            {sample.status}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {sample.tests.map((t) => (
            <span
              key={t}
              className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200"
              title={SAMPLE_TEST_CATALOG.find((c) => c.code === t)?.name ?? t}
            >
              {getTestLabel(t)}
            </span>
          ))}
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
            sampleTypeColor[sample.sampleType] || "bg-gray-100 text-gray-600"
          }`}
        >
          {sample.sampleType}
        </span>
        <p className="text-xs text-muted-foreground mt-2">{sample.timestamp}</p>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => onShowQR(sample)}
            data-ocid={`sample.qr_button.${sample.id}`}
          >
            <QrCode className="h-3 w-3 mr-1" /> QR
          </Button>
          {nextStatus && (
            <Button
              size="sm"
              className="h-7 text-xs bg-primary text-primary-foreground"
              onClick={() => onStatusChange(sample.id, nextStatus)}
              data-ocid={`sample.status_button.${sample.id}`}
            >
              Mark {nextStatus}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SampleCollection() {
  const { data: patientRecords, isLoading: patientsLoading } = usePatients();
  const [samples, setSamples] = useState<Sample[]>(INITIAL_SAMPLES);
  const [newOpen, setNewOpen] = useState(false);
  const [qrSample, setQrSample] = useState<Sample | null>(null);
  const [generatedQR, setGeneratedQR] = useState<Sample | null>(null);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<bigint | null>(
    null,
  );
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);
  const [testSearch, setTestSearch] = useState("");

  // Fetch reports for selected patient to auto-fill tests
  const { data: patientReportsData } = usePatientReports(selectedPatientId);

  // Auto-fill tests and sample type when patient reports arrive
  useEffect(() => {
    if (patientReportsData && patientReportsData.length > 0) {
      const latestReport = patientReportsData[0];
      const tests = latestReport.tests as string[];
      if (tests && tests.length > 0) {
        setSelectedTests(tests);
        const firstMatch = SAMPLE_TEST_CATALOG.find((c) => c.code === tests[0]);
        if (firstMatch) {
          setSelectedType(firstMatch.sampleType);
        }
        setAutoFilled(true);
      }
    }
  }, [patientReportsData]);

  const handlePatientChange = (value: string) => {
    setSelectedPatient(value);
    setAutoFilled(false);
    setSelectedTests([]);
    setSelectedType("");
    setSelectedPatientId(null);

    // Auto-fill from localStorage (stored during patient registration)
    const patient = (patientRecords ?? []).find(
      (_p, idx) => String(idx) === value,
    );
    if (patient) {
      const stored = localStorage.getItem(
        `patientTests_${patient.patient.phone}`,
      );
      if (stored) {
        try {
          const { tests, sampleType } = JSON.parse(stored);
          if (tests && tests.length > 0) {
            setSelectedTests(tests);
            setSelectedType(sampleType || "");
            setAutoFilled(true);
          }
        } catch {}
      }
    }
  };

  const handleStatusChange = (id: string, status: SampleStatus) => {
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleGenerate = () => {
    if (!selectedPatient || selectedTests.length === 0 || !selectedType) return;
    const patient = (patientRecords ?? []).find(
      (_p, idx) => String(idx) === selectedPatient,
    );
    if (!patient) return;
    const newId = String(samples.length + 1);
    const orderId = `SAM-${String(samples.length + 1).padStart(3, "0")}`;
    const barcode = `${orderId}-2026`;
    const newSample: Sample = {
      id: newId,
      orderId,
      patientName: patient.patient.name,
      tests: selectedTests,
      sampleType: selectedType,
      barcode,
      timestamp: new Date().toLocaleString("en-IN"),
      status: "Pending",
    };
    setSamples((prev) => [...prev, newSample]);
    setGeneratedQR(newSample);
    setNewOpen(false);
    setSelectedPatient("");
    setSelectedPatientId(null);
    setSelectedTests([]);
    setSelectedType("");
    setAutoFilled(false);
    setTestSearch("");
  };

  const toggleTest = (testCode: string) => {
    setAutoFilled(false);
    setSelectedTests((prev) =>
      prev.includes(testCode)
        ? prev.filter((t) => t !== testCode)
        : [...prev, testCode],
    );
  };

  const resetModal = () => {
    setSelectedPatient("");
    setSelectedPatientId(null);
    setSelectedTests([]);
    setSelectedType("");
    setAutoFilled(false);
    setTestSearch("");
  };

  const filteredTests = testSearch
    ? SAMPLE_TEST_CATALOG.filter(
        (t) =>
          t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
          t.code.toLowerCase().includes(testSearch.toLowerCase()),
      )
    : SAMPLE_TEST_CATALOG;

  return (
    <div className="space-y-6" data-ocid="samples.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Sample Collection
          </h2>
          <p className="text-muted-foreground text-sm">
            Track sample status across the workflow
          </p>
        </div>
        <Button
          onClick={() => setNewOpen(true)}
          className="bg-primary text-primary-foreground"
          data-ocid="samples.open_modal_button"
        >
          <Beaker className="h-4 w-4 mr-2" /> New Sample
        </Button>
      </div>

      <Tabs defaultValue="Pending" data-ocid="samples.tab">
        <TabsList className="mb-4">
          {STATUS_ORDER.map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              data-ocid={`samples.${s.toLowerCase().replace(/ /g, "_")}.tab`}
            >
              {s}
              <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5">
                {samples.filter((x) => x.status === s).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        {STATUS_ORDER.map((status) => (
          <TabsContent key={status} value={status}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {samples
                .filter((s) => s.status === status)
                .map((sample) => (
                  <SampleCard
                    key={sample.id}
                    sample={sample}
                    onStatusChange={handleStatusChange}
                    onShowQR={setQrSample}
                  />
                ))}
              {samples.filter((s) => s.status === status).length === 0 && (
                <div
                  className="col-span-4 text-center py-12 text-muted-foreground"
                  data-ocid="samples.empty_state"
                >
                  No samples in {status} status
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* New Sample Modal */}
      <Dialog
        open={newOpen}
        onOpenChange={(open) => {
          setNewOpen(open);
          if (!open) resetModal();
        }}
      >
        <DialogContent className="max-w-md" data-ocid="samples.dialog">
          <DialogHeader>
            <DialogTitle>New Sample Registration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Patient */}
            <div>
              <Label>Patient</Label>
              <Select
                value={selectedPatient}
                onValueChange={handlePatientChange}
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="samples.patient.select"
                >
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patientsLoading ? (
                    <SelectItem value="__loading__" disabled>
                      <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                      Loading patients...
                    </SelectItem>
                  ) : (patientRecords ?? []).length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      No registered patients found
                    </SelectItem>
                  ) : (
                    (patientRecords ?? []).map((rec, idx) => (
                      <SelectItem
                        key={String(idx) + rec.patient.name}
                        value={String(idx)}
                      >
                        {rec.patient.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Auto-fill notice */}
            {autoFilled && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-blue-700 text-xs">
                <Info className="h-3.5 w-3.5 flex-shrink-0" />
                Tests aur sample type registration se auto-fill ho gaye hain.
                Aap inhe badal sakte hain.
              </div>
            )}

            {/* Sample Type */}
            <div>
              <Label>Sample Type</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => {
                  setSelectedType(v);
                  setAutoFilled(false);
                }}
              >
                <SelectTrigger className="mt-1" data-ocid="samples.type.select">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tests */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Tests</Label>
                {selectedTests.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedTests.length} selected
                  </span>
                )}
              </div>
              {/* Selected tests badges */}
              {selectedTests.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {selectedTests.map((code) => {
                    const t = SAMPLE_TEST_CATALOG.find((c) => c.code === code);
                    return (
                      <Button
                        key={code}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs px-2 py-0 gap-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                        onClick={() => toggleTest(code)}
                      >
                        {t ? t.code : code}
                        <X className="h-2.5 w-2.5" />
                      </Button>
                    );
                  })}
                </div>
              )}
              {/* Search */}
              <input
                type="text"
                placeholder="Search tests..."
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                className="w-full text-sm border border-input rounded-md px-3 py-1.5 mb-2 outline-none focus:ring-2 focus:ring-ring"
                data-ocid="samples.search_input"
              />
              <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-auto pr-1">
                {filteredTests.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No tests found
                  </p>
                ) : (
                  filteredTests.map((test) => (
                    <div key={test.code} className="flex items-center gap-2">
                      <Checkbox
                        id={`test-${test.code}`}
                        checked={selectedTests.includes(test.code)}
                        onCheckedChange={() => toggleTest(test.code)}
                        data-ocid="samples.test.checkbox"
                      />
                      <Label
                        htmlFor={`test-${test.code}`}
                        className="text-xs cursor-pointer leading-tight"
                      >
                        <span className="font-medium">{test.code}</span>{" "}
                        <span className="text-muted-foreground">
                          {test.name}
                        </span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewOpen(false)}
              data-ocid="samples.cancel.button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={
                !selectedPatient || selectedTests.length === 0 || !selectedType
              }
              data-ocid="samples.submit_button"
            >
              Generate & Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR View Modal */}
      <Dialog open={!!qrSample} onOpenChange={() => setQrSample(null)}>
        <DialogContent
          className="max-w-xs text-center"
          data-ocid="samples.qr.dialog"
        >
          <DialogHeader>
            <DialogTitle>Sample Barcode</DialogTitle>
          </DialogHeader>
          {qrSample && (
            <div className="py-2">
              <img
                src={qrUrl(qrSample.barcode)}
                alt={`QR for ${qrSample.barcode}`}
                className="mx-auto"
                width={200}
                height={200}
              />
              <p className="text-sm font-semibold mt-2">{qrSample.orderId}</p>
              <p className="text-xs text-muted-foreground">
                {qrSample.patientName}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {qrSample.barcode}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => window.print()}
              data-ocid="samples.print.button"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Barcode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generated QR Modal */}
      <Dialog open={!!generatedQR} onOpenChange={() => setGeneratedQR(null)}>
        <DialogContent
          className="max-w-xs text-center"
          data-ocid="samples.generated_qr.dialog"
        >
          <DialogHeader>
            <DialogTitle>Sample Registered!</DialogTitle>
          </DialogHeader>
          {generatedQR && (
            <div className="py-2">
              <img
                src={qrUrl(generatedQR.barcode)}
                alt={`QR for ${generatedQR.barcode}`}
                className="mx-auto"
                width={200}
                height={200}
              />
              <p className="text-sm font-semibold mt-2">
                {generatedQR.orderId}
              </p>
              <p className="text-xs text-muted-foreground">
                {generatedQR.patientName}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {generatedQR.barcode}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => window.print()}
              data-ocid="samples.generated_print.button"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Barcode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { Beaker, Printer, QrCode } from "lucide-react";
import { useState } from "react";

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

const MOCK_PATIENTS = [
  { id: "P001", name: "Rahul Sharma" },
  { id: "P002", name: "Priya Patel" },
  { id: "P003", name: "Amit Kumar" },
  { id: "P004", name: "Sunita Devi" },
  { id: "P005", name: "Vikram Singh" },
];

const MOCK_TESTS = [
  "CBC",
  "LFT",
  "KFT",
  "Thyroid (TFT)",
  "Lipid Profile",
  "HbA1c",
  "Blood Sugar (FBS)",
  "Urine Routine",
  "Dengue NS1",
  "HBsAg",
];

const SAMPLE_TYPES = [
  "Blood (Serum)",
  "Blood (EDTA)",
  "Blood (Whole)",
  "Urine",
  "Stool",
];

const sampleTypeColor: Record<string, string> = {
  "Blood (Serum)": "bg-red-100 text-red-700 border-red-200",
  "Blood (EDTA)": "bg-pink-100 text-pink-700 border-pink-200",
  "Blood (Whole)": "bg-rose-100 text-rose-700 border-rose-200",
  Urine: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Stool: "bg-amber-100 text-amber-700 border-amber-200",
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
    tests: ["Thyroid (TFT)", "HbA1c"],
    sampleType: "Blood (Serum)",
    barcode: "SAM-002-2024",
    timestamp: "2026-03-28 09:00",
    status: "Collected",
  },
  {
    id: "3",
    orderId: "SAM-003",
    patientName: "Amit Kumar",
    tests: ["KFT", "Lipid Profile"],
    sampleType: "Blood (Serum)",
    barcode: "SAM-003-2024",
    timestamp: "2026-03-28 09:30",
    status: "In-Process",
  },
  {
    id: "4",
    orderId: "SAM-004",
    patientName: "Sunita Devi",
    tests: ["Urine Routine"],
    sampleType: "Urine",
    barcode: "SAM-004-2024",
    timestamp: "2026-03-28 10:00",
    status: "Completed",
  },
  {
    id: "5",
    orderId: "SAM-005",
    patientName: "Vikram Singh",
    tests: ["Dengue NS1", "CBC"],
    sampleType: "Blood (EDTA)",
    barcode: "SAM-005-2024",
    timestamp: "2026-03-28 10:30",
    status: "Pending",
  },
  {
    id: "6",
    orderId: "SAM-006",
    patientName: "Rahul Sharma",
    tests: ["HBsAg"],
    sampleType: "Blood (Serum)",
    barcode: "SAM-006-2024",
    timestamp: "2026-03-28 11:00",
    status: "Collected",
  },
  {
    id: "7",
    orderId: "SAM-007",
    patientName: "Priya Patel",
    tests: ["Blood Sugar (FBS)", "Lipid Profile"],
    sampleType: "Blood (Serum)",
    barcode: "SAM-007-2024",
    timestamp: "2026-03-28 11:15",
    status: "In-Process",
  },
  {
    id: "8",
    orderId: "SAM-008",
    patientName: "Amit Kumar",
    tests: ["CBC"],
    sampleType: "Blood (EDTA)",
    barcode: "SAM-008-2024",
    timestamp: "2026-03-28 11:45",
    status: "Completed",
  },
  {
    id: "9",
    orderId: "SAM-009",
    patientName: "Sunita Devi",
    tests: ["LFT", "KFT"],
    sampleType: "Blood (Serum)",
    barcode: "SAM-009-2024",
    timestamp: "2026-03-28 12:00",
    status: "Pending",
  },
  {
    id: "10",
    orderId: "SAM-010",
    patientName: "Vikram Singh",
    tests: ["Thyroid (TFT)"],
    sampleType: "Blood (Serum)",
    barcode: "SAM-010-2024",
    timestamp: "2026-03-28 12:30",
    status: "Completed",
  },
];

/** Generates QR code using a free public API — no package needed */
function qrUrl(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
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
            >
              {t}
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
  const [samples, setSamples] = useState<Sample[]>(INITIAL_SAMPLES);
  const [newOpen, setNewOpen] = useState(false);
  const [qrSample, setQrSample] = useState<Sample | null>(null);
  const [generatedQR, setGeneratedQR] = useState<Sample | null>(null);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("");

  const handleStatusChange = (id: string, status: SampleStatus) => {
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleGenerate = () => {
    if (!selectedPatient || selectedTests.length === 0 || !selectedType) return;
    const patient = MOCK_PATIENTS.find((p) => p.id === selectedPatient);
    if (!patient) return;
    const newId = String(samples.length + 1);
    const orderId = `SAM-${String(samples.length + 1).padStart(3, "0")}`;
    const barcode = `${orderId}-2026`;
    const newSample: Sample = {
      id: newId,
      orderId,
      patientName: patient.name,
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
    setSelectedTests([]);
    setSelectedType("");
  };

  const toggleTest = (test: string) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test],
    );
  };

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
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md" data-ocid="samples.dialog">
          <DialogHeader>
            <DialogTitle>New Sample Registration</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Patient</Label>
              <Select
                value={selectedPatient}
                onValueChange={setSelectedPatient}
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="samples.patient.select"
                >
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_PATIENTS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sample Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
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
            <div>
              <Label className="mb-2 block">Tests</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-auto">
                {MOCK_TESTS.map((test) => (
                  <div key={test} className="flex items-center gap-2">
                    <Checkbox
                      id={`test-${test}`}
                      checked={selectedTests.includes(test)}
                      onCheckedChange={() => toggleTest(test)}
                      data-ocid="samples.test.checkbox"
                    />
                    <Label
                      htmlFor={`test-${test}`}
                      className="text-sm cursor-pointer"
                    >
                      {test}
                    </Label>
                  </div>
                ))}
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

      {/* QR Code Modal */}
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

      {/* Generated QR After New Sample */}
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

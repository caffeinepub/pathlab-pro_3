import { Badge } from "@/components/ui/badge";
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
import { Beaker, Info, Printer, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { SAMPLE_TEST_CATALOG } from "../lib/constants";
import {
  type StoredPatient,
  type StoredSample,
  getStoredPatients,
  getStoredSamples,
  saveStoredSample,
  updateSampleStatus,
} from "../lib/patientStorage";

type SampleStatus = StoredSample["status"];

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

function qrUrl(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
}

function getTestName(code: string): string {
  const found = SAMPLE_TEST_CATALOG.find((t) => t.code === code);
  return found ? found.name : code;
}

function getDefaultSampleType(tests: string[]): string {
  for (const code of tests) {
    const t = SAMPLE_TEST_CATALOG.find((x) => x.code === code);
    if (t?.sampleType) return t.sampleType;
  }
  return "";
}

function SampleCard({
  sample,
  onStatusChange,
  onShowQR,
}: {
  sample: StoredSample;
  onStatusChange: (id: string, status: SampleStatus) => void;
  onShowQR: (sample: StoredSample) => void;
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
            <p className="text-muted-foreground text-xs">
              {sample.orderId} · {sample.patientLabId}
            </p>
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
              {getTestName(t)}
            </span>
          ))}
        </div>
        {sample.sampleType && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
              sampleTypeColor[sample.sampleType] || "bg-gray-100 text-gray-600"
            }`}
          >
            {sample.sampleType}
          </span>
        )}
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
  const [samples, setSamples] = useState<StoredSample[]>([]);
  const [patients, setPatients] = useState<StoredPatient[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [qrSample, setQrSample] = useState<StoredSample | null>(null);
  const [generatedQR, setGeneratedQR] = useState<StoredSample | null>(null);
  const [selectedPatientLabId, setSelectedPatientLabId] = useState("");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [autoFilled, setAutoFilled] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSamples(getStoredSamples());
    setPatients(getStoredPatients());
  }, []);

  // Reload patients when dialog opens (catches newly registered patients)
  useEffect(() => {
    if (newOpen) {
      setPatients(getStoredPatients());
      setSelectedPatientLabId("");
      setSelectedTests([]);
      setSelectedType("");
      setAutoFilled(false);
    }
  }, [newOpen]);

  // Auto-fill tests when patient is selected
  useEffect(() => {
    if (!selectedPatientLabId) return;
    const patient = patients.find((p) => p.labId === selectedPatientLabId);
    if (patient && patient.assignedTests.length > 0) {
      setSelectedTests(patient.assignedTests);
      const defaultType = getDefaultSampleType(patient.assignedTests);
      if (defaultType) setSelectedType(defaultType);
      setAutoFilled(true);
    } else {
      setSelectedTests([]);
      setAutoFilled(false);
    }
  }, [selectedPatientLabId, patients]);

  const handleStatusChange = (id: string, status: SampleStatus) => {
    updateSampleStatus(id, status);
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleGenerate = () => {
    if (!selectedPatientLabId || selectedTests.length === 0 || !selectedType)
      return;
    const patient = patients.find((p) => p.labId === selectedPatientLabId);
    if (!patient) return;
    const allSamples = getStoredSamples();
    const newId = String(Date.now());
    const orderId = `SAM-${String(allSamples.length + 1).padStart(3, "0")}`;
    const barcode = `${orderId}-${new Date().getFullYear()}`;
    const newSample: StoredSample = {
      id: newId,
      orderId,
      patientLabId: patient.labId,
      patientName: patient.name,
      tests: selectedTests,
      sampleType: selectedType,
      barcode,
      timestamp: new Date().toLocaleString("en-IN"),
      status: "Pending",
    };
    saveStoredSample(newSample);
    setSamples(getStoredSamples());
    setGeneratedQR(newSample);
    setNewOpen(false);
    setSelectedPatientLabId("");
    setSelectedTests([]);
    setSelectedType("");
    setAutoFilled(false);
  };

  const toggleTest = (code: string) => {
    setAutoFilled(false);
    setSelectedTests((prev) =>
      prev.includes(code) ? prev.filter((t) => t !== code) : [...prev, code],
    );
  };

  const selectedPatient = patients.find(
    (p) => p.labId === selectedPatientLabId,
  );

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
            {patients.length === 0 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Koi registered patient nahi mila. Pehle Patient Registration
                  se patient add karein.
                </span>
              </div>
            )}
            <div>
              <Label>Patient</Label>
              <Select
                value={selectedPatientLabId}
                onValueChange={setSelectedPatientLabId}
              >
                <SelectTrigger
                  className="mt-1"
                  data-ocid="samples.patient.select"
                >
                  <SelectValue placeholder="Patient chunein" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.labId} value={p.labId}>
                      {p.labId} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {autoFilled && selectedPatient && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-sm text-blue-800">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  Registration ke tests auto-fill ho gaye. Zaroorat ho toh badal
                  sakte hain.
                </span>
              </div>
            )}

            <div>
              <Label>Sample Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="mt-1" data-ocid="samples.type.select">
                  <SelectValue placeholder="Sample type chunein" />
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
              <Label className="mb-2 block">
                Tests{" "}
                {selectedTests.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {selectedTests.length} selected
                  </Badge>
                )}
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto border rounded-lg p-2">
                {SAMPLE_TEST_CATALOG.map((test) => (
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
                      {test.name}
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
                !selectedPatientLabId ||
                selectedTests.length === 0 ||
                !selectedType
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

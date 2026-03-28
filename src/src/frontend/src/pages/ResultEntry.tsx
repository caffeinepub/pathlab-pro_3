import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, ChevronDown, ChevronUp, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SAMPLE_TEST_CATALOG } from "../lib/constants";
import {
  type StoredSample,
  getStoredSamples,
  saveStoredResults,
  updateSampleStatus,
} from "../lib/patientStorage";

interface LiveTestResult {
  code: string;
  testName: string;
  unit: string;
  referenceRange: string;
  value: string;
}

interface LiveReport {
  sample: StoredSample;
  tests: LiveTestResult[];
}

function parseRange(
  range: string,
  value: string,
): "normal" | "high" | "low" | null {
  const num = Number.parseFloat(value);
  if (Number.isNaN(num) || value.trim() === "") return null;
  const ltMatch = range.match(/^<\s*([\d.]+)/);
  if (ltMatch) return num < Number.parseFloat(ltMatch[1]) ? "normal" : "high";
  const gtMatch = range.match(/^>\s*([\d.]+)/);
  if (gtMatch) return num > Number.parseFloat(gtMatch[1]) ? "normal" : "low";
  const rangeMatch = range.match(/^([\d.]+)\s*-\s*([\d.]+)/);
  if (rangeMatch) {
    const lo = Number.parseFloat(rangeMatch[1]);
    const hi = Number.parseFloat(rangeMatch[2]);
    if (num < lo) return "low";
    if (num > hi) return "high";
    return "normal";
  }
  return null;
}

function buildLiveReports(samples: StoredSample[]): LiveReport[] {
  return samples
    .filter((s) => s.status !== "Completed")
    .map((sample) => {
      const tests: LiveTestResult[] = sample.tests.map((code) => {
        const catalogEntry = SAMPLE_TEST_CATALOG.find((t) => t.code === code);
        return {
          code,
          testName: catalogEntry ? catalogEntry.name : code,
          unit: catalogEntry ? catalogEntry.unit : "",
          referenceRange: catalogEntry ? catalogEntry.referenceRange : "",
          value: "",
        };
      });
      return { sample, tests };
    });
}

export default function ResultEntry() {
  const [reports, setReports] = useState<LiveReport[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const samples = getStoredSamples();
    setReports(buildLiveReports(samples));
  }, []);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  const handleValueChange = (
    sampleId: string,
    testIdx: number,
    value: string,
  ) => {
    setReports((prev) =>
      prev.map((r) =>
        r.sample.id !== sampleId
          ? r
          : {
              ...r,
              tests: r.tests.map((t, i) =>
                i === testIdx ? { ...t, value } : t,
              ),
            },
      ),
    );
  };

  const handleSave = (report: LiveReport) => {
    saveStoredResults(
      report.tests.map((t) => ({
        sampleId: report.sample.id,
        testName: t.testName,
        unit: t.unit,
        referenceRange: t.referenceRange,
        value: t.value,
      })),
    );
    toast.success(`${report.sample.patientName} ke results save ho gaye`);
  };

  const handleMarkReady = (sampleId: string) => {
    updateSampleStatus(sampleId, "Completed");
    setReports((prev) => prev.filter((r) => r.sample.id !== sampleId));
    toast.success("Approval ke liye ready mark ho gaya");
  };

  const statusColor: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Collected: "bg-blue-100 text-blue-700 border-blue-200",
    "In-Process": "bg-purple-100 text-purple-700 border-purple-200",
    Completed: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <div className="space-y-6" data-ocid="results.page">
      <div>
        <h2 className="text-xl font-bold text-foreground">Result Entry</h2>
        <p className="text-muted-foreground text-sm">
          Sample collection ke baad test results enter karein
        </p>
      </div>

      {reports.length === 0 ? (
        <div
          className="text-center py-16 text-muted-foreground"
          data-ocid="results.empty_state"
        >
          <p className="text-base font-medium mb-1">
            Koi pending sample nahi hai
          </p>
          <p className="text-sm">
            Sample Collection mein jaayein aur sample collect/in-process mein le
            aayein
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report, rIdx) => (
            <Card
              key={report.sample.id}
              className="rounded-xl border border-border shadow-sm"
              data-ocid={`results.item.${rIdx + 1}`}
            >
              <CardHeader
                className="cursor-pointer select-none px-5 py-4"
                onClick={() => toggleExpand(report.sample.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-base">
                        {report.sample.patientName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {report.sample.orderId} · {report.sample.patientLabId} ·{" "}
                        {report.sample.sampleType}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        statusColor[report.sample.status] ?? ""
                      }`}
                    >
                      {report.sample.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {report.tests.length} tests
                    </span>
                  </div>
                  {expanded === report.sample.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              {expanded === report.sample.id && (
                <CardContent className="px-5 pb-5">
                  <Table data-ocid={`results.table.${rIdx + 1}`}>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Reference Range</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Result Value</TableHead>
                        <TableHead>Flag</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.tests.map((test, tIdx) => {
                        const flag = parseRange(
                          test.referenceRange,
                          test.value,
                        );
                        const isAbnormal = flag === "high" || flag === "low";
                        return (
                          <TableRow
                            key={test.code}
                            className={isAbnormal ? "bg-red-50" : ""}
                          >
                            <TableCell className="font-medium text-sm">
                              {test.testName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {test.referenceRange || "—"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {test.unit || "—"}
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-8 w-28 text-sm"
                                placeholder="Value dalein"
                                value={test.value}
                                onChange={(e) =>
                                  handleValueChange(
                                    report.sample.id,
                                    tIdx,
                                    e.target.value,
                                  )
                                }
                                data-ocid="results.value.input"
                              />
                            </TableCell>
                            <TableCell>
                              {isAbnormal && (
                                <Badge
                                  className={
                                    flag === "high"
                                      ? "bg-red-100 text-red-700 border-red-200"
                                      : "bg-blue-100 text-blue-700 border-blue-200"
                                  }
                                >
                                  {flag === "high" ? "H" : "L"}
                                </Badge>
                              )}
                              {flag === "normal" && (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  N
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleSave(report)}
                      data-ocid="results.save.button"
                    >
                      <Save className="h-4 w-4 mr-2" /> Results Save Karein
                    </Button>
                    <Button
                      className="bg-primary text-primary-foreground"
                      onClick={() => handleMarkReady(report.sample.id)}
                      data-ocid="results.submit_button"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Approval ke liye
                      Ready
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

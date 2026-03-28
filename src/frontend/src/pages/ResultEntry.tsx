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
import { SAMPLE_TEST_CATALOG } from "@/lib/constants";
import { CheckCircle, ChevronDown, ChevronUp, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface TestResult {
  testCode: string;
  testName: string;
  unit: string;
  referenceRange: string;
  value: string;
}

interface LabReport {
  id: string;
  sampleId: string;
  patientName: string;
  sampleType: string;
  collectionDate: string;
  status: "Pending" | "In-Process" | "Ready for Approval";
  tests: TestResult[];
}

const RESULTS_STORAGE_KEY = "pathlab_results";

function loadResultsFromStorage(): LabReport[] {
  try {
    const saved = localStorage.getItem(RESULTS_STORAGE_KEY);
    if (saved) return JSON.parse(saved) as LabReport[];
  } catch {}
  return [];
}

function saveResultsToStorage(reports: LabReport[]) {
  localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(reports));
}

function buildReportsFromSamples(): LabReport[] {
  try {
    const stored = localStorage.getItem("pathlab_samples");
    if (!stored) return [];
    const samples = JSON.parse(stored) as {
      id: string;
      orderId: string;
      patientName: string;
      tests: string[];
      sampleType: string;
      timestamp: string;
      status: string;
    }[];

    return samples
      .filter((s) => s.status !== "Completed")
      .map((s) => {
        const tests: TestResult[] = (s.tests || []).map((code) => {
          const catalogEntry = SAMPLE_TEST_CATALOG.find((c) => c.code === code);
          return {
            testCode: code,
            testName: catalogEntry?.name || code,
            unit: catalogEntry?.unit || "",
            referenceRange: catalogEntry?.referenceRange || "",
            value: "",
          };
        });
        return {
          id: `RPT-${s.orderId}`,
          sampleId: s.orderId,
          patientName: s.patientName,
          sampleType: s.sampleType,
          collectionDate: s.timestamp,
          status: (s.status === "Collected" || s.status === "In-Process"
            ? "In-Process"
            : "Pending") as LabReport["status"],
          tests,
        };
      });
  } catch {
    return [];
  }
}

function mergeWithSaved(fresh: LabReport[], saved: LabReport[]): LabReport[] {
  return fresh.map((r) => {
    const prev = saved.find((s) => s.id === r.id);
    if (!prev) return r;
    // Keep saved values and status
    return {
      ...r,
      status: prev.status,
      tests: r.tests.map((t) => {
        const prevTest = prev.tests.find((pt) => pt.testCode === t.testCode);
        return prevTest ? { ...t, value: prevTest.value } : t;
      }),
    };
  });
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

export default function ResultEntry() {
  const [reports, setReports] = useState<LabReport[]>(() => {
    const fresh = buildReportsFromSamples();
    const saved = loadResultsFromStorage();
    return mergeWithSaved(fresh, saved);
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  // Refresh when samples change (e.g. navigating back)
  useEffect(() => {
    const fresh = buildReportsFromSamples();
    const saved = loadResultsFromStorage();
    const merged = mergeWithSaved(fresh, saved);
    setReports(merged);
  }, []);

  // Save results to localStorage whenever reports change
  useEffect(() => {
    saveResultsToStorage(reports);
  }, [reports]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  const handleValueChange = (
    reportId: string,
    testIdx: number,
    value: string,
  ) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id !== reportId
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

  const handleSave = (report: LabReport) => {
    toast.success(`Results saved for ${report.patientName}`);
  };

  const handleMarkReady = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status: "Ready for Approval" } : r,
      ),
    );
    toast.success("Marked as Ready for Approval");
  };

  const statusColor: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    "In-Process": "bg-blue-100 text-blue-700 border-blue-200",
    "Ready for Approval": "bg-green-100 text-green-700 border-green-200",
  };

  const activeReports = reports.filter(
    (r) => r.status !== "Ready for Approval",
  );

  return (
    <div className="space-y-6" data-ocid="results.page">
      <div>
        <h2 className="text-xl font-bold text-foreground">Result Entry</h2>
        <p className="text-muted-foreground text-sm">
          Enter test results for pending and in-process samples
        </p>
      </div>

      <div className="space-y-4">
        {activeReports.length === 0 && (
          <div
            className="text-center py-16 text-muted-foreground"
            data-ocid="results.empty_state"
          >
            Koi pending sample nahi hai. Pehle Sample Collection mein sample
            register karein.
          </div>
        )}
        {activeReports.map((report, rIdx) => (
          <Card
            key={report.id}
            className="rounded-xl border border-border shadow-sm"
            data-ocid={`results.item.${rIdx + 1}`}
          >
            <CardHeader
              className="cursor-pointer select-none px-5 py-4"
              onClick={() => toggleExpand(report.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-base">
                      {report.patientName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {report.sampleId} · {report.sampleType}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[report.status]}`}
                  >
                    {report.status}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {report.tests.length} tests
                  </span>
                </div>
                {expanded === report.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expanded === report.id && (
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
                      const flag = parseRange(test.referenceRange, test.value);
                      const isAbnormal = flag === "high" || flag === "low";
                      return (
                        <TableRow
                          key={`${test.testCode}-${tIdx}`}
                          className={isAbnormal ? "bg-red-50" : ""}
                        >
                          <TableCell className="font-medium text-sm">
                            {test.testName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {test.referenceRange || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {test.unit || "-"}
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8 w-28 text-sm"
                              placeholder="Enter value"
                              value={test.value}
                              onChange={(e) =>
                                handleValueChange(
                                  report.id,
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
                    <Save className="h-4 w-4 mr-2" /> Save Results
                  </Button>
                  <Button
                    className="bg-primary text-primary-foreground"
                    onClick={() => handleMarkReady(report.id)}
                    data-ocid="results.submit_button"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Mark Ready for
                    Approval
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {reports.some((r) => r.status === "Ready for Approval") && (
        <div>
          <h3 className="text-base font-semibold mb-3 text-foreground">
            Ready for Approval
          </h3>
          <div className="space-y-3">
            {reports
              .filter((r) => r.status === "Ready for Approval")
              .map((report, rIdx) => (
                <Card
                  key={report.id}
                  className="rounded-xl border border-green-200 bg-green-50"
                  data-ocid={`results.approved.item.${rIdx + 1}`}
                >
                  <CardContent className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">
                          {report.patientName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.sampleId} · {report.tests.length} tests
                        </p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-green-100 text-green-700 border-green-200">
                        Ready for Approval
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
import { useState } from "react";
import { toast } from "sonner";

interface TestResult {
  testName: string;
  unit: string;
  referenceRange: string;
  value: string;
}

interface LabReport {
  id: string;
  patientName: string;
  age: string;
  gender: string;
  sampleType: string;
  collectionDate: string;
  status: "Pending" | "In-Process" | "Ready for Approval";
  tests: TestResult[];
}

const INITIAL_REPORTS: LabReport[] = [
  {
    id: "RPT-001",
    patientName: "Rahul Sharma",
    age: "34",
    gender: "Male",
    sampleType: "Blood (EDTA)",
    collectionDate: "2026-03-28",
    status: "Pending",
    tests: [
      {
        testName: "Hemoglobin",
        unit: "g/dL",
        referenceRange: "13.5 - 17.5",
        value: "",
      },
      {
        testName: "WBC Count",
        unit: "\u00d710\u00b3/\u00b5L",
        referenceRange: "4.5 - 11.0",
        value: "",
      },
      {
        testName: "Platelet Count",
        unit: "\u00d710\u00b3/\u00b5L",
        referenceRange: "150 - 400",
        value: "",
      },
      { testName: "MCV", unit: "fL", referenceRange: "80 - 100", value: "" },
    ],
  },
  {
    id: "RPT-002",
    patientName: "Priya Patel",
    age: "28",
    gender: "Female",
    sampleType: "Blood (Serum)",
    collectionDate: "2026-03-28",
    status: "In-Process",
    tests: [
      { testName: "T3", unit: "ng/dL", referenceRange: "80 - 200", value: "" },
      {
        testName: "T4",
        unit: "\u00b5g/dL",
        referenceRange: "5.1 - 14.1",
        value: "",
      },
      {
        testName: "TSH",
        unit: "\u00b5IU/mL",
        referenceRange: "0.4 - 4.0",
        value: "",
      },
    ],
  },
  {
    id: "RPT-003",
    patientName: "Amit Kumar",
    age: "45",
    gender: "Male",
    sampleType: "Blood (Serum)",
    collectionDate: "2026-03-28",
    status: "Pending",
    tests: [
      {
        testName: "Total Cholesterol",
        unit: "mg/dL",
        referenceRange: "< 200",
        value: "",
      },
      { testName: "HDL", unit: "mg/dL", referenceRange: "> 40", value: "" },
      { testName: "LDL", unit: "mg/dL", referenceRange: "< 100", value: "" },
      {
        testName: "Triglycerides",
        unit: "mg/dL",
        referenceRange: "< 150",
        value: "",
      },
    ],
  },
  {
    id: "RPT-004",
    patientName: "Sunita Devi",
    age: "52",
    gender: "Female",
    sampleType: "Blood (Serum)",
    collectionDate: "2026-03-28",
    status: "In-Process",
    tests: [
      {
        testName: "SGOT (AST)",
        unit: "U/L",
        referenceRange: "10 - 40",
        value: "",
      },
      {
        testName: "SGPT (ALT)",
        unit: "U/L",
        referenceRange: "7 - 56",
        value: "",
      },
      {
        testName: "Total Bilirubin",
        unit: "mg/dL",
        referenceRange: "0.3 - 1.2",
        value: "",
      },
      {
        testName: "Albumin",
        unit: "g/dL",
        referenceRange: "3.5 - 5.0",
        value: "",
      },
    ],
  },
];

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
  const [reports, setReports] = useState<LabReport[]>(INITIAL_REPORTS);
  const [expanded, setExpanded] = useState<string | null>(null);

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

  return (
    <div className="space-y-6" data-ocid="results.page">
      <div>
        <h2 className="text-xl font-bold text-foreground">Result Entry</h2>
        <p className="text-muted-foreground text-sm">
          Enter test results for pending and in-process samples
        </p>
      </div>

      <div className="space-y-4">
        {reports
          .filter((r) => r.status !== "Ready for Approval")
          .map((report, rIdx) => (
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
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-base">
                        {report.patientName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {report.id} · {report.age}y {report.gender} ·{" "}
                        {report.sampleType}
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
                      {report.tests.map((test) => {
                        const flag = parseRange(
                          test.referenceRange,
                          test.value,
                        );
                        const isAbnormal = flag === "high" || flag === "low";
                        return (
                          <TableRow
                            key={test.testName}
                            className={isAbnormal ? "bg-red-50" : ""}
                          >
                            <TableCell className="font-medium text-sm">
                              {test.testName}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {test.referenceRange}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {test.unit}
                            </TableCell>
                            <TableCell>
                              <Input
                                className="h-8 w-28 text-sm"
                                placeholder="Enter value"
                                value={test.value}
                                onChange={(e) =>
                                  handleValueChange(
                                    report.id,
                                    report.tests.indexOf(test),
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
        {reports.filter((r) => r.status !== "Ready for Approval").length ===
          0 && (
          <div
            className="text-center py-16 text-muted-foreground"
            data-ocid="results.empty_state"
          >
            All reports are ready for approval
          </div>
        )}
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
                          {report.id} · {report.tests.length} tests
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

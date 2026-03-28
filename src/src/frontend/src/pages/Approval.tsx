import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ApprovalStatus = "Pending Approval" | "Approved" | "Rejected";

interface TestResult {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: "normal" | "high" | "low" | null;
}

interface ApprovalReport {
  id: string;
  patientName: string;
  age: string;
  gender: string;
  testCount: number;
  technician: string;
  date: string;
  status: ApprovalStatus;
  approvedAt?: string;
  rejectedReason?: string;
  tests: TestResult[];
}

const INITIAL_REPORTS: ApprovalReport[] = [
  {
    id: "RPT-005",
    patientName: "Vikram Singh",
    age: "38",
    gender: "Male",
    testCount: 3,
    technician: "Anil Verma",
    date: "2026-03-28",
    status: "Pending Approval",
    tests: [
      {
        testName: "TSH",
        value: "6.8",
        unit: "\u00b5IU/mL",
        referenceRange: "0.4 - 4.0",
        flag: "high",
      },
      {
        testName: "T3",
        value: "145",
        unit: "ng/dL",
        referenceRange: "80 - 200",
        flag: "normal",
      },
      {
        testName: "T4",
        value: "9.2",
        unit: "\u00b5g/dL",
        referenceRange: "5.1 - 14.1",
        flag: "normal",
      },
    ],
  },
  {
    id: "RPT-006",
    patientName: "Kavya Reddy",
    age: "24",
    gender: "Female",
    testCount: 4,
    technician: "Renu Gupta",
    date: "2026-03-28",
    status: "Pending Approval",
    tests: [
      {
        testName: "Hemoglobin",
        value: "10.2",
        unit: "g/dL",
        referenceRange: "12.0 - 16.0",
        flag: "low",
      },
      {
        testName: "WBC Count",
        value: "8.4",
        unit: "\u00d710\u00b3/\u00b5L",
        referenceRange: "4.5 - 11.0",
        flag: "normal",
      },
      {
        testName: "Platelet Count",
        value: "320",
        unit: "\u00d710\u00b3/\u00b5L",
        referenceRange: "150 - 400",
        flag: "normal",
      },
      {
        testName: "MCV",
        value: "72",
        unit: "fL",
        referenceRange: "80 - 100",
        flag: "low",
      },
    ],
  },
  {
    id: "RPT-007",
    patientName: "Manish Jain",
    age: "55",
    gender: "Male",
    testCount: 4,
    technician: "Anil Verma",
    date: "2026-03-27",
    status: "Approved",
    approvedAt: "2026-03-27 14:30",
    tests: [
      {
        testName: "SGOT",
        value: "38",
        unit: "U/L",
        referenceRange: "10 - 40",
        flag: "normal",
      },
      {
        testName: "SGPT",
        value: "65",
        unit: "U/L",
        referenceRange: "7 - 56",
        flag: "high",
      },
      {
        testName: "Total Bilirubin",
        value: "1.0",
        unit: "mg/dL",
        referenceRange: "0.3 - 1.2",
        flag: "normal",
      },
      {
        testName: "Albumin",
        value: "4.2",
        unit: "g/dL",
        referenceRange: "3.5 - 5.0",
        flag: "normal",
      },
    ],
  },
  {
    id: "RPT-008",
    patientName: "Pooja Nair",
    age: "31",
    gender: "Female",
    testCount: 3,
    technician: "Renu Gupta",
    date: "2026-03-27",
    status: "Rejected",
    rejectedReason: "Sample hemolyzed, recollect required",
    tests: [
      {
        testName: "Creatinine",
        value: "1.8",
        unit: "mg/dL",
        referenceRange: "0.5 - 1.1",
        flag: "high",
      },
      {
        testName: "BUN",
        value: "28",
        unit: "mg/dL",
        referenceRange: "7 - 20",
        flag: "high",
      },
      {
        testName: "Uric Acid",
        value: "5.2",
        unit: "mg/dL",
        referenceRange: "2.6 - 6.0",
        flag: "normal",
      },
    ],
  },
];

const statusBadge: Record<ApprovalStatus, string> = {
  "Pending Approval": "bg-amber-100 text-amber-700 border-amber-200",
  Approved: "bg-green-100 text-green-700 border-green-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function Approval() {
  const [reports, setReports] = useState<ApprovalReport[]>(INITIAL_REPORTS);
  const [reviewReport, setReviewReport] = useState<ApprovalReport | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (id: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Approved",
              approvedAt: new Date().toLocaleString("en-IN"),
            }
          : r,
      ),
    );
    setReviewReport(null);
    toast.success("Report approved successfully");
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) return;
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "Rejected", rejectedReason: rejectReason }
          : r,
      ),
    );
    setReviewReport(null);
    setRejectOpen(false);
    setRejectReason("");
    toast.error("Report rejected");
  };

  return (
    <div className="space-y-6" data-ocid="approval.page">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Pathologist Approval
        </h2>
        <p className="text-muted-foreground text-sm">
          Review and approve lab reports before releasing to patients
        </p>
      </div>

      <Card className="rounded-xl border border-border shadow-sm">
        <CardContent className="p-0">
          <Table data-ocid="approval.table">
            <TableHeader>
              <TableRow>
                <TableHead>Report ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report, idx) => (
                <TableRow key={report.id} data-ocid={`approval.row.${idx + 1}`}>
                  <TableCell className="font-mono text-sm font-medium">
                    {report.id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">
                        {report.patientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {report.age}y {report.gender}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {report.testCount} tests
                  </TableCell>
                  <TableCell className="text-sm">{report.technician}</TableCell>
                  <TableCell className="text-sm">{report.date}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadge[report.status]}`}
                    >
                      {report.status}
                    </span>
                    {report.approvedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {report.approvedAt}
                      </p>
                    )}
                    {report.rejectedReason && (
                      <p
                        className="text-xs text-red-500 mt-1 max-w-[150px] truncate"
                        title={report.rejectedReason}
                      >
                        {report.rejectedReason}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setReviewReport(report)}
                      data-ocid={`approval.review.button.${idx + 1}`}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={!!reviewReport} onOpenChange={() => setReviewReport(null)}>
        <DialogContent className="max-w-2xl" data-ocid="approval.dialog">
          <DialogHeader>
            <DialogTitle>Review Report — {reviewReport?.id}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {reviewReport?.patientName} · {reviewReport?.age}y{" "}
              {reviewReport?.gender}
            </p>
          </DialogHeader>
          {reviewReport && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Reference Range</TableHead>
                  <TableHead>Flag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewReport.tests.map((test) => {
                  const isAbnormal =
                    test.flag === "high" || test.flag === "low";
                  return (
                    <TableRow
                      key={test.testName}
                      className={isAbnormal ? "bg-red-50" : ""}
                    >
                      <TableCell className="font-medium text-sm">
                        {test.testName}
                      </TableCell>
                      <TableCell
                        className={`text-sm font-semibold ${isAbnormal ? "text-red-600" : ""}`}
                      >
                        {test.value}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {test.unit}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {test.referenceRange}
                      </TableCell>
                      <TableCell>
                        {isAbnormal && (
                          <Badge
                            className={
                              test.flag === "high"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-blue-100 text-blue-700 border-blue-200"
                            }
                          >
                            {test.flag === "high" ? "H" : "L"}
                          </Badge>
                        )}
                        {test.flag === "normal" && (
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
          )}
          {reviewReport?.status === "Pending Approval" && (
            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => setRejectOpen(true)}
                data-ocid="approval.reject.button"
              >
                <XCircle className="h-4 w-4 mr-2" /> Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleApprove(reviewReport.id)}
                data-ocid="approval.confirm_button"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Approve Report
              </Button>
            </DialogFooter>
          )}
          {reviewReport?.status !== "Pending Approval" && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReviewReport(null)}
                data-ocid="approval.close_button"
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Reason Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-sm" data-ocid="approval.reject.dialog">
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Enter reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-24"
            data-ocid="approval.reject.textarea"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              data-ocid="approval.reject.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => reviewReport && handleReject(reviewReport.id)}
              disabled={!rejectReason.trim()}
              data-ocid="approval.reject.confirm_button"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

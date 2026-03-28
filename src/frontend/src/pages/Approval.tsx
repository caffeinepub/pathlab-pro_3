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
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ApprovalStatus = "Pending Approval" | "Approved" | "Rejected";

interface TestResult {
  testCode: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: "normal" | "high" | "low" | null;
}

interface ApprovalReport {
  id: string;
  patientName: string;
  sampleId: string;
  sampleType: string;
  collectionDate: string;
  testCount: number;
  status: ApprovalStatus;
  approvedAt?: string;
  rejectedReason?: string;
  tests: TestResult[];
}

const APPROVAL_STORAGE_KEY = "pathlab_approvals";

function parseRange(
  range: string,
  value: string,
): "normal" | "high" | "low" | null {
  const num = Number.parseFloat(value);
  if (Number.isNaN(num) || !value.trim()) return null;
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

function loadFromResultEntry(): ApprovalReport[] {
  try {
    const raw = localStorage.getItem("pathlab_results");
    if (!raw) return [];
    const results = JSON.parse(raw) as {
      id: string;
      sampleId: string;
      patientName: string;
      sampleType: string;
      collectionDate: string;
      status: string;
      tests: TestResult[];
    }[];
    return results
      .filter((r) => r.status === "Ready for Approval")
      .map((r) => ({
        id: r.id,
        patientName: r.patientName,
        sampleId: r.sampleId,
        sampleType: r.sampleType,
        collectionDate: r.collectionDate,
        testCount: r.tests.length,
        status: "Pending Approval" as ApprovalStatus,
        tests: r.tests,
      }));
  } catch {
    return [];
  }
}

function loadSavedApprovals(): Record<
  string,
  { status: ApprovalStatus; approvedAt?: string; rejectedReason?: string }
> {
  try {
    const raw = localStorage.getItem(APPROVAL_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveApprovals(
  data: Record<
    string,
    { status: ApprovalStatus; approvedAt?: string; rejectedReason?: string }
  >,
) {
  localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(data));
}

const statusBadge: Record<ApprovalStatus, string> = {
  "Pending Approval": "bg-amber-100 text-amber-700 border-amber-200",
  Approved: "bg-green-100 text-green-700 border-green-200",
  Rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function Approval() {
  const [reports, setReports] = useState<ApprovalReport[]>([]);
  const [reviewReport, setReviewReport] = useState<ApprovalReport | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const fresh = loadFromResultEntry();
    const saved = loadSavedApprovals();
    const merged = fresh.map((r) => {
      const override = saved[r.id];
      if (override) return { ...r, ...override };
      return r;
    });
    setReports(merged);
  }, []);

  const handleApprove = (id: string) => {
    const approvedAt = new Date().toLocaleString("en-IN");
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: "Approved" as ApprovalStatus, approvedAt }
          : r,
      ),
    );
    const saved = loadSavedApprovals();
    saved[id] = { status: "Approved", approvedAt };
    saveApprovals(saved);
    setReviewReport(null);
    toast.success("Report approved successfully");
  };

  const handleReject = (id: string) => {
    if (!rejectReason.trim()) return;
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "Rejected" as ApprovalStatus,
              rejectedReason: rejectReason,
            }
          : r,
      ),
    );
    const saved = loadSavedApprovals();
    saved[id] = { status: "Rejected", rejectedReason: rejectReason };
    saveApprovals(saved);
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
          {reports.length === 0 ? (
            <div
              className="text-center py-16 text-muted-foreground"
              data-ocid="approval.empty_state"
            >
              Koi report approval ke liye nahi hai. Result Entry mein results
              dalkar "Mark Ready for Approval" click karein.
            </div>
          ) : (
            <Table data-ocid="approval.table">
              <TableHeader>
                <TableRow>
                  <TableHead>Report ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Sample Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report, idx) => (
                  <TableRow
                    key={report.id}
                    data-ocid={`approval.row.${idx + 1}`}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {report.id}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">
                        {report.patientName}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {report.testCount} tests
                    </TableCell>
                    <TableCell className="text-sm">
                      {report.sampleType}
                    </TableCell>
                    <TableCell className="text-sm">
                      {report.collectionDate
                        ? new Date(report.collectionDate).toLocaleDateString(
                            "en-IN",
                          )
                        : "-"}
                    </TableCell>
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
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={!!reviewReport} onOpenChange={() => setReviewReport(null)}>
        <DialogContent className="max-w-2xl" data-ocid="approval.dialog">
          <DialogHeader>
            <DialogTitle>Review Report — {reviewReport?.id}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {reviewReport?.patientName}
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
                {reviewReport.tests.map((test, tIdx) => {
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
                      <TableCell
                        className={`text-sm font-semibold ${isAbnormal ? "text-red-600" : ""}`}
                      >
                        {test.value || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {test.unit || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {test.referenceRange || "-"}
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Printer, Search } from "lucide-react";
import { useState } from "react";
import type { PatientRecord, TestReport } from "../backend.d";
import type { ReportId } from "../backend.d";
import {
  usePatientReports,
  usePatients,
  useSignature,
  useTestCatalog,
} from "../hooks/useQueries";
import { LAB_INFO } from "../lib/constants";

type ReportRow = {
  patient: PatientRecord;
  report: TestReport;
  reportId: ReportId;
  patientIdx: number;
};

function ReportViewDialog({
  row,
  open,
  onClose,
}: { row: ReportRow | null; open: boolean; onClose: () => void }) {
  const { data: catalog } = useTestCatalog();
  const { data: signatureUrl } = useSignature(row ? row.reportId : null);

  if (!row) return null;
  const { patient, report } = row;
  const reportDate = new Date(
    Number(report.createdAt) / 1_000_000,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const handlePrint = () => window.print();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        data-ocid="reports.dialog"
      >
        <DialogHeader className="no-print">
          <DialogTitle className="flex items-center justify-between">
            <span>Test Report</span>
            <Button
              size="sm"
              onClick={handlePrint}
              className="mr-6"
              data-ocid="reports.primary_button"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print / PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Printable Report */}
        <div id="report-print" className="p-6 space-y-6 bg-white text-gray-900">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/pathlab-logo-transparent.dim_120x120.png"
                alt="Logo"
                className="h-14 w-14"
              />
              <div>
                <h1 className="text-xl font-bold text-blue-900">
                  {LAB_INFO.name}
                </h1>
                <p className="text-xs text-gray-600">{LAB_INFO.address}</p>
                <p className="text-xs text-gray-600">
                  {LAB_INFO.phone} | GST: {LAB_INFO.gstNo}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">
                Report ID: #{row.reportId.toString()}
              </p>
              <p className="text-sm">Date: {reportDate}</p>
              <Badge
                className={
                  report.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-amber-100 text-amber-800"
                }
              >
                {report.status}
              </Badge>
            </div>
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-4 bg-blue-50 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Patient Name
              </p>
              <p className="font-semibold">{patient.patient.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Age / Gender
              </p>
              <p>
                {Number(patient.patient.age)} yrs / {patient.patient.gender}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Phone
              </p>
              <p>{patient.patient.phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Referring Doctor
              </p>
              <p>{report.doctorName || "—"}</p>
            </div>
          </div>

          {/* Test Results */}
          <div>
            <h3 className="font-bold text-blue-900 mb-3">Test Results</h3>
            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="text-left py-2 px-3">Test Code</th>
                  <th className="text-left py-2 px-3">Test Name</th>
                  <th className="text-left py-2 px-3">Result</th>
                  <th className="text-left py-2 px-3">Unit</th>
                  <th className="text-left py-2 px-3">Reference Range</th>
                </tr>
              </thead>
              <tbody>
                {report.tests.map((code, i) => {
                  const result = report.results.find((r) => r.code === code);
                  const test = catalog?.find((t) => t.code === code);
                  return (
                    <tr
                      key={code}
                      className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="py-2 px-3 font-mono text-xs">{code}</td>
                      <td className="py-2 px-3">{test?.name || code}</td>
                      <td className="py-2 px-3 font-semibold">
                        {result?.result || "Pending"}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {result?.unit || test?.unit || "—"}
                      </td>
                      <td className="py-2 px-3 text-gray-600 text-xs">
                        {result?.referenceRange || test?.referenceRange || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {report.notes && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Clinical Notes
              </p>
              <p className="text-sm mt-1 bg-gray-50 p-3 rounded border">
                {report.notes}
              </p>
            </div>
          )}

          {/* Signature */}
          <div className="flex justify-end">
            <div className="text-center">
              {signatureUrl && (
                <img
                  src={signatureUrl}
                  alt="Doctor Signature"
                  className="h-16 mx-auto mb-1"
                />
              )}
              <div className="border-t border-gray-400 pt-1 text-xs text-gray-600">
                {report.doctorName || "Authorized Signatory"}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 border-t pt-3">
            This report is computer generated. For queries, contact{" "}
            {LAB_INFO.phone}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Reports() {
  const { data: patientRecords, isLoading } = usePatients();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState<ReportRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredPatients = (patientRecords ?? []).filter(
    (r) =>
      r.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      r.patient.phone.includes(search),
  );

  return (
    <div className="space-y-6" data-ocid="reports.page">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Reports</h2>
        <p className="text-muted-foreground text-sm">
          View and print patient test reports
        </p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="reports.search_input"
          />
        </div>
        <Tabs
          value={statusFilter}
          onValueChange={setStatusFilter}
          data-ocid="reports.tab"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Patient Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2" data-ocid="reports.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <ReportsByPatient
              patientRecords={filteredPatients}
              statusFilter={statusFilter}
              onViewReport={(row) => {
                setSelectedRow(row);
                setDialogOpen(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      <ReportViewDialog
        row={selectedRow}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}

function ReportsByPatient({
  patientRecords,
  statusFilter,
  onViewReport,
}: {
  patientRecords: PatientRecord[];
  statusFilter: string;
  onViewReport: (row: ReportRow) => void;
}) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  if (patientRecords.length === 0) {
    return (
      <div
        className="py-10 text-center text-muted-foreground"
        data-ocid="reports.empty_state"
      >
        No patients found.
      </div>
    );
  }

  return (
    <div className="space-y-2" data-ocid="reports.list">
      {patientRecords.map((record, idx) => {
        const key = `${record.patient.phone}-${record.createdAt}`;
        return (
          <PatientReportRowInner
            key={key}
            record={record}
            idx={idx}
            statusFilter={statusFilter}
            expanded={expandedKey === key}
            onToggle={() => setExpandedKey(expandedKey === key ? null : key)}
            onViewReport={onViewReport}
          />
        );
      })}
    </div>
  );
}

function PatientReportRowInner({
  record,
  idx,
  statusFilter,
  expanded,
  onToggle,
  onViewReport,
}: {
  record: PatientRecord;
  idx: number;
  statusFilter: string;
  expanded: boolean;
  onToggle: () => void;
  onViewReport: (row: ReportRow) => void;
}) {
  const { data: reports, isLoading } = usePatientReports(
    expanded ? BigInt(idx) : null,
  );

  const filtered = (reports ?? []).filter(
    (r) => statusFilter === "all" || r.status === statusFilter,
  );

  return (
    <div
      className="border border-border rounded-lg overflow-hidden"
      data-ocid={`reports.item.${idx + 1}`}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 text-left"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{record.patient.name}</span>
          <span className="text-xs text-muted-foreground">
            {record.patient.phone}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {expanded ? "▲ Hide" : "▼ Show Reports"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No reports for this patient.
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((report, rIdx) => (
                <div
                  key={`${report.createdAt}-${rIdx}`}
                  className="flex items-center justify-between p-2 bg-muted/20 rounded"
                >
                  <div>
                    <span className="text-xs font-mono text-muted-foreground mr-2">
                      #{rIdx + 1}
                    </span>
                    <span className="text-sm">{report.tests.join(", ")}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {report.doctorName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        report.status === "completed" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {report.status}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        onViewReport({
                          patient: record,
                          report,
                          reportId: BigInt(rIdx),
                          patientIdx: idx,
                        })
                      }
                      data-ocid={`reports.edit_button.${rIdx + 1}`}
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      View / Print
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
import { Eye, FileText, Printer, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PatientRecord, TestReport } from "../backend.d";
import {
  usePatientReports,
  usePatients,
  useTestCatalog,
} from "../hooks/useQueries";
import { LAB_INFO } from "../lib/constants";

type ReportRow = {
  patient: PatientRecord;
  report: TestReport;
  patientIdx: number;
  reportIdx: number;
};

const PRINT_STYLES = `
  body { font-family: Arial, sans-serif; padding: 20px; color: #111; }
  .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a5f; padding-bottom: 16px; margin-bottom: 16px; }
  .header-left { display: flex; align-items: center; gap: 12px; }
  .logo { width: 56px; height: 56px; }
  .lab-name { font-size: 1.2rem; font-weight: bold; color: #1e3a5f; }
  .lab-sub { font-size: 0.75rem; color: #555; }
  .header-right { text-align: right; }
  .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .label { font-size: 0.7rem; text-transform: uppercase; font-weight: 600; color: #888; }
  .value { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-bottom: 16px; }
  th { background: #1e3a5f; color: white; text-align: left; padding: 8px 12px; }
  td { padding: 8px 12px; border: 1px solid #e5e7eb; }
  tr:nth-child(even) td { background: #f9fafb; }
  .notes { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px; font-size: 0.875rem; margin-bottom: 16px; }
  .footer { text-align: center; font-size: 0.75rem; color: #aaa; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  .sign-area { display: flex; justify-content: flex-end; margin-bottom: 16px; }
  .sign-box { text-align: center; border-top: 1px solid #999; padding-top: 4px; font-size: 0.75rem; color: #555; min-width: 160px; }
  .abnormal { color: #dc2626; font-weight: bold; }
  .badge-status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
`;

function openPrintWindow(title: string, content: string) {
  const win = window.open("", "_blank");
  if (!win) {
    toast.error(
      "Browser ne popup block kiya. Please allow popups for this site.",
    );
    return;
  }
  win.document.write(
    `<!DOCTYPE html><html><head><title>${title}</title><style>${PRINT_STYLES}</style></head><body>${content}</body></html>`,
  );
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 500);
}

// ---------- Sample Report Dialog ----------
function SampleReportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const sampleHTML = `
    <div class="header">
      <div class="header-left">
        <div>
          <p class="lab-name">${LAB_INFO.name}</p>
          <p class="lab-sub">${LAB_INFO.address}</p>
          <p class="lab-sub">${LAB_INFO.phone} | GST: ${LAB_INFO.gstNo}</p>
        </div>
      </div>
      <div class="header-right">
        <p style="font-size:0.875rem;font-weight:600;">Report #SAMPLE</p>
        <p style="font-size:0.875rem;">Date: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
        <span class="badge-status" style="background:#dcfce7;color:#166534;">COMPLETED</span>
      </div>
    </div>

    <div class="patient-grid">
      <div><p class="label">Patient Name</p><p class="value">Ramesh Kumar</p></div>
      <div><p class="label">Age / Gender</p><p class="value">45 yrs / Male</p></div>
      <div><p class="label">Phone</p><p class="value">+91 98765 43210</p></div>
      <div><p class="label">Referring Doctor</p><p class="value">Dr. Sharma</p></div>
    </div>

    <h3 style="font-weight:bold;color:#1e3a5f;margin-bottom:8px;">CBC - Complete Blood Count</h3>
    <table>
      <thead><tr>
        <th>Test Name</th><th>Result</th><th>Unit</th><th>Reference Range</th><th>Status</th>
      </tr></thead>
      <tbody>
        <tr><td>Hemoglobin</td><td>13.5</td><td>g/dL</td><td>13.0 - 17.0</td><td style="color:#16a34a;">Normal</td></tr>
        <tr><td>WBC Count</td><td>7200</td><td>cells/µL</td><td>4000 - 11000</td><td style="color:#16a34a;">Normal</td></tr>
        <tr><td>Platelet Count</td><td>2.5 Lakh</td><td>/µL</td><td>1.5 - 4.5 Lakh</td><td style="color:#16a34a;">Normal</td></tr>
        <tr><td>RBC Count</td><td>4.8</td><td>million/µL</td><td>4.5 - 5.5</td><td style="color:#16a34a;">Normal</td></tr>
        <tr><td>Hematocrit (PCV)</td><td>42</td><td>%</td><td>40 - 54</td><td style="color:#16a34a;">Normal</td></tr>
      </tbody>
    </table>

    <h3 style="font-weight:bold;color:#1e3a5f;margin-bottom:8px;">Blood Sugar</h3>
    <table>
      <thead><tr>
        <th>Test Name</th><th>Result</th><th>Unit</th><th>Reference Range</th><th>Status</th>
      </tr></thead>
      <tbody>
        <tr><td>Blood Sugar Fasting</td><td>98</td><td>mg/dL</td><td>70 - 110</td><td style="color:#16a34a;">Normal</td></tr>
      </tbody>
    </table>

    <div class="sign-area">
      <div class="sign-box">Dr. Sharma<br/>MBBS, MD Pathology</div>
    </div>

    <div class="footer">This report is computer generated. For queries, contact ${LAB_INFO.phone}</div>
  `;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        data-ocid="reports.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Sample Report Example</span>
            <Button
              size="sm"
              onClick={() =>
                openPrintWindow("Sample Report - Ramesh Kumar", sampleHTML)
              }
              className="mr-6"
              data-ocid="reports.primary_button"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Sample
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 bg-blue-50 rounded-lg mb-4 text-sm text-blue-800">
          <strong>ℹ️ Yeh ek sample report hai</strong> — iska format real reports
          mein bhi same rahega. Print karne ke liye Print dialog mein{" "}
          <strong>"Save as PDF"</strong> select karein PDF save karne ke liye.
        </div>

        {/* Visual sample report */}
        <div className="p-6 space-y-4 bg-white text-gray-900 border border-gray-200 rounded-lg">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-blue-900 pb-4">
            <div>
              <p className="text-xl font-bold text-blue-900">{LAB_INFO.name}</p>
              <p className="text-xs text-gray-600">{LAB_INFO.address}</p>
              <p className="text-xs text-gray-600">
                {LAB_INFO.phone} | GST: {LAB_INFO.gstNo}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">Report #SAMPLE</p>
              <p className="text-sm">
                Date:{" "}
                {new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-800 font-semibold">
                COMPLETED
              </span>
            </div>
          </div>

          {/* Patient Info */}
          <div className="grid grid-cols-2 gap-4 bg-blue-50 rounded-lg p-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Patient Name
              </p>
              <p className="font-semibold">Ramesh Kumar</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Age / Gender
              </p>
              <p className="font-semibold">45 yrs / Male</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Phone
              </p>
              <p>+91 98765 43210</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">
                Referring Doctor
              </p>
              <p className="font-semibold">Dr. Sharma</p>
            </div>
          </div>

          {/* CBC Results */}
          <div>
            <h3 className="font-bold text-blue-900 mb-2">
              CBC - Complete Blood Count
            </h3>
            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="text-left py-2 px-3">Test Name</th>
                  <th className="text-left py-2 px-3">Result</th>
                  <th className="text-left py-2 px-3">Unit</th>
                  <th className="text-left py-2 px-3">Reference Range</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Hemoglobin", "13.5", "g/dL", "13.0 - 17.0"],
                  ["WBC Count", "7200", "cells/µL", "4000 - 11000"],
                  ["Platelet Count", "2.5 Lakh", "/µL", "1.5 - 4.5 Lakh"],
                  ["RBC Count", "4.8", "million/µL", "4.5 - 5.5"],
                  ["Hematocrit (PCV)", "42", "%", "40 - 54"],
                ].map(([name, result, unit, range], i) => (
                  <tr
                    key={name}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-2 px-3">{name}</td>
                    <td className="py-2 px-3 font-semibold">{result}</td>
                    <td className="py-2 px-3 text-gray-600">{unit}</td>
                    <td className="py-2 px-3 text-gray-600 text-xs">{range}</td>
                    <td className="py-2 px-3 text-green-600 font-semibold">
                      Normal
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Blood Sugar */}
          <div>
            <h3 className="font-bold text-blue-900 mb-2">Blood Sugar</h3>
            <table className="w-full text-sm border border-gray-200">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="text-left py-2 px-3">Test Name</th>
                  <th className="text-left py-2 px-3">Result</th>
                  <th className="text-left py-2 px-3">Unit</th>
                  <th className="text-left py-2 px-3">Reference Range</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-3">Blood Sugar Fasting</td>
                  <td className="py-2 px-3 font-semibold">98</td>
                  <td className="py-2 px-3 text-gray-600">mg/dL</td>
                  <td className="py-2 px-3 text-gray-600 text-xs">70 - 110</td>
                  <td className="py-2 px-3 text-green-600 font-semibold">
                    Normal
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature */}
          <div className="flex justify-end">
            <div className="text-center border-t border-gray-400 pt-1 text-xs text-gray-600 min-w-[160px]">
              Dr. Sharma
              <br />
              MBBS, MD Pathology
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 border-t pt-3">
            This report is computer generated. For queries, contact{" "}
            {LAB_INFO.phone}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Real Report View Dialog ----------
function ReportViewDialog({
  row,
  open,
  onClose,
}: { row: ReportRow | null; open: boolean; onClose: () => void }) {
  const { data: catalog } = useTestCatalog();

  if (!row) return null;
  const { patient, report } = row;
  const reportDate = new Date(
    Number(report.createdAt) / 1_000_000,
  ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const hasResults = report.results && report.results.length > 0;

  const handlePrint = () => {
    const printContent = document.getElementById("report-print")?.innerHTML;
    if (!printContent) return;
    openPrintWindow(`Test Report - ${patient.patient.name}`, printContent);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        data-ocid="reports.dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Test Report</span>
            <div className="flex items-center gap-2 mr-6">
              <Button
                size="sm"
                onClick={handlePrint}
                data-ocid="reports.primary_button"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print / PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground text-center -mt-2 mb-1">
          Print dialog mein &ldquo;Save as PDF&rdquo; select karein PDF save
          karne ke liye
        </p>

        {/* Printable Report */}
        <div id="report-print" className="p-6 space-y-6 bg-white text-gray-900">
          {/* Header */}
          <div className="header flex items-start justify-between border-b-2 border-blue-900 pb-4">
            <div className="header-left flex items-center gap-3">
              <img
                src="/assets/generated/pathlab-logo-transparent.dim_120x120.png"
                alt="Logo"
                className="logo h-14 w-14"
              />
              <div>
                <p className="lab-name text-xl font-bold text-blue-900">
                  {LAB_INFO.name}
                </p>
                <p className="lab-sub text-xs text-gray-600">
                  {LAB_INFO.address}
                </p>
                <p className="lab-sub text-xs text-gray-600">
                  {LAB_INFO.phone} | GST: {LAB_INFO.gstNo}
                </p>
              </div>
            </div>
            <div className="header-right text-right">
              <p className="text-sm font-semibold">
                Report #{row.reportIdx + 1}
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
          <div className="patient-grid grid grid-cols-2 gap-4 bg-blue-50 rounded-lg p-4">
            <div>
              <p className="label text-xs text-gray-500 uppercase font-semibold">
                Patient Name
              </p>
              <p className="value font-semibold">{patient.patient.name}</p>
            </div>
            <div>
              <p className="label text-xs text-gray-500 uppercase font-semibold">
                Age / Gender
              </p>
              <p className="value">
                {Number(patient.patient.age)} yrs / {patient.patient.gender}
              </p>
            </div>
            <div>
              <p className="label text-xs text-gray-500 uppercase font-semibold">
                Phone
              </p>
              <p className="value">{patient.patient.phone}</p>
            </div>
            <div>
              <p className="label text-xs text-gray-500 uppercase font-semibold">
                Referring Doctor
              </p>
              <p className="value">{report.doctorName || "—"}</p>
            </div>
          </div>

          {/* Test Results */}
          <div>
            <h3 className="font-bold text-blue-900 mb-3">Test Results</h3>
            {!hasResults && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-sm text-amber-800">
                ⚠️ Results abhi enter nahi hue hain — Result Entry page par
                results add karein.
              </div>
            )}
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
                        {result?.result || (
                          <span className="text-gray-400 italic">Pending</span>
                        )}
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
              <p className="label text-xs text-gray-500 uppercase font-semibold">
                Clinical Notes
              </p>
              <p className="notes text-sm mt-1 bg-gray-50 p-3 rounded border">
                {report.notes}
              </p>
            </div>
          )}

          {/* Signature area */}
          <div className="sign-area flex justify-end">
            <div className="sign-box text-center">
              <div className="border-t border-gray-400 pt-1 text-xs text-gray-600">
                {report.doctorName || "Authorized Signatory"}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer text-center text-xs text-gray-400 border-t pt-3">
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
  const [sampleOpen, setSampleOpen] = useState(false);

  const filteredPatients = (patientRecords ?? []).filter(
    (r) =>
      r.patient.name.toLowerCase().includes(search.toLowerCase()) ||
      r.patient.phone.includes(search),
  );

  return (
    <div className="space-y-6" data-ocid="reports.page">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports</h2>
          <p className="text-muted-foreground text-sm">
            View and print patient test reports
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSampleOpen(true)}
          data-ocid="reports.secondary_button"
        >
          <Eye className="h-4 w-4 mr-2" />
          Sample Report Dekhein
        </Button>
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

      <SampleReportDialog
        open={sampleOpen}
        onClose={() => setSampleOpen(false)}
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
                          patientIdx: idx,
                          reportIdx: rIdx,
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

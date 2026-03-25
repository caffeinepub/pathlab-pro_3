import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface TestReportInput {
    tests: Array<TestCode>;
    patientId: PatientId;
    notes: string;
    doctorName: string;
}
export type TestCode = string;
export interface Test {
    code: TestCode;
    name: string;
    unit: string;
    sampleType: string;
    referenceRange: string;
    price: bigint;
}
export type BillId = bigint;
export type PatientId = bigint;
export interface DashboardStats {
    totalPatients: bigint;
    pendingReports: bigint;
    reportsToday: bigint;
    totalRevenue: bigint;
}
export interface TestCatalogInput {
    code: string;
    name: string;
    unit: string;
    sampleType: string;
    referenceRange: string;
    price: bigint;
}
export interface TestResult {
    result: string;
    code: TestCode;
    unit: string;
    referenceRange: string;
}
export interface Patient {
    age: bigint;
    name: string;
    address: string;
    gender: Gender;
    phone: string;
}
export type ReportId = bigint;
export interface PatientRecord {
    patient: Patient;
    createdAt: bigint;
    updatedAt: bigint;
}
export interface PatientInput {
    age?: bigint;
    name: string;
    address: string;
    gender?: Gender;
    phone: string;
}
export interface Bill {
    lineItems: Array<BillLineItem>;
    paymentStatus: PaymentStatus;
    gstAmount: bigint;
    totalAmount: bigint;
    timestamp: bigint;
    reportId: ReportId;
}
export interface TestReport {
    status: TestStatus;
    completedAt?: bigint;
    tests: Array<TestCode>;
    patientId: PatientId;
    createdAt: bigint;
    results: Array<TestResult>;
    notes: string;
    doctorName: string;
}
export interface BillLineItem {
    testName: string;
    price: bigint;
}
export interface UserProfile {
    name: string;
}
export enum Gender {
    other = "other",
    female = "female",
    male = "male"
}
export enum PaymentStatus {
    paid = "paid",
    unpaid = "unpaid",
    partial = "partial"
}
export enum TestStatus {
    pending = "pending",
    completed = "completed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPatient(rawData: PatientInput): Promise<PatientId>;
    addTestCatalog(test: TestCatalogInput): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBill(reportId: ReportId, lineItems: Array<BillLineItem>): Promise<BillId>;
    createTestReport(input: TestReportInput): Promise<ReportId>;
    getAllBillsByTimestamp(): Promise<Array<Bill>>;
    getAllPatientsByCreatedAt(): Promise<Array<PatientRecord>>;
    getAllTestCatalog(): Promise<Array<Test>>;
    getAllTestCatalogBySampleType(sampleType: string): Promise<Array<Test>>;
    getBill(billId: BillId): Promise<Bill>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<DashboardStats>;
    getMostRecentPatients(limit: bigint): Promise<Array<Patient>>;
    getPatient(id: PatientId): Promise<Patient>;
    getPatientReportsByCreatedAt(patientId: PatientId): Promise<Array<TestReport>>;
    getReportsByStatus(status: TestStatus): Promise<Array<TestReport>>;
    getSignature(reportId: ReportId): Promise<ExternalBlob>;
    getTestCatalog(code: TestCode): Promise<Test>;
    getTestReport(reportId: ReportId): Promise<TestReport>;
    getTestReportsByCompletedAt(): Promise<Array<TestReport>>;
    getTestReportsByCreatedAt(): Promise<Array<TestReport>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    storeSignature(reportId: ReportId, signature: ExternalBlob): Promise<void>;
    updatePatient(id: PatientId, rawData: PatientInput): Promise<void>;
    updatePaymentStatus(billId: BillId, status: PaymentStatus): Promise<void>;
    updateTestPrice(code: TestCode, price: bigint): Promise<void>;
    updateTestReportResult(reportId: ReportId, results: Array<TestResult>): Promise<void>;
}

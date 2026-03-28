import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Authorization "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";



actor {
  type PatientId = Nat;
  type TestCode = Text;
  type ReportId = Nat;
  type BillId = Nat;
  type SignatureId = Text;

  public type PaymentStatus = { #unpaid; #paid; #partial };
  public type BillLineItem = {
    testName : Text;
    price : Nat;
  };
  public type Gender = { #male; #female; #other };
  public type TestStatus = { #pending; #completed };
  public type TestResult = {
    code : TestCode;
    result : Text;
    unit : Text;
    referenceRange : Text;
  };
  public type TestReportInput = {
    patientId : PatientId;
    tests : [TestCode];
    doctorName : Text;
    notes : Text;
  };
  public type Bill = {
    reportId : ReportId;
    lineItems : [BillLineItem];
    totalAmount : Nat;
    gstAmount : Nat;
    paymentStatus : PaymentStatus;
    timestamp : Int;
  };
  public type Test = {
    name : Text;
    code : TestCode;
    unit : Text;
    referenceRange : Text;
    price : Nat;
    sampleType : Text;
  };
  public type TestReport = {
    patientId : PatientId;
    tests : [TestCode];
    doctorName : Text;
    notes : Text;
    results : [TestResult];
    status : TestStatus;
    createdAt : Int;
    completedAt : ?Int;
  };
  public type Patient = {
    name : Text;
    age : Nat;
    gender : Gender;
    phone : Text;
    address : Text;
  };

  public type PatientInput = {
    name : Text;
    age : ?Nat;
    gender : ?Gender;
    phone : Text;
    address : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  type PatientRecord = {
    patient : Patient;
    createdAt : Int;
    updatedAt : Int;
  };

  module PatientRecord {
    public func compareByCreatedAt(a : PatientRecord, b : PatientRecord) : Order.Order {
      Int.compare(a.createdAt, b.createdAt);
    };
  };

  module Bill {
    public func compareByTimestamp(a : Bill, b : Bill) : Order.Order {
      Int.compare(a.timestamp, b.timestamp);
    };
  };

  module TestReport {
    public func compareByCreatedAt(a : TestReport, b : TestReport) : Order.Order {
      Int.compare(a.createdAt, b.createdAt);
    };

    public func compareByCompletedAt(a : TestReport, b : TestReport) : Order.Order {
      switch (a.completedAt, b.completedAt) {
        case (?(timeA), ?(_)) { Int.compare(timeA, 0) };
        case (null, ?(_)) { #less };
        case (?(timeA), null) { #greater };
        case (null, null) { #equal };
      };
    };
  };

  public type TestCatalogInput = {
    name : Text;
    code : Text;
    unit : Text;
    referenceRange : Text;
    price : Nat;
    sampleType : Text;
  };

  public type DashboardStats = {
    totalPatients : Nat;
    reportsToday : Nat;
    pendingReports : Nat;
    totalRevenue : Nat;
  };

  let patients = Map.empty<PatientId, PatientRecord>();
  let testCatalog = Map.empty<TestCode, Test>();
  let testReports = Map.empty<ReportId, TestReport>();
  let bills = Map.empty<BillId, Bill>();
  let signatures = Map.empty<SignatureId, Storage.ExternalBlob>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextPatientId = 1;
  var nextReportId = 1;
  var nextBillId = 1;

  let accessControlState = Authorization.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  // User Profile Management Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Test Catalog Management
  public shared ({ caller }) func addTestCatalog(test : TestCatalogInput) : async () {
    let testData : Test = {
      name = test.name;
      code = test.code;
      unit = test.unit;
      referenceRange = test.referenceRange;
      price = test.price;
      sampleType = test.sampleType;
    };
    testCatalog.add(test.code, testData);
  };

  public shared ({ caller }) func updateTestPrice(code : TestCode, price : Nat) : async () {
    switch (testCatalog.get(code)) {
      case (null) { Runtime.trap("Test not found") };
      case (?test) {
        let updated : Test = {
          name = test.name;
          code = test.code;
          unit = test.unit;
          referenceRange = test.referenceRange;
          price = price;
          sampleType = test.sampleType;
        };
        testCatalog.add(code, updated);
      };
    };
  };

  public query ({ caller }) func getAllTestCatalog() : async [Test] {
    testCatalog.values().toArray();
  };

  public query ({ caller }) func getTestCatalog(code : TestCode) : async Test {
    switch (testCatalog.get(code)) {
      case (null) { Runtime.trap("Test not found") };
      case (?test) { test };
    };
  };

  public query ({ caller }) func getAllTestCatalogBySampleType(sampleType : Text) : async [Test] {
    testCatalog.values().toArray().filter(
      func(test) {
        test.sampleType == sampleType;
      }
    );
  };

  // Patient Management
  public shared ({ caller }) func addPatient(rawData : PatientInput) : async PatientId {
    if (rawData.name == "" or rawData.age == null or rawData.gender == null) {
      Runtime.trap("Invalid patient data");
    };
    let newId = nextPatientId;
    nextPatientId += 1;
    let currentTime = Time.now();
    let completePatient : Patient = {
      name = rawData.name;
      age = switch (rawData.age) {
        case (null) { 0 };
        case (?now) { now };
      };
      gender = switch (rawData.gender) {
        case (null) { #other };
        case (?now) { now };
      };
      phone = rawData.phone;
      address = rawData.address;
    };
    let patientRecord = {
      patient = completePatient;
      createdAt = currentTime;
      updatedAt = currentTime;
    };
    patients.add(newId, patientRecord);
    newId;
  };

  public shared ({ caller }) func updatePatient(id : PatientId, rawData : PatientInput) : async () {
    switch (patients.get(id)) {
      case (null) { Runtime.trap("Patient not found") };
      case (?patientRecord) {
        let updatedPatient : Patient = {
          name = if (rawData.name != "") { rawData.name } else {
            patientRecord.patient.name;
          };
          age = switch (rawData.age) {
            case (null) { patientRecord.patient.age };
            case (?now) { now };
          };
          gender = switch (rawData.gender) {
            case (null) { patientRecord.patient.gender };
            case (?now) { now };
          };
          phone = if (rawData.phone != "") { rawData.phone } else {
            patientRecord.patient.phone;
          };
          address = if (rawData.address != "") { rawData.address } else {
            patientRecord.patient.address;
          };
        };
        let updatedRecord = {
          patient = updatedPatient;
          createdAt = patientRecord.createdAt;
          updatedAt = Time.now();
        };
        patients.add(id, updatedRecord);
      };
    };
  };

  public query ({ caller }) func getPatient(id : PatientId) : async Patient {
    switch (patients.get(id)) {
      case (null) { Runtime.trap("Patient not found") };
      case (?patient) { patient.patient };
    };
  };

  public query ({ caller }) func getAllPatientsByCreatedAt() : async [PatientRecord] {
    patients.values().toArray().sort(PatientRecord.compareByCreatedAt);
  };

  public query ({ caller }) func getMostRecentPatients(limit : Nat) : async [Patient] {
    patients.values().toArray().sort(PatientRecord.compareByCreatedAt).map(
      func(record) { record.patient }
    );
  };

  // Test Report Management
  public shared ({ caller }) func createTestReport(input : TestReportInput) : async ReportId {
    let newId = nextReportId;
    nextReportId += 1;
    let report : TestReport = {
      patientId = input.patientId;
      tests = input.tests;
      doctorName = input.doctorName;
      notes = input.notes;
      results = [];
      status = #pending;
      createdAt = Time.now();
      completedAt = null;
    };
    testReports.add(newId, report);
    newId;
  };

  public shared ({ caller }) func updateTestReportResult(reportId : ReportId, results : [TestResult]) : async () {
    switch (testReports.get(reportId)) {
      case (null) { Runtime.trap("Test report not found") };
      case (?report) {
        let updatedReport = {
          patientId = report.patientId;
          tests = report.tests;
          doctorName = report.doctorName;
          notes = report.notes;
          results;
          status = #completed;
          createdAt = report.createdAt;
          completedAt = ?Time.now();
        };
        testReports.add(reportId, updatedReport);
      };
    };
  };

  public query ({ caller }) func getTestReport(reportId : ReportId) : async TestReport {
    switch (testReports.get(reportId)) {
      case (null) { Runtime.trap("Test report not found") };
      case (?report) { report };
    };
  };

  public query ({ caller }) func getPatientReportsByCreatedAt(patientId : PatientId) : async [TestReport] {
    let patientReportsList = List.empty<TestReport>();
    for (report in testReports.values()) {
      if (report.patientId == patientId) {
        patientReportsList.add(report);
      };
    };
    let patientReportsArray = patientReportsList.toArray();
    patientReportsArray.sort(TestReport.compareByCreatedAt);
  };

  public query ({ caller }) func getTestReportsByCreatedAt() : async [TestReport] {
    testReports.values().toArray().sort(TestReport.compareByCreatedAt);
  };

  public query ({ caller }) func getTestReportsByCompletedAt() : async [TestReport] {
    testReports.values().toArray().sort(TestReport.compareByCompletedAt);
  };

  public query ({ caller }) func getReportsByStatus(status : TestStatus) : async [TestReport] {
    testReports.values().toArray().filter(func(report) { report.status == status });
  };

  // Signature Management
  public shared ({ caller }) func storeSignature(reportId : ReportId, signature : Storage.ExternalBlob) : async () {
    let signatureId = reportId.toText();
    signatures.add(signatureId, signature);
  };

  public query ({ caller }) func getSignature(reportId : ReportId) : async Storage.ExternalBlob {
    let signatureId = reportId.toText();
    switch (signatures.get(signatureId)) {
      case (null) { Runtime.trap("Signature not found") };
      case (?signature) { signature };
    };
  };

  // Billing Management
  public shared ({ caller }) func createBill(reportId : ReportId, lineItems : [BillLineItem]) : async BillId {
    var total = 0;
    for (item in lineItems.values()) {
      total += item.price;
    };
    let gst = total * 18 / 100;
    let newId = nextBillId;
    nextBillId += 1;
    let bill : Bill = {
      reportId;
      lineItems;
      totalAmount = total;
      gstAmount = gst;
      paymentStatus = #unpaid;
      timestamp = Time.now();
    };
    bills.add(newId, bill);
    newId;
  };

  public shared ({ caller }) func updatePaymentStatus(billId : BillId, status : PaymentStatus) : async () {
    switch (bills.get(billId)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?bill) {
        let updatedBill = {
          reportId = bill.reportId;
          lineItems = bill.lineItems;
          totalAmount = bill.totalAmount;
          gstAmount = bill.gstAmount;
          paymentStatus = status;
          timestamp = bill.timestamp;
        };
        bills.add(billId, updatedBill);
      };
    };
  };

  public query ({ caller }) func getBill(billId : BillId) : async Bill {
    switch (bills.get(billId)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?bill) { bill };
    };
  };

  public query ({ caller }) func getAllBillsByTimestamp() : async [Bill] {
    bills.values().toArray().sort(Bill.compareByTimestamp);
  };

  // Dashboard
  public query ({ caller }) func getDashboardStats() : async DashboardStats {
    let currentTimestamp = Time.now();
    let totalPatients = patients.size();
    let pendingReports = testReports.size() - testReports.values().toArray().filter(
      func(report) {
        report.status == #completed;
      }
    ).size();
    let reportsToday = testReports.values().toArray().filter(
      func(report) {
        let reportToday = (currentTimestamp - report.createdAt) <= 86_400_000_000_000;
        let reportCompleted = report.status == #completed;
        reportToday and reportCompleted;
      }
    ).size();
    let totalRevenue = bills.values().toArray().foldLeft(
      0,
      func(acc, bill) {
        acc + bill.totalAmount + bill.gstAmount;
      },
    );

    {
      totalPatients;
      reportsToday;
      pendingReports;
      totalRevenue;
    };
  };
};

import {
  students,
  Student,
  InsertStudent,
  feeStructure,
  FeeStructureItem,
  InsertFeeStructureItem,
  receipts,
  Receipt,
  InsertReceipt,
  receiptItems,
  ReceiptItem,
  InsertReceiptItem,
  feeDues,
  FeeDue,
  InsertFeeDue,
  users,
  User,
  InsertUser,
  transportationRoutes,
  TransportationRoute,
  InsertTransportationRoute,
  GRADES,
  FEE_TYPES,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  TRANSPORTATION_FREQUENCY,
  SchoolSettings,
} from "@shared/schema";

export interface IStorage {
  // Transportation route operations
  getTransportationRoute(id: number): Promise<TransportationRoute | undefined>;
  getAllTransportationRoutes(
    activeOnly?: boolean,
  ): Promise<TransportationRoute[]>;
  createTransportationRoute(
    route: InsertTransportationRoute,
  ): Promise<TransportationRoute>;
  updateTransportationRoute(
    id: number,
    route: Partial<InsertTransportationRoute>,
  ): Promise<TransportationRoute | undefined>;
  deleteTransportationRoute(id: number): Promise<boolean>;

  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByAdmissionNumber(
    admissionNumber: string,
  ): Promise<Student | undefined>;
  searchStudents(query: string, grade?: string): Promise<Student[]>;
  getStudentsByGrade(grade: string): Promise<Student[]>;
  getStudentsByTransportationRoute(routeId: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(
    id: number,
    student: Partial<InsertStudent>,
  ): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;

  // Fee structure operations
  getFeeStructure(id: number): Promise<FeeStructureItem | undefined>;
  getFeeStructureByGrade(grade: string): Promise<FeeStructureItem[]>;
  getAllFeeStructure(): Promise<FeeStructureItem[]>;
  createFeeStructure(
    feeStructure: InsertFeeStructureItem,
  ): Promise<FeeStructureItem>;
  updateFeeStructure(
    id: number,
    feeStructure: Partial<InsertFeeStructureItem>,
  ): Promise<FeeStructureItem | undefined>;
  deleteFeeStructure(id: number): Promise<boolean>;

  // Receipt operations
  getReceipt(id: number): Promise<Receipt | undefined>;
  getReceiptByNumber(receiptNumber: string): Promise<Receipt | undefined>;
  getReceiptsByStudent(studentId: number): Promise<Receipt[]>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  updateReceipt(
    id: number,
    receipt: Partial<InsertReceipt>,
  ): Promise<Receipt | undefined>;
  deleteReceipt(id: number): Promise<boolean>;
  getRecentReceipts(
    limit: number,
  ): Promise<
    (Receipt & { studentName: string; grade: string; section: string })[]
  >;

  // Receipt items operations
  getReceiptItems(receiptId: number): Promise<ReceiptItem[]>;
  createReceiptItem(receiptItem: InsertReceiptItem): Promise<ReceiptItem>;
  updateReceiptItem(
    id: number,
    receiptItem: Partial<InsertReceiptItem>,
  ): Promise<ReceiptItem | undefined>;
  deleteReceiptItem(id: number): Promise<boolean>;

  // Fee due operations
  getFeeDue(id: number): Promise<FeeDue | undefined>;
  getFeeDuesByStudent(studentId: number): Promise<FeeDue[]>;
  createFeeDue(feeDue: InsertFeeDue): Promise<FeeDue>;
  updateFeeDue(
    id: number,
    feeDue: Partial<InsertFeeDue>,
  ): Promise<FeeDue | undefined>;
  deleteFeeDue(id: number): Promise<boolean>;
  getDefaulters(): Promise<
    (FeeDue & { studentName: string; grade: string; admissionNumber: string })[]
  >;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Statistics for dashboard
  getDashboardStats(): Promise<{
    todayCollection: number;
    receiptsGenerated: number;
    pendingPayments: number;
    totalStudents: number;
  }>;

  // School settings operations
  getSchoolSettings(): Promise<SchoolSettings>;
  updateSchoolSettings(
    settings: Partial<SchoolSettings>,
  ): Promise<SchoolSettings>;
}

export class MemStorage implements IStorage {
  private students: Map<number, Student>;
  private feeStructure: Map<number, FeeStructureItem>;
  private receipts: Map<number, Receipt>;
  private receiptItems: Map<number, ReceiptItem>;
  private feeDues: Map<number, FeeDue>;
  private users: Map<number, User>;
  private transportationRoutes: Map<number, TransportationRoute>;
  private schoolSettings: SchoolSettings;

  private currentStudentId: number = 1;
  private currentFeeStructureId: number = 1;
  private currentReceiptId: number = 1;
  private currentReceiptItemId: number = 1;
  private currentFeeDueId: number = 1;
  private currentUserId: number = 1;
  private currentTransportationRouteId: number = 1;

  constructor() {
    this.students = new Map();
    this.feeStructure = new Map();
    this.receipts = new Map();
    this.receiptItems = new Map();
    this.feeDues = new Map();
    this.users = new Map();
    this.transportationRoutes = new Map();

    // Initialize school settings with default values
    this.schoolSettings = {
      schoolName: "Krishnaveni Talent School Ramannapet",
      address: "Near Old Bus stand, Ramannapet, 508113",
      phone: "+91-7386685333",
      email: "ktsramannapet@gmail.com",
      website: "www.globalexcellence.edu",
      principalName: "Dr. Rajendra Kumar",
      logo: null,
      receiptPrefix: "GES",
      academicYear: "2025-2026",
      currentTerm: "Quarter 1",
      enableEmailNotifications: false,
      enableSMSNotifications: false,
      enableAutomaticReminders: false,
      reminderDays: 5,
      taxPercentage: 0,
      receiptFooterText:
        "Thank you for your payment. This receipt is system generated.",
      receiptCopies: 2,
      theme: "light",
    };

    // Add some initial data
    this.seedData();
  }

  // School Settings Operations
  async getSchoolSettings(): Promise<SchoolSettings> {
    return this.schoolSettings;
  }

  async updateSchoolSettings(
    settings: Partial<SchoolSettings>,
  ): Promise<SchoolSettings> {
    this.schoolSettings = {
      ...this.schoolSettings,
      ...settings,
    };
    return this.schoolSettings;
  }

  // Transportation route operations
  async getTransportationRoute(
    id: number,
  ): Promise<TransportationRoute | undefined> {
    return this.transportationRoutes.get(id);
  }

  async getAllTransportationRoutes(
    activeOnly: boolean = false,
  ): Promise<TransportationRoute[]> {
    let routes = Array.from(this.transportationRoutes.values());
    if (activeOnly) {
      routes = routes.filter((route) => route.isActive);
    }
    return routes;
  }

  async createTransportationRoute(
    route: InsertTransportationRoute,
  ): Promise<TransportationRoute> {
    const id = this.currentTransportationRouteId++;
    const newRoute: TransportationRoute = {
      ...route,
      id,
      createdAt: new Date(),
    };
    this.transportationRoutes.set(id, newRoute);
    return newRoute;
  }

  async updateTransportationRoute(
    id: number,
    route: Partial<InsertTransportationRoute>,
  ): Promise<TransportationRoute | undefined> {
    const existingRoute = this.transportationRoutes.get(id);
    if (!existingRoute) return undefined;

    const updatedRoute = { ...existingRoute, ...route };
    this.transportationRoutes.set(id, updatedRoute);
    return updatedRoute;
  }

  async deleteTransportationRoute(id: number): Promise<boolean> {
    return this.transportationRoutes.delete(id);
  }

  async getStudentsByTransportationRoute(routeId: number): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.transportationRouteId === routeId,
    );
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByAdmissionNumber(
    admissionNumber: string,
  ): Promise<Student | undefined> {
    return Array.from(this.students.values()).find(
      (student) => student.admissionNumber === admissionNumber,
    );
  }

  async searchStudents(query: string, grade?: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter((student) => {
      const matchesQuery =
        student.studentName.toLowerCase().includes(query.toLowerCase()) ||
        student.admissionNumber.toLowerCase().includes(query.toLowerCase()) ||
        student.parentName.toLowerCase().includes(query.toLowerCase());

      if (grade) {
        return matchesQuery && student.grade === grade;
      }

      return matchesQuery;
    });
  }

  async getStudentsByGrade(grade: string): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.grade === grade,
    );
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.currentStudentId++;
    const newStudent: Student = { ...student, id };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(
    id: number,
    student: Partial<InsertStudent>,
  ): Promise<Student | undefined> {
    const existingStudent = this.students.get(id);
    if (!existingStudent) return undefined;

    const updatedStudent = { ...existingStudent, ...student };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.students.delete(id);
  }

  // Fee structure operations
  async getFeeStructure(id: number): Promise<FeeStructureItem | undefined> {
    return this.feeStructure.get(id);
  }

  async getFeeStructureByGrade(grade: string): Promise<FeeStructureItem[]> {
    return Array.from(this.feeStructure.values()).filter(
      (item) => item.grade === grade,
    );
  }

  async getAllFeeStructure(): Promise<FeeStructureItem[]> {
    return Array.from(this.feeStructure.values());
  }

  async createFeeStructure(
    feeStructureItem: InsertFeeStructureItem,
  ): Promise<FeeStructureItem> {
    const id = this.currentFeeStructureId++;
    const newFeeStructureItem: FeeStructureItem = { ...feeStructureItem, id };
    this.feeStructure.set(id, newFeeStructureItem);
    return newFeeStructureItem;
  }

  async updateFeeStructure(
    id: number,
    feeStructureItem: Partial<InsertFeeStructureItem>,
  ): Promise<FeeStructureItem | undefined> {
    const existingFeeStructureItem = this.feeStructure.get(id);
    if (!existingFeeStructureItem) return undefined;

    const updatedFeeStructureItem = {
      ...existingFeeStructureItem,
      ...feeStructureItem,
    };
    this.feeStructure.set(id, updatedFeeStructureItem);
    return updatedFeeStructureItem;
  }

  async deleteFeeStructure(id: number): Promise<boolean> {
    return this.feeStructure.delete(id);
  }

  // Receipt operations
  async getReceipt(id: number): Promise<Receipt | undefined> {
    return this.receipts.get(id);
  }

  async getReceiptByNumber(
    receiptNumber: string,
  ): Promise<Receipt | undefined> {
    return Array.from(this.receipts.values()).find(
      (receipt) => receipt.receiptNumber === receiptNumber,
    );
  }

  async getReceiptsByStudent(studentId: number): Promise<Receipt[]> {
    return Array.from(this.receipts.values()).filter(
      (receipt) => receipt.studentId === studentId,
    );
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const id = this.currentReceiptId++;
    const newReceipt: Receipt = {
      ...receipt,
      id,
      createdAt: new Date(),
    };
    this.receipts.set(id, newReceipt);
    return newReceipt;
  }

  async updateReceipt(
    id: number,
    receipt: Partial<InsertReceipt>,
  ): Promise<Receipt | undefined> {
    const existingReceipt = this.receipts.get(id);
    if (!existingReceipt) return undefined;

    const updatedReceipt = { ...existingReceipt, ...receipt };
    this.receipts.set(id, updatedReceipt);
    return updatedReceipt;
  }

  async deleteReceipt(id: number): Promise<boolean> {
    return this.receipts.delete(id);
  }

  async getRecentReceipts(
    limit: number,
  ): Promise<
    (Receipt & { studentName: string; grade: string; section: string })[]
  > {
    const allReceipts = Array.from(this.receipts.values())
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, limit);

    return allReceipts.map((receipt) => {
      const student = this.students.get(receipt.studentId);
      return {
        ...receipt,
        studentName: student?.studentName || "Unknown",
        grade: student?.grade || "Unknown",
        section: student?.section || "Unknown",
      };
    });
  }

  // Receipt items operations
  async getReceiptItems(receiptId: number): Promise<ReceiptItem[]> {
    return Array.from(this.receiptItems.values()).filter(
      (item) => item.receiptId === receiptId,
    );
  }

  async createReceiptItem(
    receiptItem: InsertReceiptItem,
  ): Promise<ReceiptItem> {
    const id = this.currentReceiptItemId++;
    const newReceiptItem: ReceiptItem = { ...receiptItem, id };
    this.receiptItems.set(id, newReceiptItem);
    return newReceiptItem;
  }

  async updateReceiptItem(
    id: number,
    receiptItem: Partial<InsertReceiptItem>,
  ): Promise<ReceiptItem | undefined> {
    const existingReceiptItem = this.receiptItems.get(id);
    if (!existingReceiptItem) return undefined;

    const updatedReceiptItem = { ...existingReceiptItem, ...receiptItem };
    this.receiptItems.set(id, updatedReceiptItem);
    return updatedReceiptItem;
  }

  async deleteReceiptItem(id: number): Promise<boolean> {
    return this.receiptItems.delete(id);
  }

  // Fee due operations
  async getFeeDue(id: number): Promise<FeeDue | undefined> {
    return this.feeDues.get(id);
  }

  async getFeeDuesByStudent(studentId: number): Promise<FeeDue[]> {
    return Array.from(this.feeDues.values()).filter(
      (feeDue) => feeDue.studentId === studentId,
    );
  }

  async createFeeDue(feeDue: InsertFeeDue): Promise<FeeDue> {
    const id = this.currentFeeDueId++;
    const newFeeDue: FeeDue = { ...feeDue, id };
    this.feeDues.set(id, newFeeDue);
    return newFeeDue;
  }

  async updateFeeDue(
    id: number,
    feeDue: Partial<InsertFeeDue>,
  ): Promise<FeeDue | undefined> {
    const existingFeeDue = this.feeDues.get(id);
    if (!existingFeeDue) return undefined;

    const updatedFeeDue = { ...existingFeeDue, ...feeDue };
    this.feeDues.set(id, updatedFeeDue);
    return updatedFeeDue;
  }

  async deleteFeeDue(id: number): Promise<boolean> {
    return this.feeDues.delete(id);
  }

  async getDefaulters(): Promise<
    (FeeDue & { studentName: string; grade: string; admissionNumber: string })[]
  > {
    const overdueFeeDues = Array.from(this.feeDues.values()).filter(
      (feeDue) => feeDue.status === "Overdue" || feeDue.status === "Due",
    );

    return overdueFeeDues.map((feeDue) => {
      const student = this.students.get(feeDue.studentId);
      return {
        ...feeDue,
        studentName: student?.studentName || "Unknown",
        grade: student?.grade || "Unknown",
        admissionNumber: student?.admissionNumber || "Unknown",
      };
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(
    id: number,
    user: Partial<InsertUser>,
  ): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    todayCollection: number;
    receiptsGenerated: number;
    pendingPayments: number;
    totalStudents: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCollection = Array.from(this.receipts.values())
      .filter((receipt) => {
        const receiptDate = new Date(receipt.receiptDate);
        receiptDate.setHours(0, 0, 0, 0);
        return receiptDate.getTime() === today.getTime();
      })
      .reduce((sum, receipt) => sum + receipt.totalAmount, 0);

    const receiptsGenerated = Array.from(this.receipts.values()).length;

    const pendingPayments = Array.from(this.feeDues.values()).filter(
      (feeDue) =>
        feeDue.status === "Due" ||
        feeDue.status === "Overdue" ||
        feeDue.status === "Partial",
    ).length;

    const totalStudents = this.students.size;

    return {
      todayCollection,
      receiptsGenerated,
      pendingPayments,
      totalStudents,
    };
  }

  // Seed data for demonstration
  private seedData() {
    // Add transportation routes
    const route1 = this.createTransportationRoute({
      routeName: "North Zone",
      description:
        "Covers northern residential areas including Model Town and Civil Lines",
      distance: 5.2,
      fare: 1200,
      isActive: true,
    });

    const route2 = this.createTransportationRoute({
      routeName: "South Zone",
      description:
        "Covers southern residential areas including Lajpat Nagar and GK",
      distance: 7.5,
      fare: 1500,
      isActive: true,
    });

    const route3 = this.createTransportationRoute({
      routeName: "East Zone",
      description:
        "Covers eastern residential areas including Mayur Vihar and Noida",
      distance: 10.8,
      fare: 1800,
      isActive: true,
    });

    const route4 = this.createTransportationRoute({
      routeName: "West Zone",
      description:
        "Covers western residential areas including Dwarka and Janakpuri",
      distance: 8.3,
      fare: 1600,
      isActive: true,
    });

    // Add admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      role: "Administrator",
      fullName: "Admin Staff",
      email: "admin@school.com",
    });

    // Add sample students
    const student1 = this.createStudent({
      admissionNumber: "ADM2023042",
      studentName: "Aditya Sharma",
      grade: "5",
      section: "A",
      rollNumber: 12,
      parentName: "Mr. Suresh Sharma",
      contactNumber: "9876543210",
      email: "suresh@example.com",
      feeCategory: "Regular",
      admissionDate: new Date("2020-04-10"),
    });

    const student2 = this.createStudent({
      admissionNumber: "ADM2023001",
      studentName: "Rahul Sharma",
      grade: "5",
      section: "A",
      rollNumber: 1,
      parentName: "Mr. Ramesh Sharma",
      contactNumber: "9876543211",
      email: "ramesh@example.com",
      feeCategory: "Regular",
      admissionDate: new Date("2020-04-05"),
    });

    // Add more students from different grades with transportation routes
    this.createStudent({
      admissionNumber: "ADM2023002",
      studentName: "Priya Patel",
      grade: "3",
      section: "B",
      rollNumber: 8,
      parentName: "Mrs. Meena Patel",
      contactNumber: "9876543212",
      email: "meena@example.com",
      feeCategory: "Scholarship (25%)",
      transportationRouteId: 1, // North Zone
      pickupPoint: "Model Town Market",
      admissionDate: new Date("2021-04-15"),
    });

    this.createStudent({
      admissionNumber: "ADMKG0040",
      studentName: "Aarav Kumar",
      grade: "KG",
      section: "A",
      rollNumber: 5,
      parentName: "Mr. Deepak Kumar",
      contactNumber: "9876543213",
      email: "deepak@example.com",
      feeCategory: "Regular",
      transportationRouteId: 2, // South Zone
      pickupPoint: "Lajpat Nagar Central Market",
      admissionDate: new Date("2022-04-10"),
    });

    this.createStudent({
      admissionNumber: "ADM7B0038",
      studentName: "Neha Patel",
      grade: "7",
      section: "B",
      rollNumber: 14,
      parentName: "Mr. Rajesh Patel",
      contactNumber: "9876543214",
      email: "rajesh@example.com",
      feeCategory: "Regular",
      transportationRouteId: 3, // East Zone
      pickupPoint: "Mayur Vihar Metro Station",
      admissionDate: new Date("2019-04-12"),
    });

    this.createStudent({
      admissionNumber: "ADM10B0039",
      studentName: "Sneha Verma",
      grade: "10",
      section: "B",
      rollNumber: 6,
      parentName: "Mrs. Anita Verma",
      contactNumber: "9876543215",
      email: "anita@example.com",
      feeCategory: "Regular",
      transportationRouteId: 4, // West Zone
      pickupPoint: "Dwarka Sector 10 Market",
      admissionDate: new Date("2016-04-08"),
    });

    // Add fee structure for different grades
    GRADES.forEach((grade) => {
      // Tuition fee increases with grade level
      const baseTuition =
        grade === "Nursery"
          ? 2000
          : grade === "KG"
            ? 2200
            : parseInt(grade) * 300 + 2000;

      this.createFeeStructure({
        grade,
        feeType: "Tuition",
        amount: baseTuition,
        frequency: "Monthly",
        dueDay: 10,
      });

      this.createFeeStructure({
        grade,
        feeType: "Library",
        amount: 500,
        frequency: "Annual",
        dueDay: 15,
      });

      // Only higher grades have lab fee
      if (grade !== "Nursery" && grade !== "KG" && parseInt(grade) > 3) {
        this.createFeeStructure({
          grade,
          feeType: "Laboratory",
          amount: 700,
          frequency: "Term",
          dueDay: 15,
        });
      }

      this.createFeeStructure({
        grade,
        feeType: "Sports",
        amount: 500,
        frequency: "Annual",
        dueDay: 15,
      });

      this.createFeeStructure({
        grade,
        feeType: "Examination",
        amount:
          grade === "Nursery" || grade === "KG"
            ? 500
            : parseInt(grade) * 100 + 400,
        frequency: "Term",
        dueDay: 20,
      });

      this.createFeeStructure({
        grade,
        feeType: "Transportation",
        amount: 1200,
        frequency: "Monthly",
        dueDay: 10,
      });
    });

    // Add fee dues for the seeded student
    Promise.resolve(student1).then((student) => {
      if (student) {
        this.createFeeDue({
          studentId: student.id,
          feeType: "Tuition",
          description: "Tuition Fee (May 2023)",
          amount: 3000,
          dueDate: new Date("2023-05-10"),
          status: "Overdue",
          period: "May 2023",
          amountPaid: 0,
        });

        this.createFeeDue({
          studentId: student.id,
          feeType: "Library",
          description: "Library Fee (Annual)",
          amount: 500,
          dueDate: new Date("2023-04-15"),
          status: "Overdue",
          period: "2023-2024",
          amountPaid: 0,
        });

        this.createFeeDue({
          studentId: student.id,
          feeType: "Laboratory",
          description: "Laboratory Fee (Term 1)",
          amount: 700,
          dueDate: new Date("2023-04-15"),
          status: "Overdue",
          period: "Term 1 2023",
          amountPaid: 0,
        });

        this.createFeeDue({
          studentId: student.id,
          feeType: "Sports",
          description: "Sports Fee (Annual)",
          amount: 500,
          dueDate: new Date("2023-04-15"),
          status: "Overdue",
          period: "2023-2024",
          amountPaid: 0,
        });

        this.createFeeDue({
          studentId: student.id,
          feeType: "Transportation",
          description: "Transportation Fee (May 2023)",
          amount: 1200,
          dueDate: new Date("2023-05-10"),
          status: "Due",
          period: "May 2023",
          amountPaid: 0,
        });
      }
    });

    // Create some recent receipts
    Promise.resolve(student2).then((student) => {
      if (student) {
        const receipt = this.createReceipt({
          receiptNumber: "REC5A001",
          studentId: student.id,
          receiptDate: new Date("2023-04-05"),
          totalAmount: 5900,
          paymentMethod: "Online Transfer",
          paymentReference: "UTR123456",
          remarks: "",
          status: "Completed",
        });

        Promise.resolve(receipt).then((rec) => {
          if (rec) {
            this.createReceiptItem({
              receiptId: rec.id,
              feeType: "Tuition",
              description: "Tuition Fee (April 2023)",
              amount: 3000,
              period: "April 2023",
            });

            this.createReceiptItem({
              receiptId: rec.id,
              feeType: "Library",
              description: "Library Fee (Annual)",
              amount: 500,
              period: "2023-2024",
            });

            this.createReceiptItem({
              receiptId: rec.id,
              feeType: "Laboratory",
              description: "Laboratory Fee (Term 1)",
              amount: 700,
              period: "Term 1 2023",
            });

            this.createReceiptItem({
              receiptId: rec.id,
              feeType: "Sports",
              description: "Sports Fee (Annual)",
              amount: 500,
              period: "2023-2024",
            });

            this.createReceiptItem({
              receiptId: rec.id,
              feeType: "Transportation",
              description: "Transportation Fee (April 2023)",
              amount: 1200,
              period: "April 2023",
            });
          }
        });
      }
    });

    // Create more receipts to show in the recent receipts table
    const createSampleReceipt = async (
      admissionNumber: string,
      receiptNumber: string,
      date: Date,
      amount: number,
      method: string,
    ) => {
      const student = Array.from(this.students.values()).find(
        (s) => s.admissionNumber === admissionNumber,
      );

      if (student) {
        const receipt = await this.createReceipt({
          receiptNumber,
          studentId: student.id,
          receiptDate: date,
          totalAmount: amount,
          paymentMethod: method,
          paymentReference:
            method === "Cash"
              ? ""
              : "REF" + Math.floor(Math.random() * 1000000),
          remarks: "",
          status: "Completed",
        });

        await this.createReceiptItem({
          receiptId: receipt.id,
          feeType: "Tuition",
          description: `Tuition Fee (${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()})`,
          amount: amount * 0.6, // 60% of total is tuition
          period: `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`,
        });

        await this.createReceiptItem({
          receiptId: receipt.id,
          feeType: "Transportation",
          description: `Transportation Fee (${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()})`,
          amount: amount * 0.4, // 40% of total is transportation
          period: `${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`,
        });
      }
    };

    // Create sample receipts
    createSampleReceipt(
      "ADM7B0038",
      "REC7B0038",
      new Date("2023-05-12"),
      5900,
      "Online Transfer",
    );
    createSampleReceipt(
      "ADM2023002",
      "REC3A0041",
      new Date("2023-05-12"),
      4200,
      "Cash",
    );
    createSampleReceipt(
      "ADMKG0040",
      "RECKG0040",
      new Date("2023-05-11"),
      3800,
      "UPI",
    );
    createSampleReceipt(
      "ADM10B0039",
      "REC10B0039",
      new Date("2023-05-10"),
      6700,
      "Credit/Debit Card",
    );
  }
}

export const storage = new MemStorage();

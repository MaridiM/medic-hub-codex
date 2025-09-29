import {
  FileRecord,
  Invoice,
  NotificationRecord,
  NotificationTemplate,
  Patient,
  PatientProfile,
  Service,
  Task,
  Tenant,
  User,
  Visit,
} from "./types";

interface DataStore {
  tenants: Tenant[];
  users: User[];
  patients: Patient[];
  patientProfiles: PatientProfile[];
  visits: Visit[];
  services: Service[];
  invoices: Invoice[];
  files: FileRecord[];
  notifications: NotificationRecord[];
  templates: NotificationTemplate[];
  tasks: Task[];
}

const store: DataStore = {
  tenants: [],
  users: [],
  patients: [],
  patientProfiles: [],
  visits: [],
  services: [],
  invoices: [],
  files: [],
  notifications: [],
  templates: [],
  tasks: [],
};

export function getStore() {
  return store;
}

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, MoreHorizontal, Mail, BookOpen, Calendar, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { studentsAPI, departmentsAPI, enrollmentsAPI } from '@/lib/api';

interface Student {
  id?: number;
  studentID?: number;
  firstName?: string;
  firstMidName?: string;
  lastName?: string;
  email?: string;
  enrollmentDate?: string;
  phoneNumber?: string;
  departmentId?: number | null;
  departmentName?: string;
}

interface Enrollment {
  id?: number;
  enrollmentId?: number;
  enrollmentID?: number;
  studentId?: number;
  studentID?: number;
  courseId?: number;
  courseID?: number;
  courseName?: string; // added to fix: Property 'courseName' does not exist on type 'Enrollment'
  enrollmentDate?: string;
  grade?: string | number | null;
}

interface Department {
  departmentID: number;
  name: string;
  budget: number;
  startDate: string;
  instructorID?: number;
  administratorName?: string;
  courseCount: number;
  studentCount: number;
}

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface ParsedStudentRecord {
  firstname?: string;
  firstmidname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  phonenumber?: string;
  enrollmentdate?: string;
  password?: string;
  [key: string]: string | undefined;
}

const Students = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEnrollmentDate, setAddEnrollmentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [addPassword, setAddPassword] = useState('');
  const [addDepartmentId, setAddDepartmentId] = useState<number | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEnrollmentDate, setEditEnrollmentDate] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await studentsAPI.getAll();
      setStudents(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll();
      setDepartments(Array.isArray(response?.data) ? response.data : []);
    } catch (err: unknown) {
      console.error('Failed to load departments:', err);
      // Log more details
      if (err instanceof Error) {
        console.error('Error message:', err.message);
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        console.error('Response error:', (err as ErrorResponse).response?.data);
      }
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await enrollmentsAPI.getAll();
      setEnrollments(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load enrollments', err);
      setEnrollments([]);
    }
  };

  const getStudentEnrollmentSummary = (student: Student) => {
    const sid = student.studentID ?? student.id;
    if (sid == null) return { enrolled: 0, completed: 0, avgGrade: null };
    const studentEnrolls = enrollments.filter(e => (e.studentID ?? e.studentId) === sid);
    const enrolled = studentEnrolls.length;
    const completed = studentEnrolls.filter(e => e.grade !== null && e.grade !== undefined && String(e.grade).trim() !== '').length;
    const grades = studentEnrolls
      .map(e => {
        const g = e.grade;
        const n = typeof g === 'number' ? g : (g ? Number(String(g)) : NaN);
        return Number.isFinite(n) ? n : null;
      })
      .filter((g): g is number => g !== null);
    const avgGrade = grades.length > 0 ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100 : null;
    return { enrolled, completed, avgGrade };
  };

  const handleOpenAdd = () => {
    setAddFirstName(''); setAddLastName(''); setAddEmail(''); setAddPhone('');
    setAddEnrollmentDate(new Date().toISOString().slice(0, 10)); setAddPassword('');
    setAddDepartmentId(null);
    setFormError(null); setOpenAddDialog(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (!addDepartmentId) {
      setFormError('Please select a department.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await studentsAPI.create({
        firstMidName: addFirstName,
        lastName: addLastName,
        email: addEmail,
        phoneNumber: addPhone || undefined,
        enrollmentDate: addEnrollmentDate,
        password: addPassword,
        departmentID: addDepartmentId,
      });
      setOpenAddDialog(false);
      await fetchStudents();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'response' in err ? (err as ErrorResponse).response?.data?.message : 'Failed to create student';
      setFormError(errorMessage ?? 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditFirstName(student.firstMidName ?? student.firstName ?? '');
    setEditLastName(student.lastName ?? '');
    setEditEmail(student.email ?? '');
    setEditPhone(student.phoneNumber ?? '');
    setEditEnrollmentDate(student.enrollmentDate ? student.enrollmentDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEditDepartmentId(student.departmentId ?? null);
    setFormError(null);
    setOpenEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingStudent?.studentID ?? editingStudent?.id;
    if (id == null) return;
    if (!editDepartmentId) {
      setFormError('Please select a department.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await studentsAPI.update(id, {
        id,
        firstMidName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        phoneNumber: editPhone || undefined,
        enrollmentDate: editEnrollmentDate,
        departmentID: editDepartmentId,
      });
      setOpenEditDialog(false);
      setEditingStudent(null);
      await fetchStudents();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'response' in err ? (err as ErrorResponse).response?.data?.message : 'Failed to update student';
      setFormError(errorMessage ?? 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (student: Student) => {
    const id = student.studentID ?? student.id;
    if (id == null) return;
    if (!confirm(`Delete student "${student.firstMidName ?? student.firstName} ${student.lastName}"?`)) return;
    setDeletingId(id);
    try {
      await studentsAPI.delete(id);
      await fetchStudents();
      setSelectedIds(prev => prev.filter(x => x !== id));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'response' in err ? (err as ErrorResponse).response?.data?.message : 'Failed to delete';
      alert(errorMessage ?? 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const allIds = filteredStudents.map(s => s.studentID ?? s.id).filter(Boolean) as number[];
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(allIds);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} selected student(s)?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => studentsAPI.delete(id)));
      await fetchStudents();
      setSelectedIds([]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'response' in err ? (err as ErrorResponse).response?.data?.message : 'Failed to delete selected';
      alert(errorMessage ?? 'Failed to delete selected');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) {
      setFormError('Please select a file');
      return;
    }

    setBulkImporting(true);
    setFormError(null);

    try {
      const data = await parseExcelFile(bulkFile);
      
      if (data.length === 0) {
        setFormError('No valid student records found in file');
        setBulkImporting(false);
        return;
      }

      setBulkProgress(`Processing ${data.length} students...`);

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const record = data[i];
        try {
          setBulkProgress(`Processing ${i + 1} of ${data.length}...`);

          // Validate required fields
          if (!record.firstname && !record.firstmidname) {
            errors.push(`Row ${i + 2}: Missing first name`);
            failedCount++;
            continue;
          }
          if (!record.lastname) {
            errors.push(`Row ${i + 2}: Missing last name`);
            failedCount++;
            continue;
          }
          if (!record.email) {
            errors.push(`Row ${i + 2}: Missing email`);
            failedCount++;
            continue;
          }

          const password = record.password || 'TempPass123!';
          
          // Find department by name if provided
          let departmentId: number | undefined = undefined;
          if (record.department) {
            const dept = departments.find(d => d.name.toLowerCase() === record.department?.toLowerCase());
            if (dept) {
              departmentId = dept.departmentID;
            }
          }

          await studentsAPI.create({
            firstMidName: record.firstname || record.firstmidname,
            lastName: record.lastname,
            email: record.email,
            phoneNumber: record.phone || record.phonenumber || undefined,
            enrollmentDate: record.enrollmentdate || new Date().toISOString().slice(0, 10),
            password: password,
            departmentID: departmentId,
          });

          successCount++;
        } catch (err: unknown) {
          failedCount++;
          const errMsg = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'response' in err ? (err as ErrorResponse).response?.data?.message : 'Unknown error';
          errors.push(`Row ${i + 2}: ${errMsg}`);
        }
      }

      setBulkProgress(`Complete! ${successCount} imported, ${failedCount} failed`);
      
      if (errors.length > 0) {
        setFormError(`Import completed with errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      setOpenBulkDialog(false);
      setBulkFile(null);
      setBulkProgress('');
      await fetchStudents();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import students';
      setFormError(errorMessage);
    } finally {
      setBulkImporting(false);
    }
  };

  const parseExcelFile = (file: File): Promise<ParsedStudentRecord[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // For .xlsx files, you'll need to use a library like xlsx
          // For now, we'll handle CSV format
          const content = e.target?.result as string;
          const lines = content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          const data = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj: ParsedStudentRecord = {};
            headers.forEach((header, idx) => {
              obj[header] = values[idx];
            });
            return obj;
          });

          resolve(data);
        } catch (err) {
          reject(new Error('Failed to parse file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const downloadTemplate = () => {
    // Create CSV template with sample data
    const templateData = [
      ['firstName', 'lastName', 'email', 'phone', 'enrollmentDate', 'password', 'department'],
      ['John', 'Doe', 'john.doe@example.com', '1234567890', '2026-02-11', 'TempPass123', 'Computer Science'],
      ['Jane', 'Smith', 'jane.smith@example.com', '0987654321', '2026-02-11', 'TempPass456', 'Engineering'],
      ['Ahmed', 'Khan', 'ahmed.khan@example.com', '5555555555', '2026-02-11', 'TempPass789', 'Business'],
    ];

    // Convert to CSV format
    const csvContent = templateData
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'students_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = (Array.isArray(students) ? students : []).filter(student =>
    `${student.firstName ?? student.firstMidName ?? ''} ${student.lastName ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    if (status === 'Pending') {
      return 'bg-amber-500/10 text-amber-600';
    }
    return 'bg-success/10 text-success';
  };

  const getStudentStatus = (student: Student) => {
    const { enrolled, completed, avgGrade } = getStudentEnrollmentSummary(student);
    if (enrolled === 0) return 'Pending';
    // Completed only when avg grade is 100
    if (avgGrade !== null && avgGrade >= 100) return 'Completed';
    return 'In-Progress';
  };

  const totalEnrollments = enrollments.length;
  const graduatedCount = (students || []).filter(s => getStudentStatus(s) === 'Completed').length;

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p className="font-semibold">Error Loading Students</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Students</h2>
          <p className="text-muted-foreground">Manage student records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-destructive/10 text-destructive hover:bg-destructive/20" onClick={handleBulkDelete} disabled={selectedIds.length === 0 || bulkDeleting}>
            {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
          </Button>
          <Button className="bg-green-500/10 text-green-600 hover:bg-green-500/20" onClick={downloadTemplate}>
            <Upload className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20" onClick={() => setOpenBulkDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Student</DialogTitle></DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="space-y-2"><Label>First name</Label><Input value={addFirstName} onChange={(e) => setAddFirstName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Last name</Label><Input value={addLastName} onChange={(e) => setAddLastName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Password (min 6)</Label><Input type="password" minLength={6} value={addPassword} onChange={(e) => setAddPassword(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Enrollment date</Label><Input type="date" value={addEnrollmentDate} onChange={(e) => setAddEnrollmentDate(e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={addDepartmentId?.toString() ?? ''} onValueChange={(value) => setAddDepartmentId(value ? parseInt(value) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.departmentID} value={dept.departmentID.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditDialog} onOpenChange={(open) => { if (!open) { setOpenEditDialog(false); setEditingStudent(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="space-y-2"><Label>First name</Label><Input value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Last name</Label><Input value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Phone</Label><Input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Enrollment date</Label><Input type="date" value={editEnrollmentDate} onChange={(e) => setEditEnrollmentDate(e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={editDepartmentId?.toString() ?? ''} onValueChange={(value) => setEditDepartmentId(value ? parseInt(value) : null)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.departmentID} value={dept.departmentID.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openBulkDialog} onOpenChange={setOpenBulkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Import Students from Excel</DialogTitle></DialogHeader>
          <form onSubmit={handleBulkUpload} className="space-y-4">
            {formError && <p className="text-sm text-destructive whitespace-pre-wrap">{formError}</p>}
            {bulkProgress && <p className="text-sm text-blue-600">{bulkProgress}</p>}
            <div className="space-y-2">
              <Label>Select Excel or CSV File</Label>
              <Input 
                type="file" 
                accept=".csv,.xlsx,.xls" 
                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                disabled={bulkImporting}
                required
              />
              <p className="text-xs text-muted-foreground">
                File format: Excel or CSV with columns: firstName, lastName, email, phone (optional), enrollmentDate (optional), password (optional), department (optional - must match exact department name)
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenBulkDialog(false)} disabled={bulkImporting}>Cancel</Button>
              <Button type="submit" disabled={bulkImporting || !bulkFile}>{bulkImporting ? 'Importing...' : 'Import'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{students.length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalEnrollments}</p>
              <p className="text-sm text-muted-foreground">Enrollments</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{graduatedCount}</p>
              <p className="text-sm text-muted-foreground">Graduated</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12 text-center">
                    <input type="checkbox" aria-label="Select all" onChange={toggleSelectAll} checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.includes(s.studentID ?? s.id ?? -1))} />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Enrolled</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">Avg Grade</TableHead>
                  <TableHead>Enrolled </TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.studentID ?? student.id ?? ''} className="hover:bg-muted/50">
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          aria-label={`Select student ${student.firstMidName ?? student.firstName}`}
                          checked={selectedIds.includes((student.studentID ?? student.id) as number)}
                          onChange={() => { const id = student.studentID ?? student.id; if (id) toggleSelect(id); }}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-sm">{student.studentID ?? student.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-primary">
                              {(student.firstName ?? student.firstMidName ?? 'U')[0]}{(student.lastName ?? 'K')[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{student.firstName ?? student.firstMidName} {student.lastName}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{student.departmentName ? student.departmentName : <span className="text-muted-foreground italic">Not assigned</span>}</span>
                      </TableCell>
                      {(() => {
                        const { enrolled, completed, avgGrade } = getStudentEnrollmentSummary(student);
                        const sid = student.studentID ?? student.id;
                        const studentEnrolls = enrollments.filter(e => (e.studentID ?? e.studentId) === sid);

                        // new helpers for lists
                        const completedEnrolls = studentEnrolls.filter(e =>
                          e.grade !== undefined && e.grade !== null && e.grade !== ''
                        );

                        const activeEnrolls = studentEnrolls.filter(e =>
                          !completedEnrolls.includes(e)
                        );

                        return (
                          <>
                            <TableCell className="text-center">
                              {enrolled > 0 ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="px-2">
                                      {enrolled}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    {studentEnrolls.length === 0 ? (
                                      <DropdownMenuItem disabled>No courses</DropdownMenuItem>
                                    ) : (
                                      studentEnrolls.map(e => (
                                        <DropdownMenuItem key={e.id ?? e.enrollmentId ?? `${e.courseId}`}>
                                          {e.courseName ?? `Course ${e.courseId ?? e.courseID ?? ''}`}{e.grade ? ` — ${e.grade}` : ''}
                                        </DropdownMenuItem>
                                      ))
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <span>0</span>
                              )}
                            </TableCell>

                            {/* Completed: show dropdown list of completed enrollments */}
                            <TableCell className="text-center">
                              {completed > 0 ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="px-2">
                                      {completed}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    {completedEnrolls.length === 0 ? (
                                      <DropdownMenuItem disabled>No completed courses</DropdownMenuItem>
                                    ) : (
                                      completedEnrolls.map(e => (
                                        <DropdownMenuItem key={e.id ?? e.enrollmentId ?? `${e.courseId}`}>
                                          {e.courseName ?? `Course ${e.courseId ?? e.courseID ?? ''}`}{e.grade ? ` — ${e.grade}` : ''}
                                        </DropdownMenuItem>
                                      ))
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <span>0</span>
                              )}
                            </TableCell>

                            <TableCell className="text-center">
                              {avgGrade !== null ? <span className="font-medium">{avgGrade}</span> : <span className="text-muted-foreground">-</span>}
                            </TableCell>
                          </>
                        );
                      })()}

                      {/* Active / Status column: show badge that opens dropdown with active enrollments */}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="p-0">
                              <Badge className={getStatusColor(getStudentStatus(student))}>{getStudentStatus(student)}</Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {(() => {
                              const sid = student.studentID ?? student.id;
                              const studentEnrolls = enrollments.filter(e => (e.studentID ?? e.studentId) === sid);
                              const completedEnrolls = studentEnrolls.filter(e =>
                                (e.grade !== undefined && e.grade !== null && e.grade !== '')
                              );
                              const activeEnrolls = studentEnrolls.filter(e =>
                                !completedEnrolls.includes(e)
                              );

                              if (activeEnrolls.length === 0) {
                                return <DropdownMenuItem disabled>No active courses</DropdownMenuItem>;
                              }
                              return activeEnrolls.map(e => (
                                <DropdownMenuItem key={e.id ?? e.enrollmentId ?? `${e.courseId}`}>
                                  {e.courseName ?? `Course ${e.courseId ?? e.courseID ?? ''}`}{e.grade ? ` — ${e.grade}` : ''}
                                </DropdownMenuItem>
                              ));
                            })()}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(student)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(student)} disabled={deletingId === (student.studentID ?? student.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Students;

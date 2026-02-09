import { useState, useEffect } from 'react';
import { Users, Plus, Search, Edit, Trash2, MoreHorizontal, Mail, BookOpen, Calendar } from 'lucide-react';
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
import { studentsAPI } from '@/lib/api';

interface Student {
  id?: number;
  studentID?: number;
  firstName?: string;
  firstMidName?: string;
  lastName?: string;
  email?: string;
  enrollmentDate?: string;
  phoneNumber?: string;
}

const Students = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEnrollmentDate, setAddEnrollmentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [addPassword, setAddPassword] = useState('');
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEnrollmentDate, setEditEnrollmentDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleOpenAdd = () => {
    setAddFirstName(''); setAddLastName(''); setAddEmail(''); setAddPhone('');
    setAddEnrollmentDate(new Date().toISOString().slice(0, 10)); setAddPassword('');
    setFormError(null); setOpenAddDialog(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
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
      });
      setOpenAddDialog(false);
      await fetchStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? err.message ?? 'Failed to create student');
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
    setFormError(null);
    setOpenEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingStudent?.studentID ?? editingStudent?.id;
    if (id == null) return;
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
      });
      setOpenEditDialog(false);
      setEditingStudent(null);
      await fetchStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? err.message ?? 'Failed to update student');
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
    } catch (err: any) {
      alert(err.response?.data?.message ?? err.message ?? 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredStudents = (Array.isArray(students) ? students : []).filter(student =>
    `${student.firstName ?? student.firstMidName ?? ''} ${student.lastName ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    return 'bg-success/10 text-success';
  };

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
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
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
              <p className="text-2xl font-bold text-foreground">0</p>
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
              <p className="text-2xl font-bold text-foreground">0</p>
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
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Enrolled</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">Avg Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.studentID ?? student.id ?? ''} className="hover:bg-muted/50">
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
                      <TableCell className="text-center">0</TableCell>
                      <TableCell className="text-center">0</TableCell>
                      <TableCell className="text-center">
                        <span className="text-muted-foreground">-</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor('Active')}>Active</Badge>
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

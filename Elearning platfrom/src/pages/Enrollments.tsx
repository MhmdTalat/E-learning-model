import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, Edit, Trash2, MoreHorizontal, User, BookOpen, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
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
import { enrollmentsAPI, studentsAPI, coursesAPI } from '@/lib/api';

interface Enrollment {
  id?: number;
  enrollmentId?: number;
  studentId?: number;
  studentID?: number;
  courseId?: number;
  courseID?: number;
  enrollmentDate?: string;
  grade?: string;
  studentName?: string;
  courseName?: string;
}

const Enrollments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [addStudentId, setAddStudentId] = useState('');
  const [addCourseId, setAddCourseId] = useState('');
  const [addGrade, setAddGrade] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchEnrollments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await enrollmentsAPI.getAll();
        
        console.log('[Enrollments API Response]', response);
        
        // Handle the response - ensure it's always an array
        let enrollmentData = response.data;
        if (typeof enrollmentData === 'string') {
          try {
            enrollmentData = JSON.parse(enrollmentData);
          } catch {
            enrollmentData = [];
          }
        }
        if (!Array.isArray(enrollmentData)) {
          enrollmentData = [];
        }
        
        // Map the API response to match Enrollment interface
        const mappedEnrollments: Enrollment[] = enrollmentData.map((e: any) => ({
          id: e.enrollmentId || e.id,
          enrollmentId: e.enrollmentId || e.id,
          studentId: e.studentId || e.studentID,
          courseId: e.courseId || e.courseID,
          enrollmentDate: e.enrollmentDate,
          grade: e.grade,
          studentName: e.studentName,
          courseName: e.courseName,
        }));
        
        console.log('[Mapped Enrollments]', mappedEnrollments);
        setEnrollments(mappedEnrollments);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load enrollments');
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  useEffect(() => {
    if (openAddDialog || openEditDialog) {
      Promise.all([studentsAPI.getAll(), coursesAPI.getAll()])
        .then(([sRes, cRes]) => {
          setStudents(Array.isArray(sRes?.data) ? sRes.data : []);
          setCourses(Array.isArray(cRes?.data) ? cRes.data : []);
        })
        .catch(() => { setStudents([]); setCourses([]); });
    }
  }, [openAddDialog, openEditDialog]);

  const handleOpenAdd = () => {
    setAddStudentId(''); setAddCourseId(''); setAddGrade(''); setFormError(null);
    setOpenAddDialog(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await enrollmentsAPI.create({
        studentID: parseInt(addStudentId, 10),
        courseID: parseInt(addCourseId, 10),
        grade: addGrade.trim() || undefined,
        enrollmentDate: new Date().toISOString().slice(0, 10),
      });
      setOpenAddDialog(false);
      await fetchEnrollments();
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? err.message ?? 'Failed to create enrollment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    setEditGrade(enrollment.grade ?? '');
    setFormError(null);
    setOpenEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingEnrollment?.id ?? editingEnrollment?.enrollmentId;
    if (id == null) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await enrollmentsAPI.update(id, {
        enrollmentID: id,
        studentID: editingEnrollment!.studentId ?? editingEnrollment!.studentID!,
        courseID: editingEnrollment!.courseId ?? editingEnrollment!.courseID!,
        grade: editGrade.trim() || undefined,
        enrollmentDate: (editingEnrollment as any).enrollmentDate ?? new Date().toISOString().slice(0, 10),
      });
      setOpenEditDialog(false);
      setEditingEnrollment(null);
      await fetchEnrollments();
    } catch (err: any) {
      setFormError(err.response?.data?.message ?? err.message ?? 'Failed to update enrollment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (enrollment: Enrollment) => {
    const id = enrollment.id ?? enrollment.enrollmentId;
    if (id == null) return;
    if (!confirm('Remove this enrollment?')) return;
    setDeletingId(id);
    try {
      await enrollmentsAPI.delete(id);
      await fetchEnrollments();
    } catch (err: any) {
      alert(err.response?.data?.message ?? err.message ?? 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEnrollments = (Array.isArray(enrollments) ? enrollments : []).filter(enrollment => {
    const studentId = enrollment.studentId || enrollment.studentID || '';
    const courseId = enrollment.courseId || enrollment.courseID || '';
    return studentId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
           courseId.toString().toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    return 'bg-accent/10 text-accent';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading enrollments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p className="font-semibold">Error Loading Enrollments</p>
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
          <h2 className="text-2xl font-bold text-foreground">Enrollments</h2>
          <p className="text-muted-foreground">Manage course registrations</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          New Enrollment
        </Button>
      </div>

      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Enrollment</DialogTitle></DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="space-y-2">
              <Label>Student</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={addStudentId}
                onChange={(e) => setAddStudentId(e.target.value)}
                required
              >
                <option value="">Select student</option>
                {students.map((s: any) => (
                  <option key={s.id ?? s.studentID} value={s.id ?? s.studentID}>
                    {(s.firstMidName ?? s.firstName ?? '')} {(s.lastName ?? '')} ({s.email ?? ''})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Course</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={addCourseId}
                onChange={(e) => setAddCourseId(e.target.value)}
                required
              >
                <option value="">Select course</option>
                {courses.map((c: any) => (
                  <option key={c.courseID ?? c.id} value={c.courseID ?? c.id}>
                    {c.title ?? c.courseName ?? c.name ?? ''} (ID: {c.courseID ?? c.id})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Grade (optional)</Label>
              <Input type="number" min={0} max={100} step={0.1} value={addGrade} onChange={(e) => setAddGrade(e.target.value)} placeholder="0-100" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditDialog} onOpenChange={(open) => { if (!open) { setOpenEditDialog(false); setEditingEnrollment(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Grade</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <div className="space-y-2">
              <Label>Grade</Label>
              <Input type="number" min={0} max={100} step={0.1} value={editGrade} onChange={(e) => setEditGrade(e.target.value)} placeholder="0-100" />
            </div>
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
              <ClipboardList className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{enrollments.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-sm text-muted-foreground">Dropped</p>
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
              placeholder="Search enrollments..."
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
                  <TableHead>Course</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No enrollments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnrollments.map((enrollment) => (
                    <TableRow key={enrollment.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{enrollment.studentName || `Student ${enrollment.studentId || enrollment.studentID || 'N/A'}`}</div>
                            <div className="text-xs text-muted-foreground">ID: {enrollment.studentId || enrollment.studentID || 'N/A'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">{enrollment.courseName || `Course ${enrollment.courseId || enrollment.courseID || 'N/A'}`}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            Instructor
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>0%</span>
                            {enrollment.grade && <span className="font-semibold text-success">{enrollment.grade}</span>}
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent rounded-full transition-all"
                              style={{ width: '0%' }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor('Active')} flex items-center gap-1 w-fit`}>
                          <Clock className="w-3 h-3" />
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {enrollment.enrollmentDate ? new Date(enrollment.enrollmentDate).toLocaleDateString() : 'N/A'}
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
                            <DropdownMenuItem onClick={() => handleOpenEdit(enrollment)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(enrollment)}
                              disabled={deletingId === (enrollment.id ?? enrollment.enrollmentId)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
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

export default Enrollments;

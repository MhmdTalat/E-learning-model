import { useState, useEffect } from 'react';
import { Building2, Plus, Search, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { departmentsAPI, instructorsAPI, coursesAPI, enrollmentsAPI } from '@/lib/api';

interface ApiResponse<T> {
  data?: T;
}

type ApiResult<T> = T[] | ApiResponse<T[]>;

interface Department {
  departmentId?: number;
  id?: number;
  name?: string;
  budget?: number;
  startDate?: string;
  instructorId?: number | null;
  administratorName?: string | null;
  courseCount?: number;
  studentCount?: number;
  instructorCount?: number;
  administrator?: Record<string, unknown>;
  courses?: Record<string, unknown>[];
  instructors?: Record<string, unknown>[];
}

const Departments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [instructors, setInstructors] = useState<{ instructorID?: number; id?: number; firstMidName?: string; firstName?: string; lastName?: string }[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('0');
  const [newStartDate, setNewStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [editName, setEditName] = useState('');
  const [editBudget, setEditBudget] = useState('0');
  const [editStartDate, setEditStartDate] = useState('');
  const [editInstructorId, setEditInstructorId] = useState<string>('');

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all required data in parallel
      const [deptResponse, coursesData, enrollmentsData, instructorsData] = (await Promise.all([
        departmentsAPI.getAll(),
        coursesAPI.getAll(),
        enrollmentsAPI.getAll(),
        instructorsAPI.getAll(),
      ])) as [ApiResult<Record<string, unknown>>, ApiResult<Record<string, unknown>>, ApiResult<Record<string, unknown>>, ApiResult<Record<string, unknown>>];

      // Get department array
      let deptArray = Array.isArray(deptResponse) ? deptResponse : (deptResponse?.data || []);
      if (typeof deptArray === 'string') {
        try {
          deptArray = JSON.parse(deptArray);
        } catch {
          deptArray = [];
        }
      }
      if (!Array.isArray(deptArray)) deptArray = [];

      // Create maps for aggregation
      const coursesMap: Record<string, number> = {}; // deptId -> course count
      const studentsPerDept: Record<string, Set<string>> = {}; // deptId -> Set of studentIds
      const instructorsPerDept: Record<string, Set<string>> = {}; // deptId -> Set of instructorIds

      // Process courses - map courses to departments
      const coursesList = Array.isArray(coursesData) ? coursesData : (coursesData?.data || []);
      coursesList.forEach((course: Record<string, unknown>) => {
        const deptId = (course.departmentID ?? course.departmentId)?.toString() || '';
        if (deptId) {
          coursesMap[deptId] = (coursesMap[deptId] || 0) + 1;
        }
      });

      // Process enrollments - count students per department
      const enrollmentsList = Array.isArray(enrollmentsData) ? enrollmentsData : (enrollmentsData?.data || []);
      enrollmentsList.forEach((enrollment: Record<string, unknown>) => {
        const courseId = (enrollment.courseID ?? enrollment.courseId)?.toString() || '';
        const studentId = (enrollment.studentID ?? enrollment.studentId)?.toString() || '';
        
        // Find which department this course belongs to
        const course = coursesList.find(
          (c: Record<string, unknown>) => (c.courseID ?? c.courseId ?? c.id)?.toString() === courseId
        );
        
        if (course && studentId) {
          const deptId = (course.departmentID ?? course.departmentId)?.toString() || '';
          if (deptId) {
            if (!studentsPerDept[deptId]) studentsPerDept[deptId] = new Set();
            studentsPerDept[deptId].add(studentId);
          }
        }
      });

      // Process instructors - count per department
      const instructorsList = Array.isArray(instructorsData) ? instructorsData : (instructorsData?.data || []);
      instructorsList.forEach((instructor: Record<string, unknown>) => {
        const deptId = (instructor.departmentID ?? instructor.departmentId)?.toString() || '';
        if (deptId) {
          if (!instructorsPerDept[deptId]) instructorsPerDept[deptId] = new Set();
          instructorsPerDept[deptId].add((instructor.instructorID ?? instructor.instructorId ?? instructor.id)?.toString() || '');
        }
      });

      // Map departments with aggregated counts
      const mappedDepts: Department[] = deptArray.map((dept: Record<string, unknown>) => {
        const deptId = (dept.departmentID ?? dept.departmentId ?? dept.id)?.toString();
        const admin = dept.administrator as Record<string, unknown> | undefined;
        return {
          departmentId: dept.departmentID ?? dept.departmentId ?? dept.id,
          id: dept.departmentID ?? dept.departmentId ?? dept.id,
          name: dept.name || '',
          budget: dept.budget,
          startDate: dept.startDate,
          instructorId: dept.instructorID ?? dept.instructorId,
          administratorName: dept.administratorName ?? (admin ? `${admin.firstMidName ?? ''} ${admin.lastName ?? ''}`.trim() : null),
          courseCount: coursesMap[deptId] ?? 0,
          studentCount: studentsPerDept[deptId]?.size ?? 0,
          instructorCount: instructorsPerDept[deptId]?.size ?? 0,
          administrator: dept.administrator,
          courses: dept.courses,
          instructors: dept.instructors,
        };
      });
      
      setDepartments(mappedDepts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load departments');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (openEditDialog) {
      instructorsAPI.getAll()
        .then((res: ApiResult<Record<string, unknown>>) => {
          const data = Array.isArray(res) ? res : (res?.data || []);
          setInstructors(data as Array<{ instructorID?: number; id?: number; firstMidName?: string; firstName?: string; lastName?: string }>);
        })
        .catch(() => setInstructors([]));
    }
  }, [openEditDialog]);

  const handleOpenAdd = () => {
    setCreateError(null);
    setNewName('');
    setNewBudget('0');
    setNewStartDate(new Date().toISOString().slice(0, 10));
    setOpenAddDialog(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const budget = parseFloat(newBudget);
      if (Number.isNaN(budget) || budget < 0) {
        setCreateError('Budget must be a non-negative number.');
        return;
      }
      await departmentsAPI.create({
        name: newName.trim(),
        budget: Number(budget),
        startDate: newStartDate || new Date().toISOString().slice(0, 10),
        instructorID: null,
      });
      setOpenAddDialog(false);
      await fetchDepartments();
    } catch (err: unknown) {
      const msg = (err as Record<string, unknown>)?.response?.data?.message ?? (err as Record<string, unknown>)?.response?.data?.inner ?? (err as Record<string, unknown>)?.message ?? 'Failed to create department';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setEditName(dept.name ?? '');
    setEditBudget(String(dept.budget ?? 0));
    setEditStartDate(dept.startDate ? dept.startDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setEditInstructorId(dept.instructorId != null ? String(dept.instructorId) : '');
    setEditError(null);
    setOpenEditDialog(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept?.departmentId && editingDept?.id == null) return;
    setEditError(null);
    setUpdating(true);
    const id = editingDept!.departmentId ?? editingDept!.id!;
    try {
      const budget = parseFloat(editBudget);
      if (Number.isNaN(budget) || budget < 0) {
        setEditError('Budget must be a non-negative number.');
        return;
      }
      await departmentsAPI.update({
        departmentID: id,
        name: editName.trim(),
        budget: Number(budget),
        startDate: editStartDate || new Date().toISOString().slice(0, 10),
        instructorID: editInstructorId ? parseInt(editInstructorId, 10) : null,
      });
      setOpenEditDialog(false);
      setEditingDept(null);
      await fetchDepartments();
    } catch (err: unknown) {
      const errObj = err as Record<string, unknown>;
      setEditError(errObj?.response?.data?.message ?? errObj?.response?.data?.inner ?? errObj?.message ?? 'Failed to update department');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    const id = dept.departmentId ?? dept.id;
    if (id == null) return;
    if (!confirm(`Delete department "${dept.name || 'N/A'}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await departmentsAPI.delete(id);
      await fetchDepartments();
    } catch (err: unknown) {
      const msg = (err as Record<string, unknown>)?.response?.data?.message ?? (err as Record<string, unknown>)?.message ?? 'Failed to delete department';
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDepartments = (Array.isArray(departments) ? departments : [])
    .filter(dept => {
      const deptName = (dept.name || '').toLowerCase();
      return deptName.includes(searchTerm.toLowerCase());
    });

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading departments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          <p className="font-semibold">Error Loading Departments</p>
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
          <h2 className="text-2xl font-bold text-foreground">Departments</h2>
          <p className="text-muted-foreground">Manage academic departments</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="dept-name">Name</Label>
              <Input
                id="dept-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Department name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-budget">Budget</Label>
              <Input
                id="dept-budget"
                type="number"
                min={0}
                step={1000}
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-start">Start Date</Label>
              <Input
                id="dept-start"
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openEditDialog} onOpenChange={(open) => { if (!open) { setOpenEditDialog(false); setEditingDept(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <div className="space-y-2">
              <Label htmlFor="edit-dept-name">Name</Label>
              <Input id="edit-dept-name" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Department name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-budget">Budget</Label>
              <Input id="edit-dept-budget" type="number" min={0} step={1000} value={editBudget} onChange={(e) => setEditBudget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-start">Start Date</Label>
              <Input id="edit-dept-start" type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-head">Head (Instructor)</Label>
              <select
                id="edit-dept-head"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={editInstructorId}
                onChange={(e) => setEditInstructorId(e.target.value)}
              >
                <option value="">— None —</option>
                {instructors.map((i) => (
                  <option key={i.instructorID ?? i.id ?? ''} value={i.instructorID ?? i.id ?? ''}>
                    {(i.firstMidName ?? i.firstName ?? '')} {(i.lastName ?? '')}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={updating}>{updating ? 'Saving...' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{departments.length}</p>
                <p className="text-sm text-muted-foreground">Total Departments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Building2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{departments.reduce((sum, dept) => sum + (dept.courseCount ?? 0), 0)}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{departments.reduce((sum, dept) => sum + (dept.studentCount ?? 0), 0)}</p>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Department</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Head</TableHead>
                  <TableHead className="text-center">Courses</TableHead>
                  <TableHead className="text-center">Instructors</TableHead>
                  <TableHead className="text-center">Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No departments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartments.map((dept) => (
                    <TableRow key={dept.departmentId ?? dept.id ?? dept.name ?? ''} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{dept.name || 'N/A'}</TableCell>
                      <TableCell>{dept.departmentId ?? dept.id ?? '—'}</TableCell>
                      <TableCell>{dept.administratorName || '—'}</TableCell>
                      <TableCell className="text-center">{dept.courseCount ?? 0}</TableCell>
                      <TableCell className="text-center">{dept.instructorCount ?? 0}</TableCell>
                      <TableCell className="text-center">{dept.studentCount ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(dept)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(dept)}
                              disabled={deletingId === (dept.departmentId ?? dept.id)}
                            >
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

export default Departments;

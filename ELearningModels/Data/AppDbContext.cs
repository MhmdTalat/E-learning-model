using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ELearningModels.model;

namespace ELearningModels.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        { }

        public DbSet<Department> Departments => Set<Department>();
        public DbSet<Course> Courses => Set<Course>();
        public DbSet<Enrollment> Enrollments => Set<Enrollment>();
        public DbSet<Instructor> Instructors => Set<Instructor>();
        public DbSet<OfficeAssignment> OfficeAssignments => Set<OfficeAssignment>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // 1. OfficeAssignment → 1-to-0..1 with Instructor
            builder.Entity<OfficeAssignment>()
                .HasOne(o => o.Instructor)
                .WithOne(i => i.OfficeAssignment)
                .HasForeignKey<OfficeAssignment>(o => o.InstructorID)
                .OnDelete(DeleteBehavior.Cascade);

            // 2. Course ↔ Instructor many-to-many
            builder.Entity<Course>()
                .HasMany(c => c.Instructors)
                .WithMany(i => i.Courses)
                .UsingEntity(
                    "CourseInstructor",
                    l => l.HasOne(typeof(Instructor)).WithMany().HasForeignKey("InstructorID").HasPrincipalKey("InstructorID"),
                    r => r.HasOne(typeof(Course)).WithMany().HasForeignKey("CourseID").HasPrincipalKey("CourseID"),
                    j => j.ToTable("CourseInstructor")
                );
            // 3. Instructors who BELONG to a department (DepartmentID in Instructor table)
            builder.Entity<Instructor>()
                .HasOne(i => i.Department)
                .WithMany(d => d.Instructors)
                .HasForeignKey(i => i.DepartmentID)
                .OnDelete(DeleteBehavior.SetNull);

            // 4. Department Administrator (InstructorID in Department table)
            builder.Entity<Department>()
                .HasOne(d => d.Administrator)
                .WithMany(i => i.DepartmentsAdministered)
                .HasForeignKey(d => d.InstructorID)
                .OnDelete(DeleteBehavior.SetNull); // FK اختياري

            // 5. One enrollment per student per course
            builder.Entity<Enrollment>()
                .HasIndex(e => new { e.StudentID, e.CourseID })
                .IsUnique();

            builder.Entity<ApplicationUser>()
                .HasOne(a => a.Department)
                .WithMany(d => d.Students)
                .HasForeignKey(a => a.DepartmentID)
                .OnDelete(DeleteBehavior.SetNull);
        }
    }
}

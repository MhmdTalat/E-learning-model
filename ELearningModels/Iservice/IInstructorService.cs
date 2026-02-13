using ELearningModels.DTO;
using ELearningModels.model;

namespace ELearningModels.Iservice
{
    public interface IInstructorService
    {
        Task<IEnumerable<Instructor>> GetAllAsync();
        Task<InstructorCreateDto?> GetByIdAsync(int id);
        Task<Instructor> CreateAsync(InstructorCreateDto dto);
        Task<InstructorCreateDto?> UpdateAsync(InstructorCreateDto dto);
        Task<bool> DeleteAsync(int id);

        // New methods for instructor enrollments
        Task<IEnumerable<object>> GetInstructorCoursesAsync();
        Task<IEnumerable<object>> GetAvailableCoursesAsync(int instructorId);
        Task<bool> AssignCourseAsync(int instructorId, int courseId);
        Task<bool> RemoveEnrollmentAsync(int enrollmentId);
    }
}

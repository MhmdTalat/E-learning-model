using ELearningModels.DTO;
using ELearningModels.model;

namespace ELearningModels.Iservice
{
    public interface IEnrollmentService
    {
        Task<IEnumerable<EnrollmentCreateDto>> GetAllAsync();
        Task<EnrollmentCreateDto?> GetByIdAsync(int id);
        Task<Enrollment> CreateAsync(EnrollmentCreateDto dto);
        Task<EnrollmentCreateDto?> UpdateAsync(EnrollmentCreateDto dto);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<EnrollmentCreateDto>> GetEnrollmentsByStudentAsync(int studentId);
        Task<IEnumerable<EnrollmentCreateDto>> GetEnrollmentsByCourseAsync(int courseId);
    }
}
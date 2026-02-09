using ELearningModels.DTO;
using ELearningModels.model;

namespace ELearningModels.Iservice
{
    public interface IInstructorService
    {
        Task<IEnumerable<Instructor>> GetAllAsync();
        // Returns a single instructor or null if not found
        Task<InstructorCreateDto?> GetByIdAsync(int id);
        Task<Instructor> CreateAsync(InstructorCreateDto dto);
        Task<InstructorCreateDto?> UpdateAsync(InstructorCreateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
